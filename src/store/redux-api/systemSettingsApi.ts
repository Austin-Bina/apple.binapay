import { defaultSystemSettings } from "@constants/app";
import { defaultVersionCheckResponse } from "@helpers/notification";
import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { SystemSettings } from "@type/app";
import * as Application from "expo-application";
import { Platform } from "react-native";

export type VersionCheckResponse = {
  updateAvailable: boolean;
  latestVersion: string;
  updateUrl: string;
  isForced: boolean;
};

const currentVersion = Application.nativeBuildVersion;
const os = Platform.OS;

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
    // Check app version
    checkAppVersion: builder.query<VersionCheckResponse, void>({
      query: () => ({
        url: route("resources.checkAppVersion"),
        params: { version: currentVersion, os },
      }),
      transformResponse: (response: VersionCheckResponse) => {
        return { ...defaultVersionCheckResponse, ...response };
      },
    }),
  }),
});

export const {
  useGetSystemSettingsQuery,
  useCheckAppVersionQuery,
  usePrefetch: useSystemSettingsPrefetch,
} = systemSettingsApi;
