import Empty from "@components/ui/empty-states/empty";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import { SCREENS } from "@constants/screens";
import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import { NotificationStackScreenProps } from "@navigators/types";
import { useFetchNotificationsQuery } from "@store/redux-api/notificationApi";
import { BinaNotification } from "@type/app";
import { getCurrentRouteName } from "@utils/navigation";
import { formatDistanceToNow } from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, FlatList, TouchableOpacity, View } from "react-native";
import { Image } from "react-native-element-image";
import { ActivityIndicator, Badge, Text } from "react-native-paper";

type Props = NotificationStackScreenProps<"List Notifications">;

const REFRESH_SCREEN_LIST = [SCREENS.NOTIFICATION, SCREENS.SETTINGS];

export default function NotificationScreen({ navigation }: Props) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [page, setPage] = useState(1);

  const { data: queryData, isFetching, isLoading, refetch } = useFetchNotificationsQuery({ page });
  const notificationData = useMemo(() => {
    if (!queryData) {
      return {
        payload: {},
        meta: {
          has_more: false,
          unread_count: 0,
        },
      };
    }

    return queryData;
  }, [queryData]);

  // Update notifications when app comes to foreground from background
  useEffect(() => {
    const appStateListener = AppState.addEventListener("change", (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        const routeName = getCurrentRouteName();
        if (routeName && REFRESH_SCREEN_LIST.includes(routeName as any)) {
          refetch();
        }
      }
      setAppState(nextAppState);
    });
    return () => {
      appStateListener?.remove();
    };
  }, [appState]);

  const onEndReached = useCallback(() => {
    if (!isFetching && queryData?.meta.has_more) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [isFetching, queryData]);

  const EmptyList = useCallback(() => {
    if (Object.entries(notificationData.payload).length === 0) {
      return (
        <Empty
          image={require("@assets/images/emptyNotifications.jpg")}
          title="No notifications yet."
          subTitle="Once you start receiving notifications, they'll appear here."
        />
      );
    }

    return null;
  }, [notificationData]);

  const renderMoreLoader = useMemo(() => {
    return (
      <View style={tw`items-center h-full pt-2 pb-4 bg-white`}>
        {notificationData.meta.has_more ? (
          <View style={tw`flex-row items-center gap-2`}>
            <ActivityIndicator size="small" color={"gray"} animating={true} />
            <Text style={tw`text-gray-300`}>Loading more notifications...</Text>
          </View>
        ) : (
          <Text style={tw`text-gray-300`}>All Notifications loaded 🎉`</Text>
        )}
      </View>
    );
  }, [notificationData.meta.has_more]);

  const onSelectNotification = async (item: BinaNotification) => {
    navigation.navigate("View Notification", { id: item.id });
  };

  return (
    <Screen style={tw`pb-0`}>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold px-4 py-5 `}>
        Notification
      </Text>
      <View style={tw`px-4 flex-1`}>
        <EmptyList />

        <FlatList
          keyExtractor={([group]) => group}
          data={Object.entries(notificationData.payload)}
          renderItem={({ item: [group, notifications] }) => (
            <View key={group}>
              <Text variant="titleMedium" style={tw`text-gray-900`}>
                {group}
              </Text>
              {notifications.map((item) => (
                <NotificationItem key={item.id} item={item} onSelectNotification={onSelectNotification} />
              ))}
            </View>
          )}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          refreshing={false}
          onRefresh={refetch}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderMoreLoader}
          onEndReached={onEndReached}
        />
      </View>
      <PleaseWaitModal visible={isLoading} />
    </Screen>
  );
}

type NotificationItemProps = {
  item: BinaNotification;
  onSelectNotification: (notification: BinaNotification) => void;
};

const NotificationItem = React.memo<NotificationItemProps>(({ item, onSelectNotification }) => (
  <TouchableOpacity
    onPress={() => onSelectNotification(item)}
    style={tw.style(
      `flex-row items-center gap-2 my-3 p-2 rounded-2xl border border-gray-100`,
      item.read_at ? "bg-white" : "bg-gray-100",
    )}>
    <Image source={require("@assets/icons/logo-small.png")} width={60} height={60} />
    <View style={tw`flex-1`}>
      <View style={tw`flex-row items-center relative`}>
        <Text variant="titleSmall" style={tw`text-gray-900`}>
          {item.data.title}
        </Text>
        <Badge
          visible={item.read_at !== null}
          theme={{ colors: { error: Colors.secondary.DEFAULT, onError: "white" } }}
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
  </TouchableOpacity>
));
