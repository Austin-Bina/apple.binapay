import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { BinaNotification } from "@type/app";

export type ListNotificationResponse = {
  payload: {
    [group: string]: BinaNotification[];
  };
  meta: { has_more: boolean; unread_count: number };
};

type ListPayload = {
  page: number;
};

type MarkAllPayload = {
  pageCache: number;
};

type ClearPayload = {
  pushToken: string;
  pageCache: number;
};

export const initialNotificationState: ListNotificationResponse = {
  payload: {},
  meta: {
    unread_count: 0,
    has_more: false,
  },
};

export const notificationsApi = createApi({
  reducerPath: "notificationsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Notifications"],
  endpoints: (builder) => ({
    fetchNotifications: builder.query<ListNotificationResponse, ListPayload>({
      query: (params) => ({
        url: route("notification.index"),
        params,
      }),
      providesTags: [{ type: "Notifications" }],
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      transformResponse: (response: ListNotificationResponse) => ({
        payload: response.payload ?? [],
        meta: response.meta ?? { has_more: false, unread_count: 0 },
      }),
      merge: (currentCache, newItems) => {
        const newGroupedNotifications = newItems.payload;

        const mergedNotifications = { ...currentCache.payload };

        Object.entries(newGroupedNotifications).forEach(([group, newNotifications]) => {
          if (!mergedNotifications[group]) {
            mergedNotifications[group] = [];
          }
          // Create a Set of existing notification IDs in the current group
          const existingNotificationIds = new Set(mergedNotifications[group].map((t) => t.id));
          const uniqueNewNotifications = newNotifications.filter(
            (newNotification) => !existingNotificationIds.has(newNotification.id),
          );
          mergedNotifications[group] = [...uniqueNewNotifications, ...mergedNotifications[group]];
        });

        return {
          ...newItems,
          payload: mergedNotifications,
        };
      },
    }),
    markAsRead: builder.mutation<void, { notificationId: string }>({
      query: ({ notificationId }) => ({
        url: route("notification.markAsRead"),
        method: "POST",
        data: { id: notificationId },
      }),
      onQueryStarted: async ({ notificationId }, { dispatch, queryFulfilled }) => {
        const patchResult = dispatch(
          notificationsApi.util.updateQueryData("fetchNotifications", { page: 1 }, (draft) => {
            Object.keys(draft.payload).forEach((group) => {
              const notification = draft.payload[group].find((n) => n.id === notificationId);
              if (notification) {
                notification.read_at = "read_at";
              }
            });
          }),
        );

        try {
          await queryFulfilled;
        } catch (error) {
          patchResult.undo();
          console.error("Failed to mark notification as read:", error);
        }
      },
    }),
    markAllNotificationsAsRead: builder.mutation<void, MarkAllPayload>({
      query: () => ({
        url: route("notification.markAllAsRead"),
        method: "POST",
      }),
      onQueryStarted: async ({ pageCache }, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
          dispatch(
            notificationsApi.util.updateQueryData("fetchNotifications", { page: pageCache }, (draft) => {
              draft.meta.unread_count = 0;

              Object.keys(draft.payload).forEach((group) => {
                draft.payload[group].forEach((notification) => {
                  notification.read_at = "read_at";
                });
              });
            }),
          );
        } catch (error) {
          // Handle error
        }
      },
    }),
    clearDeviceDetails: builder.mutation<void, ClearPayload>({
      query: (body) => ({
        url: route("notification.clearDeviceDetails"),
        method: "POST",
        body: { push_token: body.pushToken },
      }),
      // onQueryStarted: async ({ pageCache }, { dispatch, queryFulfilled }) => {
      //     try {
      //         await queryFulfilled;
      //         dispatch(
      //             notificationsApi.util.updateQueryData("fetchNotifications", { page: pageCache }, (draft) => {
      //                 draft.meta.push_token = null;
      //             }),
      //         );
      //     } catch (error) {
      //         // Handle error
      //     }
      // },
    }),
  }),
});

export const {
  useFetchNotificationsQuery,
  useMarkAllNotificationsAsReadMutation,
  useClearDeviceDetailsMutation,
  useMarkAsReadMutation,
} = notificationsApi;
