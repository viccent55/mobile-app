// composables/useApiClient.ts
import { CapacitorHttp } from "@capacitor/core";
import { useStore } from "@/stores";

const TIMEOUT = 4000;
const clean = (u: string) => u.replace(/\/+$/, "");

export function useApiClient() {
  const store = useStore();

  function ensureBase() {
    if (!store.apiEndPoint) {
      throw new Error("API endpoint not initialized");
    }
    return clean(store.apiEndPoint);
  }

  async function get(path: string, options: any = {}) {
    const base = ensureBase();
    const url = base + path;
    const res = await CapacitorHttp.get({
      url,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
      ...options,
    });
    return res.data;
  }

  async function post(path: string, data?: any, options: any = {}) {
    const base = ensureBase();
    const url = base + path;
    const res = await CapacitorHttp.post({
      url,
      data,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
      ...options,
    });
    return res.data;
  }

  return { get, post };
}
