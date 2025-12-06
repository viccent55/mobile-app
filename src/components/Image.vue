<script lang="ts" setup>
import { useDecryption } from '@/composables/useDecryption';

  const props = defineProps({
    src: String,
    width: { type: String || Number, default: "" },
    height: { type: String || Number, default: "" },
    cover: { type: Boolean, default: false },
  });

  const emit = defineEmits(["imageDimensions"]);

  const { decryptImage, decryptedImage } = useDecryption();

  watchEffect(() => {
    const src = props.src;
    if (!src) return;
    // If the image is a normal public URL → skip decrypt
    if (src.startsWith("http://") || src.startsWith("https://")) {
      decryptedImage.value = src; // use as-is
      return;
    }
    // Otherwise → decrypt
    decryptImage(src);
  });

  const state = reactive({ width: 0, height: 0, isVertical: false });
  const handleImageLoad = () => {
    // We need to escape the URL for use in the selector
    const escapedSrc = CSS.escape(decryptedImage.value);
    const img = document.querySelector(
      `img[src="${escapedSrc}"]`
    ) as HTMLImageElement | null;

    if (img) {
      state.width = img.naturalWidth;
      state.height = img.naturalHeight;
      state.isVertical = state.height > state.width;
      emit("imageDimensions", state);
    } else {
      console.error("Could not find image element in the DOM.");
    }
  };
</script>

<template>
  <v-img
    :src="decryptedImage || '/loading.jpg'"
    :lazy-src="decryptedImage"
    :width="width"
    :height="height"
    alt="Image"
    @load="handleImageLoad"
    :cover="cover"
  >
    <template v-slot:placeholder>
      <div class="d-flex align-center justify-center fill-height">
        <v-progress-circular
          color="grey-lighten-4"
          indeterminate
        />
        <!-- <span v-else>Loading...</span> -->
      </div>
    </template>
    <slot />
  </v-img>
</template>
