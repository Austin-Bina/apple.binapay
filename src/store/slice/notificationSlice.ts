import { updateBadgeCount } from "@helpers/notification";
import { route } from "@helpers/route";
import API from "@lib/api";
import { createSlice, createEntityAdapter, EntityId, EntityState, PayloadAction } from "@reduxjs/toolkit";
import { createTypedAsyncThunk } from "@store/common";
import { Notification } from "@type/app";

interface NotificationState extends EntityState<Notification, EntityId> {
  uiFlags: {
    loading: boolean;
    isAllNotificationsLoaded: boolean;
  };
  meta: {
    unread_count: number;
  };
  pushToken: string | null;
}

type ListNotificationResponse = {
  notifications: Notification[];
  meta: { has_more: boolean; unread_count: number };
};

type ListPayload = {
  page: number;
};

type ReadPayload = {
  id: string;
};

type TAddNotification = {
  notification: Notification;
  unread_count: number;
};

export const notificationAdapter = createEntityAdapter<Notification, EntityId>({
  selectId: (notification) => notification.id,
});

export const initialNotificationState: NotificationState = {
  ...notificationAdapter.getInitialState(),
  uiFlags: {
    loading: false,
    isAllNotificationsLoaded: false,
  },
  meta: {
    unread_count: 0,
  },
  pushToken: null,
};

export const notificationSlice = createSlice({
  name: "notifications",
  initialState: initialNotificationState,
  reducers: {
    addNotification(state, action: PayloadAction<TAddNotification>) {
      const { notification, unread_count } = action.payload;
      notificationAdapter.addOne(state, notification);
      state.meta.unread_count = unread_count;
      updateBadgeCount({ count: unread_count });
    },
    updateBadgeCount(state, action: PayloadAction<number>) {
      state.meta.unread_count = action.payload;
      updateBadgeCount({ count: action.payload });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(actions.index.pending, (state) => {
        state.uiFlags.loading = true;
      })
      .addCase(actions.index.fulfilled, (state, action) => {
        state.uiFlags.loading = false;
        state.meta = action.payload.meta;
        notificationAdapter.upsertMany(state, action.payload.notifications);
        state.uiFlags.isAllNotificationsLoaded = action.payload.meta.has_more === false;
      })
      .addCase(actions.index.rejected, (state) => {
        state.uiFlags.loading = false;
      })
      .addCase(actions.markNotificationAsRead.fulfilled, (state, action) => {
        const { id } = action.payload;
        const notification = state.entities[id];

        if (notification) {
          notification.read_at = "read_at"; // Placeholder for actual timestamp
        }

        state.meta.unread_count = Math.max(state.meta.unread_count - 1, 0);
      })

      .addCase(actions.markNotificationAsRead.rejected, (state, action) => {})
      .addCase(actions.markAllNotificationAsRead.fulfilled, (state, action) => {
        state.meta.unread_count = 0;
        Object.keys(state.entities).forEach((key) => {
          state.entities[key].read_at = "read_at";
        });
      })
      // .addCase(actions.saveDeviceDetails.fulfilled, (state, action) => {
      //   state.pushToken = action.payload.fcmToken;
      // })
      .addCase(actions.clearDeviceDetails.fulfilled, (state) => {
        state.pushToken = null;
      });
  },
});

export const actions = {
  index: createTypedAsyncThunk<ListNotificationResponse, ListPayload>(
    "notifications/index",
    async (params, { rejectWithValue }) => {
      try {
        const response = await API.get(route("notification.index"), { params });
        const { payload, meta } = response.data;
        const { unread_count } = meta;

        updateBadgeCount({ count: unread_count });

        return {
          notifications: payload,
          meta,
        };
      } catch (error) {
        return rejectWithValue(error);
      }
    },
  ),
  markNotificationAsRead: createTypedAsyncThunk<{ id: string }, ReadPayload>(
    "notifications/markNotificationAsRead",
    async (body, { getState, rejectWithValue }) => {
      try {
        const {
          meta: { unread_count },
        } = getState().notifications;
        const unreadCount = unread_count ? unread_count - 1 : 0;
        await API.post(route("notification.read"), body);
        updateBadgeCount({ count: unreadCount });
        return body;
      } catch (error) {
        return rejectWithValue(error);
      }
    },
  ),
  markAllNotificationAsRead: createTypedAsyncThunk(
    "notifications/markAllNotificationAsRead",
    async (_, { rejectWithValue }) => {
      try {
        await API.post(route("notification.markAllAsRead"));
        updateBadgeCount({ count: 0 });
        return {};
      } catch (error) {
        return rejectWithValue(error);
      }
    },
  ),
  // saveDeviceDetails: createTypedAsyncThunk("notifications/saveDeviceDetails", async (_, { rejectWithValue }) => {
  //   try {
  //     const permissionEnabled = await messaging().hasPermission();
  //     const fcmToken = await messaging().getToken();
  //     const deviceId = await getUniqueId();
  //     const devicePlatform = getSystemName();
  //     const manufacturer = await getManufacturer();
  //     const model = await getModel();
  //     const apiLevel = await getApiLevel();
  //     const deviceName = `${manufacturer} ${model}`;

  //     const isAndroidAPILevelGreater32 = apiLevel > 32 && Platform.OS === "android";
  //     const brandName = await getBrand();
  //     const buildNumber = await getBuildNumber();

  //     if (!permissionEnabled || permissionEnabled === -1) {
  //       if (isAndroidAPILevelGreater32) {
  //         await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  //       }
  //       await messaging().requestPermission();
  //       AnalyticsHelper.track(ACCOUNT_EVENTS.ENABLE_PUSH_NOTIFICATION, {
  //         devicePlatform,
  //         deviceName,
  //         brandName,
  //         buildNumber,
  //       });
  //     }

  //     const pushData = {
  //       subscription_type: "fcm",
  //       subscription_attributes: {
  //         deviceName,
  //         devicePlatform,
  //         apiLevel,
  //         brandName,
  //         buildNumber,
  //         push_token: fcmToken,
  //         device_id: deviceId,
  //       },
  //     };
  //     const headers = await getHeaders();
  //     const baseURL = await getBaseUrl();
  //     await axios.post(`${baseURL}${API_URL}notification_subscriptions`, pushData, {
  //       headers: headers,
  //     });
  //     return { fcmToken };
  //   } catch (error) {
  //     return rejectWithValue(error);
  //   }
  // }),
  // TODO: Use on logout
  clearDeviceDetails: createTypedAsyncThunk<void, { pushToken: string }>(
    "notifications/clearDeviceDetails",
    async ({ pushToken }, { rejectWithValue }) => {
      try {
        const data = { push_token: pushToken };
        await API.post(route("notifications.clearDeviceDetails"), data);
      } catch (error) {
        return rejectWithValue(error);
      }
    },
  ),
};

export const notificationsActions = { ...notificationSlice.actions, ...actions };
