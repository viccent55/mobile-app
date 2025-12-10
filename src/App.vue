<script setup lang="ts">
  import { onMounted, ref, computed } from "vue";
  import { useStore } from "@/stores";
  import { useApiHosts } from "@/composables/useApiHosts";
  import { useReport } from "@/composables/useReport";

  import HostResolverDialog from "@/components/HostResolverDialog.vue";
  import StartupLoadingScreen from "@/components/startup/StartupLoadingScreen.vue";
  import StartupErrorScreen from "@/components/startup/StartupErrorScreen.vue";
  import StartupSuccessScreen from "@/components/startup/StartupSuccessScreen.vue";
  import DailogBase64Ads from "@/components/DailogBase64Ads.vue";

  const store = useStore();
  const { initApiHosts, loading, failedHosts, failedClouds } = useApiHosts();
  const { runOncePerDay, getFirstVisitInApp } = useReport();

  const ready = ref(false);
  const errorMsg = ref<string | null>(null);
  const devModeEnabled = true;
  const showResolverDialog = ref(true);

  const hasHost = computed(() => !!store.urlEndPoint);

  // consider "all failed" when ready + no host
  const allFailed = computed(
    () =>
      ready.value &&
      !hasHost.value &&
      (failedHosts.value.length > 0 || failedClouds.value.length > 0)
  );

  const initHost = async () => {
    try {
      const host = await initApiHosts(); // sets store.apiEndPoint

      if (!host || !store.apiEndPoint) {
        errorMsg.value = "未找到可用线路，请稍后重试";
      }
    } catch (e) {
      console.error(e);
      errorMsg.value = "线路检测失败，请检查网络";
    } finally {
      ready.value = true;
    }
  };

  function openResolverDialog() {
    showResolverDialog.value = true;
  }
  const showAds = ref(false);
  onMounted(async () => {
    showAds.value = true;
    await initHost();
    getFirstVisitInApp();
    runOncePerDay();
  });
</script>

<template>
  <v-app>
    <v-main>
      <!-- 1) Startup / loading screen while checking hosts -->
      <StartupLoadingScreen
        v-if="!ready"
        :loading="loading"
        :dev-mode-enabled="devModeEnabled"
        @open-dev-log="openResolverDialog"
      />

      <!-- 2) Error screen if no host (all direct + clouds failed) -->
      <StartupErrorScreen
        v-else-if="!hasHost"
        :error-msg="errorMsg"
        :all-failed="allFailed"
        :dev-mode-enabled="devModeEnabled"
        @open-dev-log="openResolverDialog"
      />

      <!-- 3) Host success screen (success + enter / iframe webview) -->
      <StartupSuccessScreen
        v-if="store.urlEndPoint"
        :url-end-point="store.urlEndPoint"
        :api-end-point="store.apiEndPoint"
        :show-webview="true"
      />
    </v-main>
    <HostResolverDialog
      v-if="devModeEnabled"
      v-model="showResolverDialog"
    />
    <!-- Main ads -->
    <DailogBase64Ads
      v-model="showAds"
      :duration="5"
    />
  </v-app>
</template>
<style lang="scss" scoped></style>
