// capacitor.config.ts
import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.example.app",
  appName: "redbook",
  webDir: "dist",
  server: {
    // url: "http://192.168.100.137:5173",
    cleartext: true, // no dynamic url here
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2500,
      launchAutoHide: true,
      backgroundColor: "#ffffffff",
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: true,
      androidScaleType: "CENTER_CROP",
      showSpinner: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#ffffffff",
      androidStatusBarStyle: "DARK",
    },
  },
};

export default config;
