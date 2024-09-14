import { State } from "@store/main";
import { notificationAdapter } from "@store/slice/notificationSlice";

export const notificationSelector = notificationAdapter.getSelectors((state: State) => state.notifications);
export const selectAllNotificationsLoaded = (state: State) => state.notifications.uiFlags.isAllNotificationsLoaded;
export const selectIsFetchingNotifications = (state: State) => state.notifications.uiFlags.loading;
export const selectUnreadCount = (state: State) => state.notifications.meta.unread_count;
export const selectPushToken = (state: State) => state.notifications.pushToken;
