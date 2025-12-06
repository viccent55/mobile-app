import { defineStore } from "pinia";

export const useLoggerStore = defineStore("logger", () => {
  const logs = ref<string[]>([]);

  function log(msg: string) {
    console.log("[LOG]", msg);
    logs.value.push(msg);
  }

  function clear() {
    logs.value = [];
  }

  return { logs, log, clear };
});
