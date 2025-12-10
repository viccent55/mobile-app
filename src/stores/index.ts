import { defineStore } from "pinia";

export const useStore = defineStore("store", {
  state: () => {
    return {
      apiEndPoint: "",
      urlEndPoint: "",
      apiHosts: ["https://test.xhsapi.sbs", "https://test.xhsapi.cyou"],
      urls: <string[]>[],
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

      ads: {
        name: "",
        image: "",
        base64: "",
        position: null as number | null,
        url: "",
      },
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
