import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { SystemSettings } from "@type/app";

type SystemError =
  | {
      code: "unknown_error";
      message: "Something went wrong. Please try again.";
      context: string;
    }
  | {
      code: "client_insufficient_funds";
      context: string;
    };

interface SettingsState {
  theme: "light" | "dark";
  language: string;
  loading: boolean;
  error: SystemError | null;
}

const initialState: SettingsState = {
  theme: "light",
  language: "en",
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
    setApplicationError: (state, action: PayloadAction<SystemError>) => {
      state.error = action.payload;
    },
    clearApplicationError: (state) => {
      state.error = null;
    },
  },
});

export const settingsSliceActions = { ...settingsSlice.actions };
