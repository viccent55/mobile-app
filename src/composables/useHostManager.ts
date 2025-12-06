import { ref } from "vue";
import { Capacitor, CapacitorHttp } from "@capacitor/core";
import { useStore } from "@/stores";
import { decryptData } from "@/utils/hosts";

const TIMEOUT = 4000;
const loading = ref(false);
// -------------------------------
// Fetch JSON with Capacitor
// -------------------------------
async function fetchJsonNative(url: string) {
  try {
    const res = await CapacitorHttp.get({
      url,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
    });
    // console.log(res.data);
    return res.data;
  } catch {
    return null;
  }
}

// -------------------------------
// Fetch JSON with browser fetch
// -------------------------------
async function fetchJsonBrowser(url: string) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timer);

    if (!res.ok) return null;

    return await res.json();
  } catch {
    return null;
  }
}

export function useHostManager() {
  const isNative = Capacitor.isNativePlatform();
  // Check if host returns valid JSON array
  async function checkHost(url: string): Promise<boolean> {
    const store = useStore();
    const fetcher = isNative ? fetchJsonNative : fetchJsonBrowser;
    const data = await fetcher(url);
    store.hostData = JSON.parse(data);
    store.hostData.forEach((item) => {
      const decrypt = decryptData(item);
      if (decrypt) {
        store.apiEndpoint = decrypt;
        return;
      }
    });
    return data;
  }

  // Auto-select the first working host
  async function getHosts() {
    try {
      loading.value = true;
      const store = useStore();

      // 1. Check saved host first
      const res = await checkHost(store.activeHost);
      if (res) {
        console.log("✅ Using saved host:", store.activeHost);
        return store.activeHost;
      }

      // 2. Try fallback list
      store.hosts.forEach(async (host) => {
        const response = await checkHost(host);
        if (response) {
          console.log("✅ Using fallback host:", host);
          store.activeHost = host;

          return host;
        }
      });

      // 3. No host working
      console.error("🚨 All hosts failed!");
      return null;
    } catch (e) {
      console.error("error", e);
    } finally {
      loading.value = false;
    }
  }

  return {
    getHosts,
    loading,
  };
}
