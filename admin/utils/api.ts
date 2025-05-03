// utils/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { SERVER_URI } from "./uri";

const api = axios.create({
  baseURL: SERVER_URI,
  timeout: 10000,
});

api.interceptors.request.use(
  async (config) => {
    const accessToken = await AsyncStorage.getItem("access_token");
    const refreshToken = await AsyncStorage.getItem("refresh_token");
    if (accessToken && refreshToken) {
      config.headers["access-token"] = accessToken;
      config.headers["refresh-token"] = refreshToken;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem("access_token");
      await AsyncStorage.removeItem("refresh_token");
    }
    return Promise.reject(error);
  }
);

export default api;