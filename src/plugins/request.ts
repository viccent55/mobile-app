import axios, { type AxiosInstance } from "axios";
import { Session } from "@/utils/storage";
import qs from "qs";
import { Notify } from "@/stores/notification";
import { useStore } from "@/stores";
import dayjs from "dayjs";
import { encrypt, decrypt, makeSign } from "@/utils/crypto";

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
    const timestamp = dayjs().unix();

    if (config.data) {
      const encryptedData = encrypt(config.data);
      const sign = makeSign(timestamp, encryptedData);

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
    const res = response.data;
    if (res.code && res.code !== 0) {
      // `token` Expired or the account has been logged in elsewhere
      if (res.code === 401) {
        Session.clear(); // Clear all temporary browser caches
        window.location.reload();
        Notify.error("登录状态已过期，请重新登录");
      }
      return res;
    } else {
      return res;
    }
  },
  (error) => {
    // Do something with the response error
    if (error.message.indexOf("timeout") != -1) {
      Notify.error("网络超时");
    } else if (error.message == "Network Error") {
      Notify.error("网络连接错误");
    } else {
      if (error.status === 401) {
        Session.clear(); // Clear all temporary browser caches
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
