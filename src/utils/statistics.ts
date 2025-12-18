import FingerprintJS from "@fingerprintjs/fingerprintjs";
import { CapacitorHttp } from "@capacitor/core";

import { gcm } from "@noble/ciphers/aes.js";
import { randomBytes as nobleRandomBytes } from "@noble/ciphers/utils.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { hmac } from "@noble/hashes/hmac.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";

type EmptyObjectType = Record<string, any>;
// ----------------------------------------------------
// Global state
// ----------------------------------------------------
let VISITOR_ID = "";
let REQUEST_ID = "";
let DEVICE_ID = "";
const DEVICE_ID_KEY = "STATISTICS_DEVICE_ID";
let PLATFORM_NAME = "";
let QUERY = {} as Record<string, string>;
const STATISTICS_KEY = "STATISTICS_KEY";
let APP_ID = "";
let PRODUCT_ID = "";
let ACTION_TYPE = "";
let PROMO_CODE = "";
// ⚠️ Shared secret with backend (same on server)
const BACKEND_KEY = "33d50673-ad86-4b87-bcf2-b76e7a30c9ef";
let BACKEND_URL = "";

// ----------------------------------------------------
// Helpers
// ----------------------------------------------------
function onGetTimestamp() {
  return Math.floor(Date.now() / 1000);
}

function getRandomBytes(length: number): Uint8Array {
  const c = (globalThis as any)?.crypto;
  if (c?.getRandomValues) return c.getRandomValues(new Uint8Array(length));
  return nobleRandomBytes(length);
}

function bytesToBase64(bytes: Uint8Array): string {
  const bin = String.fromCharCode(...bytes);
  if (typeof btoa !== "undefined") return btoa(bin);
  // eslint-disable-next-line no-undef
  return Buffer.from(bytes).toString("base64");
}

function deriveKey(source: string): Uint8Array {
  return sha256(utf8ToBytes(source)); // 32 bytes
}

function encryptAesGcm(plaintext: string, key: Uint8Array, nonce: Uint8Array): Uint8Array {
  return gcm(key, nonce).encrypt(utf8ToBytes(plaintext)); // ciphertext||tag
}

function hmacSign(payloadB64: string, nonceB64: string, ts: number, keyBytes: Uint8Array) {
  const msg = utf8ToBytes(`${payloadB64}|${nonceB64}|${ts}`);
  return bytesToBase64(hmac(sha256, keyBytes, msg));
}

