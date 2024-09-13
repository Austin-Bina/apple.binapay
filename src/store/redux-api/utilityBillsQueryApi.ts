import { env } from "@env";
import { route } from "@helpers/route";
import { getAuthToken } from "@lib/security";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CablePlan, DataPlan } from "@type/app";

interface DataResponse {
  service: "data" | "airtime" | "cable-tv" | "electricity" | "education";
  data_plans: {
    mtn: DataPlan[];
    glo: DataPlan[];
    airtel: DataPlan[];
    "9mobile": DataPlan[];
  };
}

interface CableResponse {
  service: "cable-tv";
  cable_plans: {
    [key: string]: CablePlan[];
  };
}

export const utilityBillsQueryApi = createApi({
  reducerPath: "utilityBillsApi",
  baseQuery: fetchBaseQuery({
    baseUrl: env.BASE_URL,
    prepareHeaders: async (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      headers.set("Authorization", `Bearer ${await getAuthToken()}`);

      return headers;
    },
  }),
  tagTypes: ["Data", "Cable"],
  endpoints: (builder) => ({
    getDataPlans: builder.query<DataResponse, void>({
      query: () => ({
        url: route("services.fetch"),
        params: { service: "data" },
      }),
      providesTags: [{ type: "Cable" }],
    }),
    getCablePlans: builder.query<CableResponse, void>({
      query: () => ({
        url: route("services.fetch"),
        params: { service: "cable-tv" },
      }),
      providesTags: ["Cable"],
    }),
  }),
});

export const { useGetDataPlansQuery, useGetCablePlansQuery } = utilityBillsQueryApi;
