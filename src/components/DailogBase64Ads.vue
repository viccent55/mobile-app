<script setup lang="ts">
  import { ref, watch, onBeforeUnmount, computed } from "vue";
  import { useStore } from "@/stores";
  import { openBrowser } from "@/service/index";

  const props = defineProps<{
    modelValue: boolean; // for v-model
    duration?: number; // seconds to lock close button
    autoClose?: boolean;
    appChannel: string;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: boolean): void;
    (e: "click-ad", url: string | null): void;
  }>();

  const store = useStore();

  // bind v-model to a computed so v-dialog can use it
  const showAd = computed({
    get: () => (!store.ads.base64 ? false : props.modelValue),
    set: (val: boolean) => emit("update:modelValue", val),
  });

  const canClose = ref(false);
  const remaining = ref(0);
  let timer: number | null = null;

  function clearTimer() {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function startCountdown() {
    clearTimer();

    const total = props.duration ?? 5;
    const autoClose = props.autoClose ?? false;

    if (total <= 0) {
      canClose.value = true;
      remaining.value = 0;

      if (autoClose) {
        showAd.value = false;
      }
      return;
    }

    let count = total;
    canClose.value = false;
    remaining.value = count;

    timer = window.setInterval(() => {
      count--;
      remaining.value = Math.max(count, 0);

      if (count <= 0) {
        clearTimer();
        canClose.value = true;

        // ✅ AUTO CLOSE if enabled
        if (autoClose) {
          showAd.value = false;
        }
      }
    }, 1000);
  }

  // when v-model changes (from parent or internal)
  // if it opens -> start countdown, if it closes -> clear timer
  watch(
    () => props.modelValue,
    (val) => {
      if (val) {
        startCountdown();
      } else {
        clearTimer();
      }
    },
    { immediate: true }
  );

  onBeforeUnmount(() => {
    clearTimer();
  });

  function closeAd() {
    // do NOT allow close before countdown finished
    if (!canClose.value) return;
    showAd.value = false;
  }

  function handleClickAds() {
    const url = store.ads.url || null;
    emit("click-ad", url);
    if (url) {
      openBrowser(url);
    }
  }
</script>

<template>
  <v-dialog
    v-model="showAd"
    persistent
    fullscreen
    scrim="black"
  >
    <!-- Fullscreen wrapper -->
    <v-card class="ad-full">
      <!-- Close / countdown -->
      <div class="ad-close-wrapper">
        <v-chip
          v-if="!canClose"
          rounded="full"
          color="primary"
          variant="text"
          density="comfortable"
          elevation="1"
        >
          广告倒计时：{{ remaining }}s
        </v-chip>

        <v-btn
          v-else
          icon
          variant="flat"
          class="ad-close-btn"
          @click="closeAd"
          density="comfortable"
        >
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </div>

      <!-- Fullscreen image -->
      <v-img
        class="ad-img"
        :src="store.ads.base64"
        :lazy-src="store.ads.base64"
        alt="广告"
        cover
        @click="handleClickAds"
      />
      <div class="app-channel-info">
        <v-chip
          v-if="!canClose"
          rounded="full"
          color="primary"
          variant="text"
          density="comfortable"
          elevation="1"
        >
          {{ appChannel }}
        </v-chip>
      </div>
    </v-card>
  </v-dialog>
</template>
<style scoped lang="scss">
  .ad-full {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh; /* best for mobile */
    background: #000;
    border-radius: 0;
    overflow: hidden;
  }

  /* v-img must fill the whole screen */
  .ad-img {
    width: 100vw;
    height: 100dvh;
  }

  /* keep close button in safe-area */
  .ad-close-wrapper {
    position: fixed;
    top: calc(env(safe-area-inset-top) + 10px);
    right: calc(env(safe-area-inset-right) + 15px);
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: flex-end;
  }

  .ad-countdown {
    min-width: 40px;
    height: 32px;
    padding: 0 10px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.75);
    color: #fff;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .ad-close-btn {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 999px;
  }
  .app-channel-info {
    position: absolute;
    bottom: calc(env(safe-area-inset-bottom) + 10px);
    right: 0px;
    z-index: 10;
  }
</style>
