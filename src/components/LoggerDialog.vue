<script setup lang="ts">
  import { computed, ref, watch, nextTick } from "vue";
  import { useLoggerStore } from "@/stores/logger";
  import { useApiHosts } from "@/composables/useApiHosts";

  const props = defineProps<{
    modelValue: boolean;
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", v: boolean): void;
  }>();

  const logger = useLoggerStore();
  const { loading } = useApiHosts();

  const model = computed({
    get: () => props.modelValue,
    set: (v: boolean) => emit("update:modelValue", v),
  });

  const logBox = ref<HTMLElement | null>(null);

  watch(
    () => logger.logs.length,
    async () => {
      await nextTick();
      const el = logBox.value;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  );

  function close() {
    model.value = false;
  }
</script>

<template>
  <v-dialog
    v-model="model"
    max-width="500"
    max-height="500px"
    persistent
    scrollable
    transition="scale-transition"
  >
    <v-card
      class="pa-4"
      :loading="loading"
    >
      <v-card-title class="text-h6">API Host Resolving…</v-card-title>

      <v-card-text>
        <div
          v-if="loading"
          class="loading-row mb-3"
        >
          <v-progress-circular
            indeterminate
            size="20"
            color="primary"
          />
          <span class="text-caption text-medium-emphasis">正在检测可用线路…</span>
        </div>

        <div
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
        </div>
      </v-card-text>

      <v-card-actions class="justify-end">
        <v-btn
          v-if="!loading"
          color="primary"
          @click="close"
        >
          关闭
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style scoped lang="scss">
  .log-box {
    max-height: 300px;
    overflow-y: auto;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.04);
    padding: 8px;
  }

  .loading-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
</style>
