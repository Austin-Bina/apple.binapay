import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { getAuthToken } from "./security";
import { env } from "@env";

const API: AxiosInstance = axios.create({
  baseURL: env.BASE_URL,
  timeout: 30000,
});

API.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Sentry.captureException(error);

    return Promise.reject(error);
  }
);

export default API;
