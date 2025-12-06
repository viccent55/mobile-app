// 资源获取、页面跳转、路由切换

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
