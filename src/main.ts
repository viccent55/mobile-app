
import { createApp } from "vue";

import pinia from "@/plugins/pinia";

import App from "./App.vue";
import router from "./router";
import vuetify from "@/plugins/vuetify";
import { useApiHosts } from "@/composables/useApiHosts";
import { SafeArea } from "capacitor-plugin-safe-area";

SafeArea.getSafeAreaInsets().then(({ insets }) => {
  console.log(insets);
  for (const [key, value] of Object.entries(insets)) {
    document.documentElement.style.setProperty(`--safe-area-inset-${key}`, `${value}px`);
  }
});

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(vuetify);
router.isReady().then(() => {
  const initCheckApi = useApiHosts();
  app.use(initCheckApi.initApiHosts);
  app.mount("#app");
});
