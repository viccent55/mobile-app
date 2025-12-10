<script setup lang="ts">
  import { ref, computed } from "vue";

  const props = defineProps({
    urlEndPoint: {
      type: String,
      default: () => "",
    },
    showWebview: {
      type: Boolean,
      default: () => false,
    },
    apiEndPoint: {
      type: String,
      default: () => "",
    },
  });

  const showWebview = ref(props.showWebview);
  const iframeRef = ref<HTMLIFrameElement | null>(null);

  function enterHome() {
    showWebview.value = true;
  }

  // ✅ Inject data into iframe window AFTER it loads
  function injectWindowKey() {
    if (!iframeRef.value?.contentWindow) return;

    const payload = {
      type: "INIT_ENV",
      api: props.apiEndPoint,
      platform: "capacitor",
    };

    iframeRef.value.contentWindow.postMessage(payload, "*");
    console.log("✅ postMessage sent to iframe:", payload);
  }
</script>

<template>
  <div>
    <!-- ✅ Startup Screen -->
    <div
      v-if="!showWebview"
      class="startup-screen"
    >
      <div class="center-box">
        <div class="success-icon">✅</div>
        <div class="success-title">线路检测完成</div>
        <div class="success-subtitle">
          已为您找到可用线路：
          <span class="text-primary">{{ urlEndPoint }}</span>
        </div>

        <v-btn
          color="primary"
          class="mt-4"
          rounded="lg"
          size="large"
          @click="enterHome"
        >
          进入首页
        </v-btn>
      </div>
    </div>

    <!-- ✅ Real Webview -->
    <div
      v-else
      class="webview-wrapper"
    >
      <iframe
        ref="iframeRef"
        class="remote-webview"
        :src="urlEndPoint"
        frameborder="0"
        @load="injectWindowKey"
        allow="fullscreen; autoplay; encrypted-media; picture-in-picture"
        allowfullscreen
        webkitallowfullscreen
        mozallowfullscreen
      ></iframe>
    </div>
  </div>
</template>

<style scoped lang="scss">
  .startup-screen {
    position: fixed;
    inset: 0;
    background: black;
    color: #fff;
    z-index: 10;
    overflow: hidden;
  }

  .center-box {
    height: 100%;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
  }

  .webview-wrapper {
    position: fixed;
    inset: 0;
    z-index: 1;
    background: black;
  }

  /* ⛔️ IMPORTANT: no env(safe-area-*) here */
  .remote-webview {
    width: 100%;
    height: 100%;
    background-color: black;
    border: none;
    display: block;
    padding-top: var(--safe-area-top, 0px);
    padding-bottom: var(--safe-area-bottom, 0px);
  }
</style>
