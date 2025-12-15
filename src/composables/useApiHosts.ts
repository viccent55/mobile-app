// composables/useApiHosts.ts
import { ref } from "vue";
import { decryptData } from "@/utils/hosts";
import { useStore } from "@/stores";
import { useLoggerStore } from "@/stores/logger";
import { useDecryption } from "@/composables/useDecryption";
import { useApiClient } from "@/composables/useApiClient";
import { getRegion } from "@/service";

// 🔹 shared refs (one instance for whole app)
const loading = ref(false);
const failedHosts = ref<string[]>([]);
const failedClouds = ref<string[]>([]);

// Native HTTP helper – returns ONLY res.data
async function postJsonNative(url: string) {
  const api = useApiClient();
  try {
    const res = await api.post(url);
    return res ?? null;
  } catch {
    return null;
  }
}
async function fetchJsonNative(url: string) {
  const api = useApiClient();
  try {
    const res = await api.getCloud(url);
    return res ?? null;
  } catch {
    return null;
  }
}

// Extract hostname from full URL like "https://abc.com/path"
function getDomainFromUrl(u: string): string {
  try {
    const url = new URL(u);
    return url.hostname; // e.g. "example.com"
  } catch {
    // if u is not valid URL, just return raw string
    return u;
  }
}

// 🔹 report failed domain (fire-and-forget; don't break anything if it fails)
async function reportFailedDomain(host: string) {
  const api = useApiClient();
  const domain = getDomainFromUrl(host);
  const accessTime = Math.floor(Date.now() / 1000);
  // Region: you can later make this dynamic (e.g. from store or device locale)
  const region = await getRegion();

  const payload = {
    domain,
    region,
    access_time: accessTime,
  };
  try {
    await api.post(`${import.meta.env.VITE_REPORT_API_DOMAIN}/apiv1/domain/log`, payload);
    // Optional: use logger if you want
    const logger = useLoggerStore();
    logger.log(`📡 Reported failed domain: ${domain}`);
  } catch (e) {
    const logger = useLoggerStore();
    console.log(e);
    logger.log(`⚠ Failed to report domain: ${domain}`);
  }
}

export function useApiHosts() {
  const store = useStore();
  const logger = useLoggerStore();
  const { decryptImage, decryptedImage, blobUrlToBase64 } = useDecryption();

  const isUrl = (u: string) =>
    typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"));
  const clean = (u: string) => u.replace(/\/+$/, "");

  // Helper: check which frontend URL is alive
  async function checkFrontendUrl(url: string): Promise<boolean> {
    const testUrl = clean(url);
    const api = useApiClient();

    try {
      const res = await api.checkFrontendUrl(testUrl);
      return res;
    } catch (e) {
      console.warn("checkFrontendUrl error:", e);
      return false;
    }
  }

  // ---------------------------------------------------------------------
  // 1. resolveApiHost – try store.apiHosts in order
  // ---------------------------------------------------------------------
  async function resolveApiHost() {
    logger.log("🔍 Starting direct API host check…");
    const list = [...store.apiHosts];

    for (const host of list) {
      logger.log(`→ Checking host: ${host}`);

      if (!isUrl(host)) {
        logger.log("✗ Invalid URL, skipping");
        failedHosts.value.push(host);
        store.apiHosts = store.apiHosts.filter((h) => h !== host);
        void reportFailedDomain(host);
        continue;
      }

      const url = clean(host) + "/apiv1/latest-redbook-conf";
      const raw = await postJsonNative(url);

      if (raw?.errcode == 0) {
        logger.log(`✔ SUCCESS host: ${host}`);
        console.log('success return data', raw.data);

        // ✅ API endpoint: this is still your API base host
        store.apiEndPoint = host;

        // ✅ Ads decrypt (with detailed logs)
        if (raw.data?.advert) {
          logger.log("🟡 Advert data detected from API");

          const newImage = raw.data.advert.image;
          const oldImage = store.ads.image;
          logger.log(`→ Old ad image: ${oldImage || "(empty)"}`);
          logger.log(`→ New ad image: ${newImage || "(empty)"}`);
          store.ads.image = newImage;
          store.ads.position = raw.data.advert.position;
          store.ads.url = raw.data.advert.url;
          store.ads.name = raw.data.advert.name;
          // ✅ only decrypt if image changed
          if (newImage && newImage !== oldImage) {
            logger.log("🔄 New ad image detected → start decrypting...");
            await decryptImage(newImage);
            logger.log("✅ Image decrypted successfully");
            store.ads.base64 = await blobUrlToBase64(decryptedImage.value);
            logger.log("✅ Image converted to Base64 and stored");
          } else {
            logger.log("⏭ No new ad image detected → skip decrypt & transform");
          }
        } else {
          logger.log("⚪ No advert data returned from API");
        }

        // ✅ NEW: handle frontend URLs separately (do NOT mix with apiHosts)
        const backendUrls: string[] = Array.isArray(raw.data?.urls) ? raw.data.urls : [];

        // Filter + clean valid urls
        const cleanedUrls = backendUrls
          .filter((u) => typeof u === "string" && isUrl(u))
          .map((u) => clean(u));

        // Save all candidates
        store.urls = cleanedUrls;

        // 🔍 NEW: try all cleanedUrls until one works (favicon check)
        let workingFront: string | null = null;

        for (const front of cleanedUrls) {
          logger.log(`→ Checking front URL: ${front}`);
          const ok = await checkFrontendUrl(front);
          if (ok) {
            workingFront = front;
            logger.log(`✔ Front URL OK: ${front}`);
            break;
          } else {
            logger.log(`✗ Front URL failed: ${front}`);
          }
        }

        // If none works, clear; else use the first working one
        store.urlEndPoint = workingFront || "";
        if (!workingFront) {
          logger.log("✗ No working front URL found from config.");
        } else {
          logger.log(`✔ Using front URL: ${store.urlEndPoint}`);
        }

        // ✅ Keep apiHosts ONLY as API hosts (no mixing with urls)
        const mergedApiHosts = new Set<string>();

        // working API host first
        mergedApiHosts.add(clean(host));

        // old apiHosts that didn't fail
        for (const old of store.apiHosts) {
          if (!failedHosts.value.includes(old)) {
            mergedApiHosts.add(clean(old));
          }
        }

        store.apiHosts = Array.from(mergedApiHosts);
        logger.log(`✔ Updated API host list: ${store.apiHosts.join(", ")}`);
        logger.log(
          `✔ Updated front URLs: ${store.urls.join(", ")} (urlEndPoint = ${store.urlEndPoint})`
        );

        return host;
      }

      logger.log(`✗ Failed host: ${host}`);
      failedHosts.value.push(host);
      store.apiHosts = store.apiHosts.filter((h) => h !== host);
      void reportFailedDomain(host);
    }

    logger.log("✗ All direct hosts failed.");
    store.apiEndPoint = "";
    store.apiHosts = [];
    return null;
  }

  // ---------------------------------------------------------------------
  // 2. resolveCloudHost – fallback to cloud URLs ({ name, value }[])
  // ---------------------------------------------------------------------
  async function resolveCloudHost() {
    logger.log("☁ Starting cloud fallback…");
    store.apiHosts = [];

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
      store.apiHosts = hosts;

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
