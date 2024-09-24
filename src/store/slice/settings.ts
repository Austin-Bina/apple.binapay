import { route } from "@helpers/route";
import API from "@lib/api";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createTypedAsyncThunk } from "@store/common";
import { CustomerSettings, SystemSettings } from "@type/app";

interface SettingsState {
  theme: "light" | "dark";
  language: string;
  loading: boolean;
  error: string | null;
  system: SystemSettings;
}

const initialState: SettingsState = {
  theme: "light",
  language: "en",
  system: {
    customers: {
      bvn_verification_limit: 1,
      nin_verification_limit: 1,
      bvn_verification_charge: 10,
      nin_verification_charge: 60,
      account_deposit_percentage: 4,
      airtime_discount_percentage: 0,
      data_discount_percentage: 2,
      cable_discount_percentage: 2,
      education_discount_percentage: 2,
      epin_discount_percentage: 2,
      account_deposit_charge_percentage: 2,
      airtime_charge_percentage: 4,
      data_charge_percentage: 4,
      cable_charge_percentage: 4,
      education_charge_percentage: 4,
      epin_charge_percentage: 4,
      electricity_charge_percentage: 4,
      electricity_discount_percentage: 4,
    },
  },
  loading: false,
  error: null,
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.system = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

const fetchSettings = createTypedAsyncThunk("settings/fetchSettings", async (_, { rejectWithValue }) => {
  try {
    const response = await API.get<{ system: { customers: CustomerSettings } }>(route("account.settings"));
    const { system } = response.data;

    return system;
  } catch (error: any) {
    return rejectWithValue(error.response.data);
  }
});

export const settingsSliceActions = { ...settingsSlice.actions, fetchSettings };
