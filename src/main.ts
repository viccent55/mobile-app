import { createApp, nextTick } from "vue";
import { SplashScreen } from "@capacitor/splash-screen";
import pinia from "@/plugins/pinia";
import App from "./App.vue";
import router from "./router";
import vuetify from "@/plugins/vuetify";
import { useApiHosts } from "@/composables/useApiHosts";
import { initSafeArea } from "@/plugins/safe-area";

initSafeArea();
async function bootstrap() {
  const app = createApp(App);
  app.use(pinia);
  app.use(router);
  app.use(vuetify);
  await router.isReady();
  app.mount("#app");
  // ✅ hide splash only after mount + first paint
  requestAnimationFrame(async () => {
    await nextTick();
    await SplashScreen.hide();
  });
  // ✅ run your host init after UI is shown (recommended)
  const { initApiHosts } = useApiHosts();
  initApiHosts().catch(console.error);
}

bootstrap();
