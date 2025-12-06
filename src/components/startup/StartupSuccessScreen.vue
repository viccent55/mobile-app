<script setup lang="ts">
  import { ref } from "vue";
  import MainAds from "@/components/MainAds.vue";

  const props = defineProps({
    apiEndpoint: {
      type: String,
      default: () => "",
    },
    showWebview: {
      type: Boolean,
      default: () => false,
    },
  });
  const showWebview = ref(props.showWebview);

  function enterHome() {
    showWebview.value = true;
  }
</script>

<template>
  <div>
    <!-- If user hasn't clicked to open webview yet -->
    <div
      v-if="!showWebview"
      class="startup-screen"
    >
      <div class="center-box">
        <div class="success-icon">✅</div>
        <div class="success-title">线路检测完成</div>
        <div class="success-subtitle">
          已为您找到可用线路：
          <span class="text-primary">{{ apiEndpoint }}</span>
        </div>

        <!-- Main ads -->
        <MainAds />

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

    <!-- Once user clicks “进入首页” → show iframe webview -->
    <div
      v-else
      class="webview-wrapper"
    >
      <iframe
        class="remote-webview"
        :src="apiEndpoint"
        frameborder="0"
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

  .startup-screen::before {
    content: "";
    position: absolute;
    width: 220%;
    height: 220%;
    top: -60%;
    left: -60%;
    background: radial-gradient(circle at center, #2563eb33, transparent 60%);
    opacity: 0.6;
    animation: pulseGlow 4s ease-in-out infinite;
    pointer-events: none;
  }

  @keyframes pulseGlow {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.4;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.85;
    }
  }

  .center-box {
    position: relative;
    height: 100%;
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    text-align: center;
  }

  .success-icon {
    font-size: 42px;
    margin-bottom: 8px;
  }

  .success-title {
    font-size: 20px;
    font-weight: 600;
  }

  .success-subtitle {
    font-size: 13px;
    opacity: 0.9;
  }

  /* iframe wrapper */
  .webview-wrapper {
    position: fixed;
    inset: 0;
    z-index: 1;
  }

  /* iframe fills the whole view, respects safe areas */
  .remote-webview {
    width: 100%;
    height: 100%;
    background-color: black;
    border: none;
    display: block;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    box-sizing: border-box;
  }
</style>
