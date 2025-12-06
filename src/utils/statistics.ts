import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

// noble cryptography
import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes as nobleRandomBytes } from "@noble/ciphers/utils.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

type EmptyObjectType = Record<string, any>;

// ----------------------------------------------------
// Helpers: random bytes
// ----------------------------------------------------
function getRandomBytes(length: number): Uint8Array {
  // Try real CSPRNG first if available (most WebViews have this)
  if (typeof globalThis !== "undefined" && (globalThis as any).crypto?.getRandomValues) {
    const arr = new Uint8Array(length);
    (globalThis as any).crypto.getRandomValues(arr);
    return arr;
  }

  // Fallback: noble's userspace CSPRNG
  return nobleRandomBytes(length);
}

// ----------------------------------------------------
// Base64 helpers
// ----------------------------------------------------
function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  if (typeof btoa !== "undefined") {
    return btoa(binary);
  }

  // Node.js fallback if ever needed
  // eslint-disable-next-line no-undef
  return Buffer.from(bytes).toString("base64");
}

// ----------------------------------------------------
// Global state
// ----------------------------------------------------
let VISITOR_ID = "";
let REQUEST_ID = "";

let DEVICE_ID = "";
const DEVICE_ID_KEY = "STATISTICS_DEVICE_ID";

let PLATFORM_NAME = "";
let QUERY = {} as EmptyObjectType;

const STATISTICS_KEY = "STATISTICS_KEY";

let APP_ID = "";
let PRODUCT_ID = "";
let ACTION_TYPE = "click";

// ⚠️ Shared secret with backend (same on server)
const BACKEND_KEY = "33d50673-ad86-4b87-bcf2-b76e7a30c9ef";

let BACKEND_URL = "";

// ----------------------------------------------------
// Fingerprint / visitor
// ----------------------------------------------------
export async function getVisitorId() {
  try {
    const fp = await FingerprintJS.load();
    const result = await fp.get();

    const visitorId = result.visitorId;
    const requestId = (result as any)?.requestId || "";

    VISITOR_ID = visitorId;
    REQUEST_ID = requestId;

    console.log("VisitorId:", visitorId, "RequestId:", requestId);

    return { visitorId: VISITOR_ID, requestId: REQUEST_ID };
  } catch (error) {
    console.error("获取VisitorId失败:", error);
    return "";
  }
}

// ----------------------------------------------------
// Device ID (local unique ID)
// ----------------------------------------------------
function getDeviceId() {
  try {
    const cached = localStorage.getItem(DEVICE_ID_KEY);
    if (cached && typeof cached === "string" && cached.length >= 16) {
      return cached;
    }
  } catch {
    // ignore
  }

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  const length = 32;

  const array = getRandomBytes(length);
  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length];
  }

  try {
    localStorage.setItem(DEVICE_ID_KEY, result);
  } catch {
    // ignore
  }

  return result;
}

// ----------------------------------------------------
// Platform detection
// ----------------------------------------------------
function getPlatform() {
  if (typeof navigator === "undefined") return "web";

  const ua = (navigator.userAgent || "").toLowerCase();
  if (/android/.test(ua)) return "android";
  if (/iphone|ipad|ipod/.test(ua)) return "ios";

  const plat = navigator.platform || "";
  const touch = (navigator as any).maxTouchPoints || 0;
  if (plat === "MacIntel" && touch > 1) return "ios"; // iPadOS

  return "web";
}

// ----------------------------------------------------
// URL query params
// ----------------------------------------------------
function getQueryParams() {
  const params: Record<string, string> = {};

  if (typeof window === "undefined") return params;

  const usp = new URLSearchParams(window.location.search);
  console.log("地址栏数据", usp);

  usp.forEach((value, key) => {
    const decodedValue = value ? value.replace(/\+/g, " ") : "";
    console.log("地址栏参数", key, decodedValue);
    if (key === "e") {
      setProductId(decodedValue); // 如果地址栏有e再次设置产品id
    }
    params[key] = decodedValue;
  });

  return params;
}

