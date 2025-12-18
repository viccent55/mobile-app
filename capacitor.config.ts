// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "horse.panda.com",
  appName: "xhs",
  webDir: "dist",
  server: {
    // url: "http://192.168.100.137:5174",
    cleartext: true, // no dynamic url here
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffffff",
      androidStatusBarStyle: "DARK",
    },
  },
};

export default config;
