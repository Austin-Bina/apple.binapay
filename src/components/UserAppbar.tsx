import { useTypedSelector } from "@store/common";
import { getNavigate } from "@utils/navigation";
import React, { memo } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { selectUser } from "@store/selectors/auth";
import { AvatarImage } from "./avatar";
import { selectNotificationMeta } from "@store/selectors/notification";
import { HasNotification, NoNotification } from "./icons/svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default memo(function UserAppbar() {
  const user             = useTypedSelector(selectUser);
  const notificationInfo = useTypedSelector(selectNotificationMeta);
  const hasNotification  = notificationInfo.unread_count > 0;
  const insets           = useSafeAreaInsets();

  return (
    <View style={[s.container, { paddingTop: insets.top + 8 }]}>
      {/* ── Avatar + greeting ── */}
      <TouchableOpacity
        style={s.left}
        activeOpacity={0.8}
        onPress={async () => {
          const { navigate } = await getNavigate();
          navigate("Main", { screen: "Menu", params: { screen: "Settings" } });
        }}
      >
        <View style={s.avatarWrap}>
          <AvatarImage avatar={user?.avatar} size={48} svgProps={{ width: 48, height: 48 }} />
        </View>
        <View style={s.greetingWrap}>
          <Text numberOfLines={1} style={s.greetingName}>
            Hi, {user?.name} 👋
          </Text>
          <Text style={s.greetingSub}>Pay seamlessly with BinaPay!</Text>
        </View>
      </TouchableOpacity>

      {/* ── Notification bell ── */}
      <TouchableOpacity
        style={s.notifBtn}
        activeOpacity={0.8}
        onPress={async () => {
          const { navigate } = await getNavigate();
          navigate("Main", {
            screen: "Home",
            params: { screen: "Notification", params: { screen: "List Notifications" } },
          });
        }}
      >
        {hasNotification ? (
          <>
            <HasNotification width={22} height={22} />
            <View style={s.notifDot} />
          </>
        ) : (
          <NoNotification width={22} height={22} />
        )}
      </TouchableOpacity>
    </View>
  );
});

const s = StyleSheet.create({
  container:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", paddingHorizontal: 16, paddingBottom: 12 },

  left:       { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  avatarWrap: { width: 50, height: 50, borderRadius: 25, borderWidth: 1.5, borderColor: "#d1fae5", overflow: "hidden" },

  greetingWrap: { flex: 1 },
  greetingName: { fontSize: 18, fontWeight: "700", color: "#111827" },
  greetingSub:  { fontSize: 13, color: "#6b7280", marginTop: 1 },

  notifBtn:   { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  notifDot:   { position: "absolute", top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: "#EF4444", borderWidth: 1.5, borderColor: "#fff" },
});
