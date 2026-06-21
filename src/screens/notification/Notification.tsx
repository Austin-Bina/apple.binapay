import Empty from "@components/ui/empty-states/empty";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { SCREENS } from "@constants/screens";
import { NotificationStackScreenProps } from "@navigators/types";
import { useFetchNotificationsQuery } from "@store/redux-api/notificationApi";
import { BinaNotification } from "@type/app";
import { getCurrentRouteName } from "@utils/navigation";
import { formatDistanceToNow } from "date-fns";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AppState, FlatList, TouchableOpacity, View, StyleSheet, SafeAreaView } from "react-native";
import { ActivityIndicator, Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "react-native-element-image";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";
const REFRESH_SCREEN_LIST = [SCREENS.NOTIFICATION, SCREENS.SETTINGS];

type Props = NotificationStackScreenProps<"List Notifications">;

export default function NotificationScreen({ navigation }: Props) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [page, setPage]         = useState(1);
  const insets                  = useSafeAreaInsets();

  const { data: queryData, isFetching, isLoading, refetch } = useFetchNotificationsQuery({ page });

  const notificationData = useMemo(() => {
    if (!queryData) return { payload: {}, meta: { has_more: false, unread_count: 0 } };
    return queryData;
  }, [queryData]);

  useEffect(() => {
    const appStateListener = AppState.addEventListener("change", (nextAppState) => {
      if (appState.match(/inactive|background/) && nextAppState === "active") {
        const routeName = getCurrentRouteName();
        if (routeName && REFRESH_SCREEN_LIST.includes(routeName as any)) refetch();
      }
      setAppState(nextAppState);
    });
    return () => appStateListener?.remove();
  }, [appState]);

  const onEndReached = useCallback(() => {
    if (!isFetching && queryData?.meta.has_more) setPage((p) => p + 1);
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

  const renderMoreLoader = useMemo(() => (
    <View style={s.loaderRow}>
      {notificationData.meta.has_more ? (
        <>
          <ActivityIndicator size="small" color="#9ca3af" animating />
          <Text style={s.loaderText}>Loading more...</Text>
        </>
      ) : (
        <Text style={s.loaderText}>All notifications loaded</Text>
      )}
    </View>
  ), [notificationData.meta.has_more]);

  const onSelectNotification = (item: BinaNotification) => {
    navigation.navigate("View Notification", { id: item.id });
  };

  return (
    <SafeAreaView style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerIconWrap}>
          <MaterialCommunityIcons name="bell-outline" size={18} color={BLUE} />
        </View>
        <Text style={s.headerTitle}>Notifications</Text>
        {notificationData.meta.unread_count > 0 && (
          <View style={s.unreadBadge}>
            <Text style={s.unreadBadgeText}>{notificationData.meta.unread_count} unread</Text>
          </View>
        )}
      </View>

      <View style={s.listWrap}>
        <EmptyList />
        <FlatList
          keyExtractor={([group]) => group}
          data={Object.entries(notificationData.payload)}
          renderItem={({ item: [group, notifications] }) => (
            <View style={s.groupWrap}>
              <Text style={s.groupLabel}>{group}</Text>
              {notifications.map((item) => (
                <NotificationItem key={item.id} item={item} onSelectNotification={onSelectNotification} />
              ))}
            </View>
          )}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={refetch}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderMoreLoader}
          onEndReached={onEndReached}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      </View>

      <PleaseWaitModal visible={isLoading} />
    </SafeAreaView>
  );
}

type NotificationItemProps = {
  item: BinaNotification;
  onSelectNotification: (n: BinaNotification) => void;
};

const NotificationItem = React.memo<NotificationItemProps>(({ item, onSelectNotification }) => {
  const isUnread = !item.read_at;
  return (
    <TouchableOpacity
      onPress={() => onSelectNotification(item)}
      style={[s.notifRow, isUnread && s.notifRowUnread]}
      activeOpacity={0.7}
    >
      <View style={s.notifIconWrap}>
        <Image source={require("@assets/icons/logo-small.png")} width={32} height={32} />
      </View>
      <View style={s.notifContent}>
        <View style={s.notifTitleRow}>
          <Text style={s.notifTitle} numberOfLines={1}>{item.data.title}</Text>
          {isUnread && <View style={s.unreadDot} />}
        </View>
        <Text style={s.notifMessage} numberOfLines={2}>{item.data.message}</Text>
        <Text style={s.notifTime}>{formatDistanceToNow(item.created_at, { addSuffix: true })}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={16} color="#d1d5db" />
    </TouchableOpacity>
  );
});

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  header:          { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  headerIconWrap:  { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:     { fontSize: 17, fontWeight: "700", color: BRAND, flex: 1 },
  unreadBadge:     { backgroundColor: "#EEF3FF", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  unreadBadgeText: { fontSize: 11, fontWeight: "700", color: BLUE },

  listWrap:        { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  groupWrap:       { marginBottom: 12 },
  groupLabel:      { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },

  notifRow:        { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: "#f0f0f0" },
  notifRowUnread:  { backgroundColor: "#EEF3FF", borderColor: "#bfdbfe" },
  notifIconWrap:   { width: 44, height: 44, borderRadius: 22, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center", overflow: "hidden" },
  notifContent:    { flex: 1 },
  notifTitleRow:   { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  notifTitle:      { fontSize: 13, fontWeight: "700", color: "#111827", flex: 1 },
  unreadDot:       { width: 8, height: 8, borderRadius: 4, backgroundColor: BLUE },
  notifMessage:    { fontSize: 12, color: "#6b7280", lineHeight: 17, marginBottom: 4 },
  notifTime:       { fontSize: 11, color: "#9ca3af" },

  loaderRow:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 16 },
  loaderText:      { fontSize: 12, color: "#9ca3af" },
});
