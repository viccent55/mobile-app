import { ref } from "vue";
import { Capacitor } from "@capacitor/core";

export function useChannel() {
  const appChannel = ref<string>("");

  const getChannel = async (): Promise<string> => {
    // Web / SSR
    if (!Capacitor.isNativePlatform()) {
      appChannel.value = "web";
      return appChannel.value;
    }
    try {
      // Android only
      // @ts-ignore
      const channel = window.NativeChannel?.getChannel?.() ?? "default-channel";
      appChannel.value = channel;
      return channel;
    } catch (e) {
      console.error("[Channel] getChannel failed:", e);
      appChannel.value = "error";
      return "error";
    }
  };

  return {
    appChannel,   // ✅ expose reactive value
    getChannel,   // ✅ async getter
  };
}
