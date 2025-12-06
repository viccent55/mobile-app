<script lang="ts" setup>
  import { useLocalStorage } from "@vueuse/core";
  import type { PropType } from "vue";

  interface Advert {
    id: number | string;
    image: string;
    url: string;
    title?: string;
  }

  const props = defineProps({
    adverts: {
      type: Array as PropType<Advert[]>,
      default: () => [],
    },
  });

  const dialog = ref(false);
  const adQueue = ref<Advert[]>([]);
  const currentAdIndexInQueue = ref(0);

  const currentAdvert = computed(
    () => adQueue.value[currentAdIndexInQueue.value]
  );

  const SESSION_KEY_PREFIX = "ads_";
  const SESSION_DURATION = 1 * 60 * 60 * 1000; // 1 hour

  function getSessionKey(advert: Advert): string {
    if (!advert || !advert.id) {
      console.error("Advertisement is missing an ID.", advert);
      // Fallback to a generic key to avoid errors, though this is not ideal.
      return `${SESSION_KEY_PREFIX}unknown`;
    }
    return `${SESSION_KEY_PREFIX}${advert.id}`;
  }

  function isSessionActive(advert: Advert): boolean {
    if (!process.client) return false;
    try {
      const key = getSessionKey(advert);
      const lastCalled = useLocalStorage<string>(key, null);
      if (
        lastCalled.value &&
        Date.now() - Number(lastCalled.value) < SESSION_DURATION
      ) {
        return true;
      }
    } catch (e) {
      console.error("Failed to read localStorage item:", e);
    }
    return false;
  }

  function setSession(advert: Advert) {
    if (!process.client) return;
    try {
      const key = getSessionKey(advert);
      const storage = useLocalStorage<string>(key, "");
      storage.value = Date.now().toString();
    } catch (e) {
      console.error("Failed to set localStorage item:", e);
    }
  }

  function closeDialog() {
    dialog.value = false;
  }

  function onAfterLeave() {
    if (!currentAdvert.value) {
      return;
    }

    // Set session for the ad that was just closed
    setSession(currentAdvert.value);

    // Move to the next ad in the queue
    currentAdIndexInQueue.value++;

    if (currentAdIndexInQueue.value < adQueue.value.length) {
      // Use a small delay to make the transition smoother
      setTimeout(() => {
        dialog.value = true;
      }, 300);
    }
  }

  onMounted(() => {
    if (!props.adverts || !props.adverts.length) {
      return;
    }

    // Filter ads to create a queue of those that should be shown
    adQueue.value = props.adverts.filter((advert) => {
      // Ensure ad has an ID to be considered
      if (!advert.id) {
        console.warn("Skipping an advert because it has no ID.", advert);
        return false;
      }
      return !isSessionActive(advert);
    });

    if (adQueue.value.length > 0) {
      // If there are ads to show, open the dialog for the first one
      dialog.value = true;
    }
  });
</script>

<template>
  <v-dialog
    v-model="dialog"
    @after-leave="onAfterLeave"
    content-class="overflow-visible bg-transparent elevation-0"
    persistent
  >
    <div style="position: relative">
      <v-card
        class="pa-0"
        color="transparent"
        flat
      >
        <DesktopAdvertSlot
          v-if="currentAdvert"
          :advert="currentAdvert"
          class="height-dialog"
        />
      </v-card>

      <v-btn
        icon
        variant="flat"
        color="surface"
        class="close-button"
        @click="closeDialog"
        density="comfortable"
      >
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </div>
  </v-dialog>
</template>

<style scoped lang="scss">
  .close-button {
    position: absolute;
    // Position it at the top center, but outside the card
    top: 0;
    left: 50%;
    transform: translate(-50%, -150%);
    z-index: 20; // Ensure it's above the overlay
  }
  .height-dialog {
    display: block;
    margin-inline: auto;
    width: 100%;
    max-width: 530px;
    aspect-ratio: 530 / 590; // auto-calc height from width
    object-fit: contain;
    max-height: 85vh;
  }
</style>
