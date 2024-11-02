import { defaultSystemSettings } from "@constants/app";
import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { SystemSettings } from "@type/app";

export const systemSettingsApi = createApi({
  reducerPath: "systemSettingsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["System Settings"],
  endpoints: (builder) => ({
    getSystemSettings: builder.query<SystemSettings, void>({
      query: () => ({
        url: route("account.settings"),
      }),
      transformResponse: (response: { system: SystemSettings }) => ({
        customers: response?.system?.customers ?? defaultSystemSettings.customers,
        transaction: response?.system.transaction ?? defaultSystemSettings.transaction,
        bank: response?.system.bank ?? defaultSystemSettings.bank,
    }),
    }),
  }),
});

export const { useGetSystemSettingsQuery, usePrefetch: useSystemSettingsPrefetch } = systemSettingsApi;
