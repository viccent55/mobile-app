<script setup lang="ts">
  import { ref, watch, onBeforeUnmount, computed } from "vue";
  import { useStore } from "@/stores";
  import { openBrowser } from "@/service/index";
  import EmptyImage from "@/assets/loading.jpg";

  const props = defineProps<{
    modelValue: boolean; // for v-model
    duration?: number; // seconds to lock close button
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

    if (total <= 0) {
      // no countdown, allow immediate close
      canClose.value = true;
      remaining.value = 0;
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
  <!-- FULLSCREEN DIALOG (BLOCKS PAGE) -->
  <v-dialog
    v-model="showAd"
    persistent
    fullscreen
    transition="dialog-bottom-transition"
    color="transparent"
  >
    <!-- Center wrapper -->
    <div class="ad-dialog-wrapper">
      <v-card
        class="ad-card"
        elevation="10"
        rounded="xl"
      >
        <!-- Close / countdown in corner -->
        <div class="ad-close-wrapper">
          <!-- Show countdown chip first -->
          <div
            v-if="!canClose"
            class="ad-countdown"
          >
            {{ remaining }}s
          </div>

          <!-- Show close button after duration seconds -->
          <v-btn
            v-else
            icon
            size="small"
            variant="flat"
            color="black"
            class="ad-close-btn"
            @click="closeAd"
          >
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>

        <v-card-text class="pa-0">
          <!-- Ad image container -->
          <div
            class="ad-image-container"
            @click="handleClickAds"
          >
            <v-img
              :src="store.ads.base64"
              :lazy-src="store.ads.base64"
              alt="广告"
              class="ad-image"
              contain
            />
          </div>
        </v-card-text>
      </v-card>
    </div>
  </v-dialog>
</template>

<style scoped lang="scss">
  .ad-dialog-wrapper {
    min-height: 100vh;
    width: 100vw;
    padding: 16px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Card stays in the center, with max width – looks good on phone */
  .ad-card {
    position: relative;
    width: 100%;
    background: transparent;
  }

  /* Absolute close / countdown in top-right of card */
  .ad-close-wrapper {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
    display: flex;
    align-items: center;
  }

  /* Countdown pill while waiting */
  .ad-countdown {
    min-width: 32px;
    height: 32px;
    padding: 0 8px;
    border-radius: 999px;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  /* Close button style (after canClose=true) */
  .ad-close-btn {
    background: #ffffff;
    border-radius: 999px;
  }

  /* Container for the image – centers any image size */
  .ad-image-container {
    width: 100%;
    max-height: 70vh;
    min-height: 50vh;
    display: flex;
    justify-content: center;
    align-items: center;
    overflow: hidden;
    border-radius: 12px;
  }

  /* v-img itself */
  .ad-image {
    width: 100%;
    max-height: 70vh;
    border-radius: 18px;
  }

  /* Bottom text area */
  .ad-bottom {
    margin-top: 12px;
    text-align: center;
  }

  .ad-title {
    font-weight: 700;
    font-size: 16px;
  }

  .ad-subtitle {
    margin-top: 4px;
    font-size: 13px;
    opacity: 0.7;
  }

  /* Small tweak for very small phones */
  @media (max-height: 600px) {
    .ad-dialog-wrapper {
      align-items: flex-start;
    }

    .ad-card {
      margin-top: 24px;
    }
  }
</style>
