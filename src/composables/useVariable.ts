import { useStore } from "@/stores";
import { useRoute, useRouter } from "vue-router";
import { computed, ref } from "vue";
import { Capacitor } from "@capacitor/core";
import { useUserStore } from "@/stores/user";

const useVariable = () => {
  const store = useStore();
  const route = useRoute();
  const storeUser = useUserStore();
  const router = useRouter();

  const platform = computed(() => Capacitor.getPlatform());
  const isNativePlatform = computed(() => Capacitor.isNativePlatform());
  const onCopy = async (text: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        console.log("Text successfully copied to clipboard!");
        return;
      } catch (err) {
        console.error("Failed to copy text using Clipboard API:", err);
        // Fallback to the traditional method if the modern API fails.
      }
    }
  };
  const formatTime = (timestamp: string | number | Date) => {
    const createdAt =
      typeof timestamp === "number"
        ? new Date(timestamp * 1000) // seconds → ms
        : typeof timestamp === "string" && /^\d+$/.test(timestamp)
          ? new Date(parseInt(timestamp) * 1000)
          : new Date(timestamp);

    const now = new Date();
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} 分钟前 `;
    } else if (diffHours < 24) {
      return `${diffHours} 小时前 `;
    } else if (diffDays < 7) {
      return `${diffDays} 天前 `;
    } else {
      return createdAt.toLocaleDateString();
    }
  };
  const feedsContainer = ref<HTMLElement | null>(null);
  const columnWidth = ref(230);
  const gap = ref(28);
  const updateColumnWidth = () => {
    if (feedsContainer.value) {
      // Use getBoundingClientRect().width for a more precise fractional value
      // and Math.floor to prevent floating point rounding errors from breaking the layout.
      const containerWidth = feedsContainer.value?.getBoundingClientRect().width;
      if (window.innerWidth <= 768) {
        gap.value = 12;
        columnWidth.value = Math.floor((containerWidth - gap.value) / 2);
      } else {
        gap.value = 28;
        columnWidth.value = 230;
      }
    }
  };
  const debounce = <T extends (...args: any[]) => void>(fn: T, delay: number) => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    return function (this: ThisParameterType<T>, ...args: Parameters<T>) {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
  };

  const getDeviceInfo = () => {
    const ua = navigator.userAgent.toLowerCase();

    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIos || isAndroid || /mobile/.test(ua);

    const isWindows = /windows nt/.test(ua);
    const isMac = /macintosh|mac os x/.test(ua) && !isIos;

    const isPc = !isMobile && (isWindows || isMac);

    let type: "ios" | "android" | "windows" | "macos" | "pwa" | "other" | "unknown" = "unknown";

    if (isIos) type = "ios";
    else if (isAndroid) type = "android";
    else if (isWindows) type = "windows";
    else if (isMac) type = "macos";

    // Check if the app is running as a PWA

    return {
      isPc,
      isMobile,
      isIos,
      isAndroid,
      isWindows,
      isMac,
      type,
    };
  };
  const getTypeDevice = () => {
    const device = getDeviceInfo();
    let type = 0;
    switch (true) {
      case device.isPc:
        type = 1; // PC
        break;
      case device.isPwa:
        type = 2; // PWA
        break;
      case device.isAndroid:
        type = 3; // ANDROID
        break;
      case device.isIos:
        type = 4; // IOS
        break;
      default:
        type = 6; // OTHER
    }
    return type;
  };
  const clearQuery = () => {
    const { origin, pathname, hash } = window.location;
    const newUrl = `${origin}${pathname}${hash}`;
    window.history.replaceState({}, "", newUrl);
  };

  let startX = 0;
  let startY = 0;

  const touchStartHandler = (e: TouchEvent) => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  };

  const touchMoveHandler = (e: TouchEvent) => {
    if (Math.abs(e.touches[0].clientX - startX) > Math.abs(e.touches[0].clientY - startY)) {
      e.preventDefault(); // prevent horizontal swipe
    }
  };
  const disableHorizontalSwipe = () => {
    document.addEventListener("touchstart", touchStartHandler, {
      passive: false,
    });
    document.addEventListener("touchmove", touchMoveHandler, {
      passive: false,
    });
  };

  const enableHorizontalSwipe = () => {
    document.removeEventListener("touchstart", touchStartHandler);
    document.removeEventListener("touchmove", touchMoveHandler);
  };
  return {
    store,
    route,
    router,
    onCopy,
    formatTime,
    updateColumnWidth,
    columnWidth,
    gap,
    feedsContainer,
    debounce,
    getDeviceInfo,
    isNativePlatform,
    platform,
    storeUser,
    getTypeDevice,
    clearQuery,
    disableHorizontalSwipe,
    enableHorizontalSwipe,
  };
};
export default useVariable;
