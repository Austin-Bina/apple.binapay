import Empty from "@components/ui/empty-states/empty";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import { SCREENS } from "@constants/screens";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { NotificationStackScreenProps } from "@navigators/types";
import { FlashList } from "@shopify/flash-list";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import {
  notificationSelector,
  selectAllNotificationsLoaded,
  selectIsFetchingNotifications,
} from "@store/selectors/notifications";
import { notificationsActions } from "@store/slice/notificationSlice";
import { Notification } from "@type/app";
import { getCurrentRouteName } from "@utils/navigation";
import { formatDistance, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { AppState, FlatList, TouchableOpacity, View } from "react-native";
import { Image } from "react-native-element-image";
import { ActivityIndicator, Badge, Text } from "react-native-paper";

type Props = NotificationStackScreenProps<"List Notifications">;

const REFRESH_SCREEN_LIST = [SCREENS.NOTIFICATION, SCREENS.SETTINGS];

export default function NotificationScreen({ navigation }: Props) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [page, setPage] = useState(1);

  const allNotifications = useTypedSelector(notificationSelector.selectAll);
  const isFetching = useTypedSelector(selectIsFetchingNotifications);
  const isAllNotificationsLoaded = useTypedSelector(selectAllNotificationsLoaded);
  const dispatch = useTypedDispatch();

  const notifications = useMemo(() => {
    const data = allNotifications.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    type Grouped = {
      [group: string]: Notification[];
    };

    const groupedData: Grouped = data.reduce((acc, item) => {
      const { created_at } = item;
      const today = isToday(created_at);
      const yesterday = isYesterday(created_at);

      if (today) {
        if (!acc["Today"]) {
          acc["Today"] = [];
        }
        acc["Today"].push(item);
      } else if (yesterday) {
        if (!acc["Yesterday"]) {
          acc["Yesterday"] = [];
        }
        acc["Yesterday"].push(item);
      } else {
        if (!acc["Previous days"]) {
          acc["Previous days"] = [];
        }
        acc["Previous days"].push(item);
      }

      return acc;
    }, {} as Grouped);

    return groupedData;
  }, [allNotifications]);

  useEffect(() => {
    dispatch(notificationsActions.index({ page }));
  }, [dispatch, page]);

  // Update notifications when app comes to foreground from background
  useEffect(() => {
    const appStateListener = AppState.addEventListener("change", (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        const routeName = getCurrentRouteName();
        if (routeName && REFRESH_SCREEN_LIST.includes(routeName)) {
          dispatch(notificationsActions.index({ page }));
        }
      }
      setAppState(nextAppState);
    });
    return () => {
      appStateListener?.remove();
    };
  }, [appState, page, dispatch]);

  const onEndReached = useCallback(() => {
    if (!isAllNotificationsLoaded) {
      setPage(page + 1);
    }
  }, [page, isAllNotificationsLoaded]);

  const onRefresh = useCallback(() => {
    dispatch(notificationsActions.index({ page }));
  }, [dispatch, page]);

  const dynamicContent = useMemo(() => {
    if (!notifications || Object.entries(notifications).length === 0) {
      return (
        <Empty
          image={require("@assets/images/emptyNotifications.jpg")}
          title="No notifications yet."
          subTitle="Once you start receiving notifications, they'll appear here."
        />
      );
    }

    const renderMoreLoader = () => {
      return (
        <View style={tw`items-center h-full pt-2 pb-4 bg-white`}>
          {!isAllNotificationsLoaded ? (
            <View style={tw`flex-row items-center gap-2`}>
              <ActivityIndicator size="small" color={"gray"} animating={!isAllNotificationsLoaded} />
              <Text style={tw`text-gray-300`}>Loading more notifications...</Text>
            </View>
          ) : (
            <Text style={tw`text-gray-300`}>All Notifications loaded 🎉`</Text>
          )}
        </View>
      );
    };

    const onSelectNotification = async (item: Notification) => {
      const { id } = item;
      dispatch(notificationsActions.markNotificationAsRead({ id }));
      navigation.navigate("View Notification", { id });
    };

    return (
      <FlatList
        keyExtractor={([group]) => group}
        data={Object.entries(notifications)}
        renderItem={({ item: [group, notifications] }) => (
          <View key={group}>
            <Text variant="titleMedium" style={tw`text-gray-900`}>
              {group}
            </Text>
            {notifications.map((item) => (
              <Fragment key={item.id}>
                <TouchableOpacity
                  onPress={() => {
                    onSelectNotification(item);
                  }}
                  style={tw.style(
                    `flex-row items-center gap-2 my-3 p-2 rounded-2xl border border-gray-100`,
                    item.read_at ? "bg-white" : "bg-gray-100",
                  )}>
                  <Fragment>
                    <Image source={require("@assets/icons/logo-small.png")} width={60} height={60} />
                    <View style={tw`flex-1`}>
                      <View style={tw`flex-row items-center relative`}>
                        <Text variant="titleSmall" style={tw`text-gray-900`}>
                          {item.data.title}
                        </Text>
                        <Badge
                          visible={item.read_at !== null}
                          theme={{
                            colors: {
                              error: Colors.secondary.DEFAULT,
                              onError: "white",
                            },
                          }}
                          style={tw`absolute rounded top-2 right-2`}
                          size={20}>
                          Seen
                        </Badge>
                      </View>
                      <Text variant="bodyMedium" style={tw`text-gray-500 w-10/12`}>
                        {item.data.message}
                      </Text>
                      <Text style={tw`text-xs text-gray-400`}>Sent {formatDistanceToNow(item.created_at, { addSuffix: true })}</Text>
                    </View>
                  </Fragment>
                </TouchableOpacity>
              </Fragment>
            ))}
          </View>
        )}
        // estimatedItemSize={15}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        refreshing={false}
        onRefresh={onRefresh}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderMoreLoader}
        onEndReached={onEndReached}
      />
    );
  }, [onRefresh, onEndReached, notifications, isAllNotificationsLoaded]);

  return (
    <Screen>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold px-4 mt-5 `}>
        Notification
      </Text>
      <View style={tw`px-4 flex-1`}>{dynamicContent}</View>
      <PleaseWaitModal visible={isFetching && allNotifications.length === 0} />
    </Screen>
  );
}