// ----------------------------------------------------
// Local storage helpers
// ----------------------------------------------------
async function getLocal(key: string) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return "";
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  } catch {
    return "";
  }
}

async function setLocal(key: string, data: any) {
  try {
    const dataString = JSON.stringify(data);
    localStorage.setItem(key, dataString);
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------
// App/product config setters
// ----------------------------------------------------
function setAppId(appId: string) {
  console.log("设置appid", appId);
  if (!appId) return;
  APP_ID = appId;
  console.log("APP_ID设置为:", APP_ID);
  return appId;
}

function setProductId(productId: string) {
  console.log("设置产品id", productId);
  if (!productId) return;
  PRODUCT_ID = productId;
  console.log("PRODUCT_ID设置为:", PRODUCT_ID);
  return productId;
}
function setActionType(actionType: string) {
  console.log("设置产品id", actionType);
  if (!actionType) return;
  ACTION_TYPE = actionType;
  console.log("ACTION_TYPE:", ACTION_TYPE);
  return actionType;
}

// ----------------------------------------------------
// Time helper
// ----------------------------------------------------
function onGetTimestamp() {
  return Math.floor(Date.now() / 1000);
}

// ----------------------------------------------------
// Key derivation & crypto helpers (noble)
// ----------------------------------------------------

// BACKEND_KEY(string) -> 32-byte AES key
function deriveKey(source: string): Uint8Array {
  const keyBytes = utf8ToBytes(source);
  return sha256(keyBytes); // 32 bytes
}

/**
 * AES-GCM encrypt using @noble/ciphers
 * Returns ciphertext || tag as Uint8Array
 */
function encryptAesGcm(plaintext: string, key: Uint8Array, nonce: Uint8Array): Uint8Array {
  const ptBytes = utf8ToBytes(plaintext);
  const aes = gcm(key, nonce); // pure JS AES-GCM
  const ciphertextWithTag = aes.encrypt(ptBytes); // Uint8Array
  return ciphertextWithTag;
}

// HMAC over `data|nonce|timestamp`, using HMAC-SHA256 (noble)
function hmacSign(payloadB64: string, nonceB64: string, ts: number, keyBytes: Uint8Array) {
  const msg = utf8ToBytes(`${payloadB64}|${nonceB64}|${ts}`);
  const mac = hmac(sha256, keyBytes, msg); // Uint8Array
  return bytesToBase64(mac);
}

// ----------------------------------------------------
// Backend URL
// ----------------------------------------------------
function setBackendURL(str: string) {
  if (!str) return;
  BACKEND_URL = str;
}

// ----------------------------------------------------
// POST helper
// ----------------------------------------------------
async function post(url: string, data: any, options: EmptyObjectType = {}) {
  const isNative = Capacitor.isNativePlatform();
  const timeout = (options as any)?.timeout || 5000;

  if (isNative) {
    const res = await CapacitorHttp.post({
      url,
      data,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      connectTimeout: timeout,
      readTimeout: timeout,
    });
    console.error(res);
    return res.data;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(url, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: JSON.stringify(data),
      signal: controller.signal,
    });

    if (!res.ok) throw new Error("请求失败");
    return res.json();
  } catch (err: any) {
    if (err.name === "AbortError") console.error("请求超时");
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ----------------------------------------------------
// Core statistics request
// ----------------------------------------------------
async function onStatistics(info: EmptyObjectType) {
  try {
    if (typeof window === "undefined") {
      console.warn("onStatistics in non-browser env, skip");
      return;
    }

    console.log("Client value transfer:", info);

    const timestamp = onGetTimestamp();
    const nonceBytes = getRandomBytes(12); // 96-bit IV
    const nonceBase64 = bytesToBase64(nonceBytes);

    const tempData = JSON.stringify({
      actionType: info?.actionType,
      promoCode: info?.promoCode,
      channelCode: info?.channelCode,
      productCode: info?.productCode,
      timestamp,
    });

    const keyBytes = deriveKey(BACKEND_KEY); // 32-byte AES/HMAC key

    // AES-GCM encrypt (pure JS, no WebCrypto)
    const cipherBytes = encryptAesGcm(tempData, keyBytes, nonceBytes);
    const dataBase64 = bytesToBase64(cipherBytes);

    // HMAC signature
    const signatureBase64 = hmacSign(dataBase64, nonceBase64, timestamp, keyBytes);

    const body = {
      data: dataBase64,
      nonce: nonceBase64,
      timestamp,
      signature: signatureBase64,
    };

    const headersData: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Device-Id": DEVICE_ID,
      "X-App-Id": APP_ID,
      "X-Platform": PLATFORM_NAME,
      "X-VisitorID": VISITOR_ID,
      "X-FP-RequestID": REQUEST_ID,
      "X-Nonce": nonceBase64,
      "X-Timestamp": String(timestamp),
      "X-Signature": signatureBase64,
    };

    console.log("headersData:", headersData);
    console.log("请求前的数据-body:", body);
    console.log("请求后端地址:", BACKEND_URL);

    const res = await post(`${BACKEND_URL}/track/action`, body, {
      headers: headersData,
    });

    console.log("res", res);
    return res;
  } catch (error) {
    console.log("统计失败", error);
  }
}

// ----------------------------------------------------
// Local save
// ----------------------------------------------------
async function onSaveLocal() {
  const localData = await getLocal(STATISTICS_KEY);
  if (localData) return;

  const data = {
    code: (QUERY as any)?.code,
    chan: (QUERY as any)?.chan,
    product_id: PRODUCT_ID,
    appId: APP_ID,
    device_id: DEVICE_ID,
    visitor_id: VISITOR_ID,
    create_time: onGetTimestamp(),
    platform: PLATFORM_NAME,
  };

  console.log("保存的信息是", data);
  const saveLocal = await setLocal(STATISTICS_KEY, data);
  console.log("保存本地信息", saveLocal);
}

// ----------------------------------------------------
// Public APIs: click / download / init / config
// ----------------------------------------------------
async function onHandle() {
  console.log("Initialize by clicking Start Statistics");

  const statisData = {
    promoCode: (QUERY as any)?.code,
    channelCode: (QUERY as any)?.chan,
    productCode: PRODUCT_ID,
    actionType: ACTION_TYPE,
    appId: APP_ID,
    deviceId: DEVICE_ID,
    platform: PLATFORM_NAME,
  };

  console.log("Report information", statisData);
  return await onStatistics(statisData);
}

export async function onDownload() {
  console.log("下载开始");

  const statisData = {
    promoCode: (QUERY as any)?.code,
    channelCode: (QUERY as any)?.chan,
    productCode: PRODUCT_ID,
    actionType: "download",
    appId: APP_ID,
    deviceId: DEVICE_ID,
    platform: PLATFORM_NAME,
  };

  const statis = await onStatistics(statisData);
  console.log("下载结束:", statis);
}

// 初始化（only call on client)
export async function onInit() {
  console.log("内部初始化方法开始");

  if (typeof window === "undefined") {
    console.warn("onInit called in non-browser environment, skipping.");
    return;
  }

  DEVICE_ID = getDeviceId();
  PLATFORM_NAME = getPlatform();
  QUERY = getQueryParams();

  const fp: any = await getVisitorId();
  if (fp) {
    VISITOR_ID = fp.visitorId;
    REQUEST_ID = fp.requestId;
  }

  await onSaveLocal();
  console.log("内部初始化方法结束");
}

// 配置信息入口
export async function setConfig(value: EmptyObjectType) {
  if (!value || typeof value !== "object") return;

  if (value?.appId) setAppId(value.appId);
  if (value?.productId) setProductId(value.productId);
  if (value?.backendURL) setBackendURL(value.backendURL);
  if (value?.clickType) setActionType(value.clickType);

  await onInit();

  if (value?.appId) {
    await onHandle();
  }
}
