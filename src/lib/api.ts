import axios, { AxiosError, AxiosInstance, AxiosResponse } from "axios";
import { getAuthToken } from "./security";
import { env } from "@env";

const APIHelper: AxiosInstance = axios.create({
  baseURL: env.BASE_URL,
  timeout: 10000,
});

APIHelper.interceptors.request.use(
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

APIHelper.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Sentry.captureException(error);

    return Promise.reject(error);
  }
);

export default APIHelper;
