// composables/useApiHosts.ts
import { ref } from "vue";
import { decryptData } from "@/utils/hosts";
import { useStore } from "@/stores";
import { useLoggerStore } from "@/stores/logger";
import { useDecryption } from "@/composables/useDecryption";
import { useApiClient } from "@/composables/useApiClient";
import { getRegion } from "@/service";

/* ----------------------------------------------------
 * Shared state (singleton across app)
 * -------------------------------------------------- */
const loading = ref(false);
const failedHosts = ref<string[]>([]);
const failedClouds = ref<string[]>([]);

/* ----------------------------------------------------
 * Helpers
 * -------------------------------------------------- */
const isUrl = (u: string) =>
  typeof u === "string" && (u.startsWith("http://") || u.startsWith("https://"));

const clean = (u: string) => u.replace(/\/+$/, "");

function pushUnique(arr: string[], v: string) {
  if (!arr.includes(v)) arr.push(v);
}

function getDomainFromUrl(u: string) {
  try {
    if (!u.startsWith("http")) return u;
    return new URL(u).hostname;
  } catch {
    return u;
  }
}

type TimedResult<T> = {
  value: T;
  time: number;
};

async function withTiming<T>(fn: () => Promise<T>): Promise<TimedResult<T> | null> {
  const start = performance.now();
  try {
    const value = await fn();
    return { value, time: performance.now() - start };
  } catch {
    return null;
  }
}

/* ----------------------------------------------------
 * Native HTTP helpers (Capacitor-safe)
 * -------------------------------------------------- */
async function postJsonNative(url: string) {
  try {
    const api = useApiClient();
    return (await api.post(url)) ?? null;
  } catch {
    return null;
  }
}

async function fetchJsonNative(url: string) {
  try {
    const api = useApiClient();
    return (await api.getCloud(url)) ?? null;
  } catch {
    return null;
  }
}

/* ----------------------------------------------------
 * Report failed domain (fire & forget)
 * -------------------------------------------------- */
async function reportFailedDomain(host: string) {
  try {
    const reportApi = import.meta.env?.VITE_REPORT_API_DOMAIN;
    if (!reportApi) return;

    const api = useApiClient();
    await api.post(`${reportApi}/apiv1/domain/log`, {
      domain: getDomainFromUrl(host),
      region: await getRegion(),
      access_time: Math.floor(Date.now() / 1000),
    });
  } catch {
    /* silent */
  }
}

/* ====================================================
 * MAIN COMPOSABLE
 * =================================================== */
