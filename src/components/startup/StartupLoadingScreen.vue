<script setup lang="ts">
  const props = defineProps<{
    loading: boolean;
    devModeEnabled: boolean;
  }>();

  const emit = defineEmits<{
    (e: "open-dev-log"): void;
  }>();

  function openResolverDialog() {
    emit("open-dev-log");
  }
</script>

<template>
  <div class="startup-screen">
    <div class="center-box">
      <div class="loading-title">
        {{ loading ? "正在检测可用线路…" : "正在准备应用…" }}
      </div>

      <v-progress-circular
        indeterminate
        color="primary"
        size="40"
        class="mb-3"
      />

      <div class="loading-subtitle">正在为您寻找最快、最稳定的线路，请稍候…</div>

      <!-- Dev-only: show log dialog button -->
      <v-btn
        v-if="devModeEnabled"
        variant="text"
        size="small"
        color="grey-lighten-3"
        class="mt-2 text-capitalize"
        @click="openResolverDialog"
      >
        查看线路检测日志
      </v-btn>
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

  /* subtle pulsing background animation */
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

  .loading-title {
    font-size: 18px;
    font-weight: 600;
  }

  .loading-subtitle {
    font-size: 13px;
    opacity: 0.8;
  }
</style>
