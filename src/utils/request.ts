import axios, { type AxiosInstance } from "axios";
import { encrypt, decrypt, makeSign, timestamp } from "@/utils/crypto";

import qs from "qs";
import { useStore } from "@/stores";

import { Notify } from "@/stores/notification";

const service: AxiosInstance = axios.create({
  timeout: 10000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  paramsSerializer: {
    serialize(params) {
      return qs.stringify(params, { allowDots: true });
    },
  },
});

// Adding a request interceptor
service.interceptors.request.use(
  (config) => {
    const store = useStore();
    if (store.apiEndPoint) {
      config.baseURL = store.apiEndPoint + "/apiv1";
    }
    const client = "pwa";

    if (config.data) {
      const encryptedData = encrypt(config.data);
      const sign = makeSign(timestamp(), encryptedData);
      config.data = {
        client,
        timestamp,
        data: encryptedData,
        sign,
      };
    }
    return config;
  },
  (error) => Promise.reject(error)
);

service.interceptors.response.use(
  (response) => {
    if (response.data.errcode === 401001) {
      const userStore = useUserStore();
      userStore.logout();
      Notify.error(response.data.info);
    }

    if (response.status === 200) {
      // decrypt only if response contains "data"
      if (response.data?.data) {
        try {
          const decrypted = decrypt(response.data.data);
          response.data = decrypted;
          if (import.meta.env.MODE === "development") {
            console.log(`Decrypted: ${response.config.url}`, decrypted);
          }
        } catch (e) {
          console.warn("Decryption failed:", e, response.data);
        }
      }
      return response.data;
    }
    // const res = response.data;
    // if (res.code && res.code !== 0) {
    //   // `token` Expired or the account has been logged in elsewhere
    //   if (res.code === 401) {
    //     Session.clear(); // Clear all temporary browser caches
    //     window.location.reload();
    //     Notify.error("登录状态已过期，请重新登录");
    //   }
    //   return res;
    // } else {
    //   return res;
    // }
  },
  (error) => {
    // Do something with the response error
    if (error.message.indexOf("timeout") != -1) {
      Notify.error("网络超时");
    } else if (error.message == "Network Error") {
      Notify.error("网络连接错误");
    } else {
      if (error.status === 401) {
        window.location.reload();
        Notify.error("登录状态已过期，请重新登录");
      }

      if (error.response?.data) Notify.info(error.response.statusText);
      else Notify.error("接口路径找不到");
    }
    return Promise.reject(error);
  }
);

export default service;
