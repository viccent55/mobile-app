<script setup lang="ts">
  import { ref } from "vue";
  import DailogBase64Ads from "@/components/DailogBase64Ads.vue";
  import ChatCustomer from "@/components/ChatWidget.vue";

  const props = defineProps<{
    errorMsg: string | null;
    allFailed: boolean;
    devModeEnabled: boolean;
  }>();

  const emit = defineEmits<{
    (e: "open-dev-log"): void;
  }>();

  const chatRef = ref<InstanceType<typeof ChatCustomer> | null>(null);

  function openResolverDialog() {
    emit("open-dev-log");
  }

  // 用户点击“联系客服，反馈问题领奖励”
  function handleLiveTalkClick() {
    console.log("用户点击了联系客服反馈问题领取奖励");
    chatRef.value?.open();
  }

  function handleClickAd() {
    // open external link / route to detail
    // e.g. window.open(store.ads.link, "_blank")
  }
  const showAds = ref(false);
  onMounted(() => {
    showAds.value = true;
  });
</script>

<template>
  <div class="startup-screen">
    <div class="center-box">
      <div class="error-title">
        {{ errorMsg || "未找到可用线路" }}
      </div>

      <div
        v-if="allFailed"
        class="error-subtitle"
      >
        无法连接到任何线路，可能是网络问题或线路被封锁。
      </div>

      <!-- Live talk / reward card in Chinese -->
      <div class="reward-card">
        <div class="reward-title">线路异常？反馈问题领奖励</div>
        <div class="reward-text">
          如果您多次尝试仍无法进入，请点击下方按钮联系客服，告诉我们您遇到的问题。
          <br />
          我们会尽快为您排查，并赠送奖励作为感谢。
        </div>
        <v-btn
          color="primary"
          class="mt-3"
          block
          rounded="lg"
          @click="handleLiveTalkClick"
        >
          立即联系客服，反馈问题
        </v-btn>

        <!-- Chat widget component -->
        <ChatCustomer
          ref="chatRef"
          :user="{}"
        />
      </div>

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

  .error-title {
    font-size: 18px;
    font-weight: 600;
    color: #ff6b6b;
  }

  .error-subtitle {
    font-size: 13px;
    opacity: 0.85;
  }

  /* reward card */
  .reward-card {
    max-width: 360px;
    margin-top: 16px;
    padding: 16px;
    border-radius: 16px;
    background: linear-gradient(135deg, #1f2937, #111827);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.45);
    text-align: left;
  }

  .reward-title {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .reward-text {
    font-size: 13px;
    line-height: 1.5;
    opacity: 0.9;
  }
</style>
