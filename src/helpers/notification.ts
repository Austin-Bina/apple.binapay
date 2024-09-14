import * as Notifications from 'expo-notifications';

type BadgeCount = {
  count: number;
};

export const updateBadgeCount = (badgeCount: BadgeCount) => {
  Notifications.setBadgeCountAsync(badgeCount.count);
}
