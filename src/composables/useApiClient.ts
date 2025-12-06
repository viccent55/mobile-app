// composables/useApiClient.ts
import { CapacitorHttp, Capacitor } from "@capacitor/core";
import { encrypt, decrypt, makeSign, timestamp } from "@/utils/crypto";

const TIMEOUT = 4000;

export function useApiClient() {
  // identify client type
  const client = Capacitor.isNativePlatform() ? "mobile" : "pwa";

  // ----- Prepare encrypted/sign payload -----
  function wrapPayload(rawData: any) {
    const ts = timestamp(); // must be number/string
    const encryptedData = encrypt(rawData ?? {});
    const sign = makeSign(ts, encryptedData);

    return {
      client,
      timestamp: ts,
      data: encryptedData,
      sign,
    };
  }

  // ----- GET (with encrypted params if needed) -----
  async function get(url: string, params: any = {}, options: any = {}) {
    const payload = wrapPayload(params); // wrap GET params same as POST

    const res = await CapacitorHttp.get({
      url,
      params: payload,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
      ...options,
    });

    return res.data;
  }

  // ----- POST (encrypted body) -----
  async function post(url: string, rawData?: any, options: any = {}) {
    const payload = wrapPayload(rawData); // wrap POST body
    console.log("payload =>", rawData);
    const res = await CapacitorHttp.post({
      url,
      data: payload,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
      ...options,
    });

    return res.data;
  }

  return { get, post };
}
