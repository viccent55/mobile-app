// main.ts
import { createApp, nextTick } from "vue";
import { SplashScreen } from "@capacitor/splash-screen";
import App from "./App.vue";
import router from "./router";
import pinia from "@/plugins/pinia";
import vuetify from "@/plugins/vuetify";
import { useApiHosts } from "@/composables/useApiHosts";
import { initSafeArea } from "@/plugins/safe-area";

function raf() {
  return new Promise<void>((r) => requestAnimationFrame(() => r()));
}

async function hideSplashSafe() {
  try {
    await SplashScreen.hide();
  } catch {}
}

async function bootstrap() {
  initSafeArea();

  const app = createApp(App);
  app.use(pinia);
  app.use(vuetify);
  app.use(router);
  app.mount("#app");

  await router.isReady();
  await nextTick();
  await raf();
  await raf();

  // 🔴 hide native splash
  await hideSplashSafe();

  // 🔴 hide HTML splash
  const el = document.getElementById("boot-splash");
  if (el) {
    el.classList.add("boot-hide");
    setTimeout(() => el.remove(), 220);
  }

  // heavy logic AFTER UI is visible
  const { initApiHosts } = useApiHosts();
  setTimeout(() => initApiHosts().catch(console.error), 0);
}

bootstrap();
