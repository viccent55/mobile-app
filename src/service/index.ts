import { Device } from "@capacitor/device";
import { Browser } from "@capacitor/browser";

/**
 * @description 打开页面
 * @param url 打开的页面url
 */
export function openPage(url: string) {
  const newWindow = window.open(url, "_blank");
  if (!newWindow) {
    console.error("打开页面失败");
  }
}
export async function openBrowser(url: string) {
  await Browser.open({ url: url });
}

export async function getRegion() {
  // 1) Try ipwhois first (very accurate)
  try {
    const res = await fetch("https://ipwho.is/");
    const data = await res.json();
    if (data?.country_code) return data.country_code.toUpperCase();
  } catch {}

  // 2) fallback ipapi
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();
    if (data?.country_code) return data.country_code.toUpperCase();
  } catch {}

  // 3) fallback device language
  try {
    const lang = await Device.getLanguageCode();
    const locale = lang?.value ?? "";
    const parts = locale.split("-");
    if (parts.length === 2) return parts[1].toUpperCase();
    return locale.toUpperCase();
  } catch {}

  return "UNKNOWN";
}
