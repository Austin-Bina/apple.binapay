import * as Notifications from "expo-notifications";
import * as Application from "expo-application";

type BadgeCount = {
  count: number;
};

const updateBadgeCount = (badgeCount: BadgeCount) => {
  Notifications.setBadgeCountAsync(badgeCount.count);
};

const defaultVersionCheckResponse = {
  updateAvailable: false,
  latestVersion: Application.nativeBuildVersion || "",
  updateUrl: "",
  isForced: false,
};

export { updateBadgeCount, defaultVersionCheckResponse };
