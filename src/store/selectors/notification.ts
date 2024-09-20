import { createSelector } from "@reduxjs/toolkit";
import { notificationsApi } from "@store/redux-api/notificationApi";

const selectNotificationsResult = notificationsApi.endpoints.fetchNotifications.select;

const selectNotificationById = (notificationId: string) =>
  createSelector([selectNotificationsResult({ page: 1 })], (result) => {
    if (result?.data) {
      const { payload } = result.data;

      const allNotifications = Object.values(payload).flat();

      const notification = allNotifications.find((notification) => notification.id === notificationId);
      return notification;
    }
  });

const selectNotificationMeta = createSelector([selectNotificationsResult({ page: 1 })], (result) => {
  if (result?.data) {
    const { meta } = result.data;
    return { ...meta };
  }
  return {
    unread_count: 0,
    has_more: false,
  };
});

export { selectNotificationById, selectNotificationMeta };
