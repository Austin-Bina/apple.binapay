import { env } from "@env";
import { route } from "@helpers/route";
import { getAuthToken } from "@lib/security";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CablePlan, DataPlan, EducationPlan, ServiceDetails } from "@type/app";

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

interface EducationResponse {
  service: "education";
  education_plans: EducationPlan[];
}

export type ServiceDetailsResponse = ServiceDetails;

export interface DetailsBody {
  service_id: string;
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
  tagTypes: ["Data", "Cable", "Education", "Education Service Details"],
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
    getEducationPlans: builder.query<EducationResponse, void>({
      query: () => ({
        url: route("services.fetch"),
        params: { service: "education" },
      }),
      providesTags: ["Education"],
    }),
    getEducationServiceDetails: builder.query<ServiceDetailsResponse, DetailsBody>({
      query: (params) => ({
        url: route("services.education.serviceDetails"),
        params,
      }),
      providesTags: ["Education Service Details"],
    }),
  }),
});

export const {
  useGetDataPlansQuery,
  useGetCablePlansQuery,
  useGetEducationPlansQuery,
  useGetEducationServiceDetailsQuery,
} = utilityBillsQueryApi;
