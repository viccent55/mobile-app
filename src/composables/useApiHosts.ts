// composables/useApiHosts.ts
import { ref } from "vue";
import { CapacitorHttp } from "@capacitor/core";
import { decryptData } from "@/utils/hosts";
import { useStore } from "@/stores";
import { useLoggerStore } from "@/stores/logger";
import { useDecryption } from "@/composables/useDecryption";

const TIMEOUT = 4000;

// 🔹 shared refs (one instance for whole app)
const loading = ref(false);
const failedHosts = ref<string[]>([]);
const failedClouds = ref<string[]>([]);

// Native HTTP helper – returns ONLY res.data
async function postJsonNative(url: string) {
  try {
    const res = await CapacitorHttp.post({
      url,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
    });
    return res.data ?? null;
  } catch {
    return null;
  }
}
async function fetchJsonNative(url: string) {
  try {
    const res = await CapacitorHttp.get({
      url,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
    });
    return res.data ?? null;
  } catch {
    return null;
  }
}

export function useApiHosts() {
  const store = useStore();
  const logger = useLoggerStore();
  const { decryptImage, decryptedImage, blobUrlToBase64 } = useDecryption();

  const isUrl = (u: string) =>
    typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"));

  const clean = (u: string) => u.replace(/\/+$/, "");

  // ---------------------------------------------------------------------
  // 1. resolveApiHost – try store.hosts in order
  // ---------------------------------------------------------------------
  async function resolveApiHost() {
    logger.log("🔍 Starting direct API host check…");

    const list = [...store.hosts];

    for (const host of list) {
      logger.log(`→ Checking host: ${host}`);

      if (!isUrl(host)) {
        logger.log("✗ Invalid URL, skipping");
        failedHosts.value.push(host);
        store.hosts = store.hosts.filter((h) => h !== host);
        continue;
      }

      const url = clean(host) + "/apiv1/latest-redbook-conf";
      const raw = await postJsonNative(url);
      if (raw?.errcode == 0) {
        logger.log(`✔ SUCCESS host: ${host}`);
        store.apiEndPoint = host;
        store.mainAds = raw.data?.advert;
        await decryptImage(store.mainAds?.image);
        store.baseImage64 = await blobUrlToBase64(decryptedImage.value);
        const newHosts: string[] = Array.isArray(raw.data?.urls) ? raw.data.urls : [];

        const merged = new Set<string>();
        // working host first
        merged.add(host);
        // new hosts from backend
        for (const h of newHosts) {
          if (typeof h === "string" && isUrl(h)) merged.add(clean(h));
        }
        // old hosts that didn't fail
        for (const old of store.hosts) {
          if (!failedHosts.value.includes(old)) merged.add(clean(old));
        }
        store.hosts = Array.from(merged);

        logger.log(`✔ Updated host list: ${store.hosts.join(", ")}`);

        return host;
      }

      logger.log(`✗ Failed host: ${host}`);
      failedHosts.value.push(host);
      store.hosts = store.hosts.filter((h) => h !== host);
    }

    logger.log("✗ All direct hosts failed.");
    store.apiEndPoint = "";
    store.hosts = [];
    return null;
  }

  // ---------------------------------------------------------------------
  // 2. resolveCloudHost – fallback to cloud URLs ({ name, value }[])
  // ---------------------------------------------------------------------
  async function resolveCloudHost() {
    logger.log("☁ Starting cloud fallback…");
    store.hosts = [];

    for (const cloud of store.clouds) {
      const name = cloud.name;
      const url = cloud.value;

      logger.log(`→ Testing cloud: ${name} (${url})`);

      const raw = await fetchJsonNative(url);

      if (!raw) {
        logger.log(`✗ Cloud fetch failed: ${name}`);
        failedClouds.value.push(url);
        continue;
      }

      let list: any[] = [];
      try {
        list = Array.isArray(raw) ? raw : JSON.parse(raw);
      } catch (e) {
        logger.log(`✗ Cloud JSON parse failed: ${name}`);
        failedClouds.value.push(url);
        continue;
      }

      const hosts: string[] = [];
      for (const item of list) {
        const dec = decryptData(item);
        console.log("dec => ....", dec);
        if (isUrl(dec)) {
          hosts.push(dec);
        }
      }

      if (!hosts.length) {
        logger.log(`✗ No valid decrypted hosts from cloud: ${name}`);
        failedClouds.value.push(url);
        continue;
      }

      logger.log(`✔ Cloud ${name} decrypted ${hosts.length} hosts.`);
      store.hosts = hosts;

      logger.log("→ Testing decrypted hosts from cloud…");
      const working = await resolveApiHost();
      if (working) {
        logger.log(`🎉 Working host found from cloud (${name}): ${working}`);
        return working;
      }

      logger.log(`✗ All decrypted hosts failed for cloud: ${name}`);
      failedClouds.value.push(url);
    }

    logger.log("❌ All clouds failed.");
    return null;
  }

  // ---------------------------------------------------------------------
  // 3. INIT – call this onMounted
  // ---------------------------------------------------------------------
  async function initApiHosts() {
    // prevent multiple parallel inits
    if (loading.value) return store.apiEndPoint || null;

    logger.clear();
    loading.value = true;
    logger.log("🚀 Starting full host resolution…");

    try {
      const direct = await resolveApiHost();
      if (direct) {
        logger.log("✅ Host resolving finished (direct).");
        return direct;
      }

      logger.log("→ Switching to cloud fallback…");
      const cloud = await resolveCloudHost();
      logger.log("✅ Host resolving finished (cloud fallback).");
      return cloud;
    } finally {
      // 🔥 loading stays true until ALL logs / work are done
      loading.value = false;
    }
  }

  return {
    loading,
    failedHosts,
    failedClouds,
    resolveApiHost,
    resolveCloudHost,
    initApiHosts,
  };
}
