// composables/useCustomerService.ts
import md5 from "crypto-js/md5";

export interface ChatUser {
  id?: string | number;
  nickname?: string;
  avatar?: string;
  phone?: string;
  vipLevel?: number | string;
  visitCode?: string | number;
}

export function useCustomerService() {
  const buildChatUrl = (user: ChatUser): string | null => {
    if (typeof window === "undefined") return null;

    const DEVICE_ID_KEY = localStorage.getItem("STATISTICS_DEVICE_ID") as string | null;
    const rawId = user?.id ?? DEVICE_ID_KEY ?? "guest";
    const visitorId = md5(String(rawId)).toString();

    const extraObj = {
      visitorName: user?.nickname,
      visitorAvatar: user?.avatar,
      userId: user?.id,
      phone: user?.phone,
      vipLevel: user?.vipLevel,
    };
    const extra = encodeURIComponent(JSON.stringify(extraObj));
    const refer = encodeURIComponent(window.location.href);

    const base = import.meta.env.VITE_LIVECHAT_BASE || "https://livetalk.xhltfes.com";
    const groupId = "1";

    return (
      `${base}/livechat` +
      `?group_id=${groupId}` +
      `&visitor_id=${visitorId}` +
      `&extra=${extra}` +
      `&refer=${refer}`
    );
  };

  return { buildChatUrl };
}
