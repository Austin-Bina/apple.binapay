/*
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


*/

/**
 * for debugging
 */
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { getAuthToken } from "./security";
import { env } from "@env";
import type { BaseQueryFn } from "@reduxjs/toolkit/query";

const API: AxiosInstance = axios.create({
  baseURL: env.BASE_URL,
  timeout: 60000,
});

// 🔹 Request interceptor
API.interceptors.request.use(
  async (config) => {
    const token = await getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log outgoing request
    console.log("📤 Axios Request:", {
      method: config.method?.toUpperCase(),
      url: `${config.baseURL || ""}${config.url}`,
      headers: config.headers,
      params: config.params,
      data: config.data,
    });

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Axios Request Error:", error);
    return Promise.reject(error);
  }
);

// 🔹 Response interceptor
API.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log("✅ Axios Response:", {
      url: response.config.url,
      status: response.status,
      data: response.data,
    });
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      console.error("❌ Axios Error Response:", {
        url: error.config?.url,
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error("❌ Axios No Response:", error.request);
    } else {
      console.error("❌ Axios Setup Error:", error.message);
    }

    console.log("Axios Config:", error.config);
    return Promise.reject(error);
  }
);

export default API;

// ------------------------
// Axios Base Query for RTK
// ------------------------

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

      console.error("⚠️ Axios BaseQuery Error:", {
        url,
        method,
        data,
        params,
        errorMessage: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });

      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export { axiosBaseQuery };


