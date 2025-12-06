
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

export function getCurrentDomain(): string {
  return window.location.origin;
}
export async function getRegionFromIP() {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    return data.country_code || "UNKNOWN"; // e.g. "US", "CN", "KH"
  } catch {
    return "UNKNOWN";
  }
}
