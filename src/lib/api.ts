import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getAuthToken } from "./security";
import { env } from "@env";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";

const API: AxiosInstance = axios.create({
  baseURL: env.BASE_URL,
  timeout: 60000,
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
  },
);

API.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    // Sentry.captureException(error);

    return Promise.reject(error);
  },
);

export default API;

type QueryArgs = {
  baseUrl: string;
};

type AxiosQueryResponse = BaseQueryFn<
  {
    url: string;
    method?: AxiosRequestConfig["method"];
    data?: AxiosRequestConfig["data"];
    params?: AxiosRequestConfig["params"];
    headers?: AxiosRequestConfig["headers"];
  },
  unknown,
  unknown
>;

const axiosBaseQuery =
  ({ baseUrl }: QueryArgs = { baseUrl: env.BASE_URL! }): AxiosQueryResponse =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await API({
        url: baseUrl + url,
        method,
        data,
        params,
        headers,
      });

      return { data: result.data };
    } catch (axiosError) {
      const err = axiosError as AxiosError;

      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export { axiosBaseQuery };
