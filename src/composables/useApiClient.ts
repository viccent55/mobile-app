// composables/useApiClient.ts
import { CapacitorHttp, Capacitor } from "@capacitor/core";
import { encrypt, decrypt, makeSign, timestamp } from "@/utils/crypto";

const TIMEOUT = 4000;

export function useApiClient() {
  // identify client type
  const client = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "pwa";

  // ----- Prepare encrypted/sign payload -----
  function wrapPayload(rawData: EmptyObjectType = {}) {
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

    // 🔵 Log GET Request
    // console.log("🔵 API GET Request:", {
    //   url,
    //   payload,
    //   headers: options?.headers,
    // });

    try {
      const res = await CapacitorHttp.get({
        url,
        params: payload,
        connectTimeout: TIMEOUT,
        readTimeout: TIMEOUT,
        ...options,
        headers: {
          "Content-Type": "application/json",
        },
      });

      // 🟢 Log GET Response
      const resData = res?.data;
      if (resData?.data) return decrypt(resData.data);
      return resData;
    } catch (err) {
      // 🔴 Log GET Error
      console.error("🔴 API GET Error:", {
        url,
        error: err,
      });
      throw err; // rethrow for app handling
    }
  }

  // ----- POST (encrypted body) -----
  async function post(url: string, rawData: any = {}, options: any = {}) {
    const payload = wrapPayload(rawData);
    // 🔍 Log full request info
    const res = await CapacitorHttp.post({
      url,
      data: payload,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
      ...options,
      headers: {
        "Content-Type": "application/json",
      },
    });
    // 🟢 Log response
    console.log("🟢 API POST Response:", decrypt(res.data.data));
    const resData = res?.data;
    if (resData?.data) return decrypt(resData.data);
    return resData;
  }

  async function getCloud(url: string) {
    const res = await CapacitorHttp.get({
      url,
      connectTimeout: TIMEOUT,
      readTimeout: TIMEOUT,
    });
    return res.data;
  }

  async function checkFrontendUrl(url: string): Promise<boolean> {
    try {
      const res = await CapacitorHttp.request({
        url: `${url.replace(/\/$/, "")}/ping.txt`,
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Cache-Control": "no-cache",
        },
        connectTimeout: TIMEOUT,
        readTimeout: TIMEOUT,
      });
      console.warn("res", res);

      return res.status === 200;
    } catch (e) {
      console.warn("checkFrontendUrl error:", e);
      return false;
    }
  }

  return { get, post, getCloud, checkFrontendUrl };
}
