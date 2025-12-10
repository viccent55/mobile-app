import { createApp } from "vue";

import pinia from "@/plugins/pinia";

import App from "./App.vue";
import router from "./router";
import vuetify from "@/plugins/vuetify";
import { useApiHosts } from "@/composables/useApiHosts";
import { initSafeArea } from "@/plugins/safe-area";
initSafeArea();

const app = createApp(App);
app.use(pinia);
app.use(router);
app.use(vuetify);
router.isReady().then(() => {
  const initCheckApi = useApiHosts();
  app.use(initCheckApi.initApiHosts);
  app.mount("#app");
});