function getDeviceId() {
  try {
    const cached = localStorage.getItem(DEVICE_ID_KEY);
    if (cached && cached.length >= 16) return cached;
  } catch {}

  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = getRandomBytes(32);

  let id = "";
  for (let i = 0; i < 32; i++) id += chars[bytes[i] % chars.length];

  try {
    localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {}

  return id;
}

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

function getQueryParams() {
  if (typeof window === "undefined") return {};
  const usp = new URLSearchParams(window.location.search);

  const params: Record<string, string> = {};
  usp.forEach((value, key) => {
    const decoded = value ? value.replace(/\+/g, " ") : "";
    if (key === "e") setProductId(decoded);
    params[key] = decoded;
  });

  return params;
}

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
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------
// Config setters (same names)
// ----------------------------------------------------
function setAppId(appId: string) {
  if (!appId) return;
  APP_ID = appId;
  return appId;
}

function setProductId(productId: string) {
  if (!productId) return;
  PRODUCT_ID = productId;
  return productId;
}

function setActionType(actionType: string) {
  const logger = useLoggerStore();
  if (!actionType) return;
  ACTION_TYPE = actionType;
  logger.log(`ACTION_TYPE: ${actionType}`);
  return actionType;
}

function setBackendURL(str: string) {
  if (!str) return;
  BACKEND_URL = str;
  return str;
}

// ----------------------------------------------------
// Fingerprint / visitor (same function name)
// ----------------------------------------------------
export async function getVisitorId() {
  try {
    const fp = await FingerprintJS.load();
    const r = await fp.get();
    VISITOR_ID = r.visitorId;
    REQUEST_ID = (r as any)?.requestId || "";
    return { visitorId: VISITOR_ID, requestId: REQUEST_ID };
  } catch (e) {
    console.error("获取VisitorId失败:", e);
    return "";
  }
}

// ----------------------------------------------------
// POST helper (same function name)
// ----------------------------------------------------
export async function post(url: string, data: any, options: EmptyObjectType = {}) {
  const logger = useLoggerStore();
  const timeout = options?.timeout || 5000;

  try {
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

    if (res.status < 200 || res.status >= 300) throw new Error(`HTTP ${res.status}`);
    return res.data;
  } catch (err) {
    logger.log(`🚨 ERROR Report host: ${String(err)}`);
    throw err;
  }
}

// ----------------------------------------------------
// Core statistics request (same function name)
// ----------------------------------------------------
async function onStatistics(info: EmptyObjectType) {
  const logger = useLoggerStore();

  try {
    if (typeof window === "undefined") return;

    const timestamp = onGetTimestamp();
    const nonceBytes = getRandomBytes(12);
    const nonceBase64 = bytesToBase64(nonceBytes);

    const tempData = JSON.stringify({
      actionType: info?.actionType,
      promoCode: info?.promoCode,
      channelCode: info?.channelCode,
      productCode: info?.productCode,
      timestamp,
    });
    const keyBytes = deriveKey(BACKEND_KEY);
    const cipherBytes = encryptAesGcm(tempData, keyBytes, nonceBytes);
    const dataBase64 = bytesToBase64(cipherBytes);
    const signatureBase64 = hmacSign(dataBase64, nonceBase64, timestamp, keyBytes);

    const body = { data: dataBase64, nonce: nonceBase64, timestamp, signature: signatureBase64 };

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

    logger.log(`⚠️ Checking API host: ${BACKEND_URL}/track/action`);
    logger.log(`⚠️🟢 Param Request: ${tempData} VisitorId: ${VISITOR_ID}`);

    const res = await post(`${BACKEND_URL}/track/action`, body, { headers: headersData });
    console.log("🟢SUCCESS =>", res);
    logger.log(`🟢 SUCCESS => ${info?.actionType} | Report Host | ${res?.msg ?? "OK"}`);
    return res;
  } catch (e) {
    console.log("统计失败", e);
  }
}

// ----------------------------------------------------
// Local save (same function name)
// ----------------------------------------------------
async function onSaveLocal() {
  const localData = await getLocal(STATISTICS_KEY);
  if (localData) return;

  const data = {
    code: QUERY?.code,
    chan: QUERY?.chan,
    product_id: PRODUCT_ID,
    appId: APP_ID,
    device_id: DEVICE_ID,
    visitor_id: VISITOR_ID,
    create_time: onGetTimestamp(),
    platform: PLATFORM_NAME,
  };

  await setLocal(STATISTICS_KEY, data);
}

// ----------------------------------------------------
// Handle (same function name)
// ----------------------------------------------------
async function onHandle() {
  const statisData = {
    promoCode: PROMO_CODE || QUERY?.code,
    channelCode: QUERY?.chan,
    productCode: PRODUCT_ID,
    actionType: ACTION_TYPE,
    appId: APP_ID,
    deviceId: DEVICE_ID,
    platform: PLATFORM_NAME,
  };

  return await onStatistics(statisData);
}

// ----------------------------------------------------
// Init (same function name)
// ----------------------------------------------------
export async function onInit() {
  if (typeof window === "undefined") return;

  DEVICE_ID = getDeviceId();
  PLATFORM_NAME = getPlatform();
  QUERY = getQueryParams();

  const fp: any = await getVisitorId();
  if (fp) ({ visitorId: VISITOR_ID, requestId: REQUEST_ID } = fp);

  await onSaveLocal();
}

// ----------------------------------------------------
// setConfig (same name, same usage)
// Supports productId OR productCode
// ----------------------------------------------------
export async function setConfig(value: EmptyObjectType) {
  if (!value || typeof value !== "object") return;
  if (value?.appId) setAppId(value.appId);
  if (value?.productId) setProductId(value.productId);
  if (value?.backendURL) setBackendURL(value.backendURL);
  if (value?.actionType) setActionType(value.actionType);
  if (value?.promoCode) PROMO_CODE = value.promoCode;
  await onInit();

  if (value?.appId) {
    await onHandle();
  }
}
