// composables/useApiClient.ts
import { CapacitorHttp, Capacitor } from "@capacitor/core";
import { encrypt, decrypt, makeSign, timestamp } from "@/utils/crypto";
import service from "@/utils/request";

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
    // console.log("🔵 API POST Request:", {
    //   url,
    //   payload,
    //   headers: options?.headers,
    // });
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

  return { get, post, getCloud };
}
