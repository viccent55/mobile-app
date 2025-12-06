<script setup>
  import { computed, ref, watch, nextTick } from "vue";
  import { useLoggerStore } from "@/stores/logger";
  import { useApiHosts } from "@/composables/useApiHosts";

  const props = defineProps({
    modelValue: Boolean,
  });

  const emit = defineEmits(["update:modelValue"]);

  const logger = useLoggerStore();
  const { loading } = useApiHosts();

  const model = computed({
    get: () => props.modelValue,
    set: (v) => emit("update:modelValue", v),
  });

  const isShowModal = ref(logger.logs.length > 0);
  // 👇 ref to v-card-text (component)
  const logBox = ref(null);

  // 🔄 whenever a new log is added → scroll to bottom
  watch(
    () => logger.logs.length,
    async () => {
      await nextTick();
      const comp = logBox.value;
      const el = comp && "$el" in comp ? comp.$el : comp; // handle component vs raw element
      if (el && el instanceof HTMLElement) {
        el.scrollTop = el.scrollHeight;
      }
    }
  );

  function close() {
    isShowModal.value = false;
    emit("update:modelValue", false);
  }
</script>

<template>
  <v-dialog
    v-model="isShowModal"
    persistent
    max-width="500"
    scrollable
    transition="scale-transition"
  >
    <v-card
      class="pa-4"
      :loading="loading"
    >
      <v-card-title class="text-h6">API Host Resolving…</v-card-title>

      <!-- scrollable log area -->
      <v-card-text
        ref="logBox"
        class="log-box"
      >
        <div
          v-for="(line, i) in logger.logs"
          :key="i"
          class="text-body-2 mb-1"
        >
          {{ line }}
        </div>
      </v-card-text>

      <v-card-actions
        class="justify-end"
        v-if="!loading"
      >
        <v-btn
          variant="flat"
          color="primary"
          @click="close"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped>
  .log-box {
    max-height: 200px;
    overflow-y: auto;
  }
</style>
