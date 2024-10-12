import { defaultSystemSettings } from "@constants/app";
import { createSelector } from "@reduxjs/toolkit";
import { systemSettingsApi } from "@store/redux-api/systemSettingsApi";

const systemSettingsResult = systemSettingsApi.endpoints.getSystemSettings.select;

const selectSystemSettings = createSelector([systemSettingsResult()], (result) => {
  if (result.data) {
    return result.data;
  }

  return defaultSystemSettings;
});

export { selectSystemSettings };
