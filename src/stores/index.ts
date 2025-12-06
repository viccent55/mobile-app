import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => {
    return {
      apiEndPoint: "",
      hosts: ["https://test.xhsapi.sbs", "https://test.xhsapi.cyou"],

      clouds: [
        {
          name: "worker",
          value: "https://xhs.jamescarter77.workers.dev",
        },
        {
          name: "gittee",
          value: "https://gitee.com/wuwencam/support/raw/master/xhs.json",
        },
        {
          name: "gitlab",
          value: "https://gitlab.com/wuwencam/support/-/raw/main/xhs.json",
        },

        {
          name: "bitbucket",
          value: "https://bitbucket.org/wuwencam/support/raw/main/xhs.json",
        },
      ],
      cloudHost: [],
      darkMode: "light",
      configuration: <EmptyObjectType>{},
      chan: "",
      mainAds: {} as EmptyObjectType,
      baseImage64: "",
      isInstalled: false,
    };
  },
  actions: {
    toggleTheme() {
      this.darkMode = this.darkMode === "dark" ? "light" : "dark";
    },
    setTheme(name: "light" | "dark") {
      this.darkMode = name;
    },
  },
  persist: true,
});
