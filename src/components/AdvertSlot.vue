<script setup lang="ts">
  defineProps({
    advert: {
      type: Object,
      required: true,
    },
    class: {
      type: String,
      default: () => "",
    },
    aspectRatio: {
      type: Number || String,
      default: "",
    },
    height: {
      type: String,
      default: () => "100%",
    },
  });
</script>

<template>
  <v-card
    flat
    elevation="0"
    :class="class"
  >
    <NuxtLink
      :to="advert?.url || '#'"
      target="_blank"
      rel="nofollow noopener noreferrer"
    >
      <Image
        :src="advert?.image"
        :alt="advert?.title"
        contain
        :height="height"
        :aspectRatio="aspectRatio"
      />
    </NuxtLink>
  </v-card>
</template>
