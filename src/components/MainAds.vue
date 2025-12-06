<script setup lang="ts">
  import { computed } from "vue";
  import { useStore } from "@/stores";

  const store = useStore();

  // hasAd: true if base64 or mainAds.img
  const hasAd = computed(() => !!store.baseImage64 || !!(store.mainAds && store.mainAds.img));

  const imageSrc = computed(() => {
    if (store.baseImage64) return store.baseImage64;
    if (store.mainAds?.img) return store.mainAds.img;
    return "";
  });
</script>

<template>
  <div
    v-if="hasAd"
    class="main-ads"
  >
    <img
      v-if="imageSrc"
      :src="imageSrc"
      alt="广告"
      class="main-ads__image"
    />
  </div>
</template>

<style scoped lang="scss">
  .main-ads {
    width: 100%;
    max-width: 360px;
    margin: 12px auto 0;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
    background: #111;
  }

  .main-ads__image {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