export function useApiHosts() {
  const store = useStore();
  const logger = useLoggerStore();
  const { decryptImage, decryptedImage, blobUrlToBase64 } = useDecryption();

  /* --------------------------------------------------
   * Check frontend URL
   * ------------------------------------------------ */
  async function checkFrontendUrl(url: string) {
    try {
      const api = useApiClient();
      return await api.checkFrontendUrl(clean(url));
    } catch {
      return false;
    }
  }

  /* --------------------------------------------------
   * 1. resolveApiHost (FASTEST WINS)
   * ------------------------------------------------ */
  async function resolveApiHost() {
    logger.log("🔍 Checking API hosts (fastest wins)…");

    const candidates = store.apiHosts.filter(isUrl);

    if (!candidates.length) {
      logger.log("⚠ No API hosts available to check");
      return null;
    }

    const results = await Promise.all(
      candidates.map((host) =>
        withTiming(async () => {
          const apiUrl = `${clean(host)}/apiv1/latest-redbook-conf`;
          const raw = await postJsonNative(apiUrl);

          if (!raw || raw.errcode !== 0 || !raw.data) {
            throw new Error("fail");
          }

          return { host: clean(host), raw };
        })
      )
    );

    const valid = results
      .filter((r): r is TimedResult<{ host: string; raw: any }> => r !== null)
      .sort((a, b) => a.time - b.time);

    if (!valid.length) {
      logger.log("❌ All API hosts failed (direct check)");

      for (const h of candidates) {
        pushUnique(failedHosts.value, h);
        void reportFailedDomain(h);
        logger.log(`✗ Mark API host failed: ${h}`);
      }

      store.apiEndPoint = "";
      store.apiHosts = [];
      return null;
    }

    const [fastest] = valid;
    if (!fastest) return null;

    const host = fastest.value.host;
    const raw = fastest.value.raw;

    logger.log(`⚡ Fastest API host: ${host} (${fastest.time.toFixed(0)}ms)`);
    store.apiEndPoint = host;

    /* ---------- Ads (image) ---------- */
    const advert = raw.data?.advert;
    if (advert?.image && advert.image !== store.ads.image) {
      logger.log("🟡 New advert detected → decrypting");

      store.ads = {
        ...store.ads,
        image: advert.image,
        url: advert.url,
        name: advert.name,
        position: advert.position,
      };

      try {
        await decryptImage(advert.image);
        if (decryptedImage.value) {
          store.ads.base64 = await blobUrlToBase64(decryptedImage.value);
          logger.log("✅ Advert image decrypted & stored");
        }
      } catch {
        logger.log("⚠ Advert decrypt failed");
      }
    }

    /* =================================================
     * 🔐 Decrypt apis (LOG EVERYTHING)
     * ================================================= */
    const apis = raw.data?.apis;

    if (Array.isArray(apis) && apis.length) {
      logger.log(`🔐 Decrypting apis list (${apis.length})`);

      let added = 0;
      let duplicated = 0;

      for (const [index, item] of apis.entries()) {
        try {
          const dec = decryptData(item);

          if (!isUrl(dec)) {
            logger.log(`✗ apis[${index}] invalid after decrypt`);
            continue;
          }

          const cleaned = clean(dec);

          if (store.apiHosts.includes(cleaned)) {
            duplicated++;
            logger.log(`↺ apis[${index}] duplicate → ${cleaned}`);
          } else {
            store.apiHosts.push(cleaned);
            added++;
            logger.log(`✔ apis[${index}] added → ${cleaned}`);
          }
        } catch (e) {
          logger.log(`✗ apis[${index}] decrypt failed`);
        }
      }
      logger.log(`📊 apis summary: total=${apis.length}, added=${added}, duplicate=${duplicated}`);
    } else {
      logger.log("ℹ No apis field returned from API");
    }

    /* ---------- Frontend URLs (FASTEST + LOGS) ---------- */
    const fronts = Array.isArray(raw.data?.urls) ? raw.data.urls.filter(isUrl).map(clean) : [];

    store.urls = fronts;

    logger.log(`🌐 Frontend URLs received: ${fronts.length}`);

    if (!fronts.length) {
      logger.log("✗ No frontend URLs provided by API");
    }

    const frontResults = await Promise.all(
      fronts.map((f, index) =>
        withTiming(async () => {
          const ok = await checkFrontendUrl(f);
          if (!ok) throw new Error("fail");
          return f;
        }).then((r) => ({ index, url: f, result: r }))
      )
    );

    const success: { url: string; time: number }[] = [];

    for (const r of frontResults) {
      if (r.result) {
        logger.log(`✔ front[${r.index}] OK → ${r.url} (${r.result.time.toFixed(0)}ms)`);
        success.push({ url: r.url, time: r.result.time });
      } else {
        logger.log(`✗ front[${r.index}] FAILED → ${r.url}`);
        void reportFailedDomain(r.url);
      }
    }

    if (!success.length) {
      store.urlEndPoint = "";
      logger.log("❌ No working frontend URL found");
    } else {
      success.sort((a, b) => a.time - b.time);
      store.urlEndPoint = success[0]?.url  as string;

      logger.log(
        `⚡ Fastest frontend selected → ${success[0]?.url} (${success[0]?.time.toFixed(0)}ms)`
      );
    }

    /* ---------- Update apiHosts order ---------- */
    store.apiHosts = [host, ...store.apiHosts.filter((h) => h !== host)];

    return host;
  }

  /* --------------------------------------------------
   * 2. resolveCloudHost
   * ------------------------------------------------ */
  async function resolveCloudHost() {
    logger.log("☁ Cloud fallback started…");
    store.apiHosts = [];

    for (const cloud of store.clouds) {
      logger.log(`→ Fetching cloud: ${cloud.name}`);

      const raw = await fetchJsonNative(cloud.value);
      if (!raw) {
        pushUnique(failedClouds.value, cloud.value);
        continue;
      }

      let list: any[] = [];
      try {
        list = Array.isArray(raw) ? raw : JSON.parse(raw);
      } catch {
        pushUnique(failedClouds.value, cloud.value);
        continue;
      }

      const hosts: string[] = [];
      for (const item of list) {
        try {
          const dec = decryptData(item);
          if (isUrl(dec)) hosts.push(clean(dec));
        } catch {}
      }

      if (!hosts.length) {
        pushUnique(failedClouds.value, cloud.value);
        continue;
      }

      store.apiHosts = hosts;
      const working = await resolveApiHost();
      if (working) return working;

      pushUnique(failedClouds.value, cloud.value);
    }

    logger.log("🧨 All cloud sources exhausted — no API host available");
    return null;
  }

  /* --------------------------------------------------
   * 3. initApiHosts
   * ------------------------------------------------ */
  async function initApiHosts() {
    if (loading.value) return store.apiEndPoint || null;

    loading.value = true;
    logger.clear();
    logger.log("🚀 Host resolution started…");

    try {
      const direct = await resolveApiHost();
      if (direct) return direct;

      logger.log("➡ Switching to cloud fallback (direct failed)");
      return await resolveCloudHost();
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
