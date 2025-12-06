<script setup lang="ts">

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: boolean): void;
}>();

// computed for v-model binding
const isOverlay = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});
</script>

<template>
  <v-overlay
    v-model="isOverlay"
    contained
    persistent
    class="align-center justify-center"
  >
    <v-progress-circular indeterminate color="primary" />
  </v-overlay>
</template>
