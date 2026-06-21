import ScrollableView from "@components/ui/shared/ScrollableView";
import { NotificationStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { useMarkAsReadMutation } from "@store/redux-api/notificationApi";
import { selectNotificationById } from "@store/selectors/notification";
import { formatDistanceToNow } from "date-fns";
import { useEffect } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type Props = NotificationStackScreenProps<"View Notification">;

export default function ViewNotificationScreen({ route, navigation }: Props) {
  const { id }   = route.params;
  const insets   = useSafeAreaInsets();

  const [markAsRead]   = useMarkAsReadMutation();
  const notification   = useTypedSelector(selectNotificationById(id));

  useEffect(() => {
    if (notification && !notification?.read_at) {
      markAsRead({ notificationId: notification.id });
    }
  }, [notification]);

  if (!notification) {
    return (
      <SafeAreaView style={s.root}>
        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Notification</Text>
        </View>
        <View style={s.notFoundWrap}>
          <MaterialCommunityIcons name="bell-off-outline" size={48} color="#d1d5db" />
          <Text style={s.notFoundText}>Notification not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isRead = notification.read_at !== null;

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notification</Text>
        {isRead && (
          <View style={s.readBadge}>
            <MaterialCommunityIcons name="check-circle" size={12} color="#16a34a" />
            <Text style={s.readBadgeText}>Read</Text>
          </View>
        )}
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>
        {/* Title card */}
        <View style={s.titleCard}>
          <View style={s.titleIconWrap}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.notifTitle}>{notification.data.title}</Text>
            <Text style={s.notifTime}>
              {formatDistanceToNow(notification.created_at, { addSuffix: true })}
            </Text>
          </View>
        </View>

        {/* Message */}
        <Text style={s.sectionLabel}>Message</Text>
        <View style={s.card}>
          <Text style={s.messageText}>{notification.data.message}</Text>
        </View>

        {/* Details */}
        {notification.data.details && Object.keys(notification.data.details).length > 0 && (
          <>
            <Text style={s.sectionLabel}>Details</Text>
            <View style={s.card}>
              {Object.entries(notification.data.details).map(([key, value], index, arr) => (
                <View key={key}>
                  <View style={s.detailRow}>
                    <Text style={s.detailKey}>{key}</Text>
                    <Text style={s.detailValue}>{String(value)}</Text>
                  </View>
                  {index < arr.length - 1 && <View style={s.rowDivider} />}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollableView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#f8f9fb" },
  header:        { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:       { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:   { fontSize: 16, fontWeight: "700", color: BRAND, flex: 1 },
  readBadge:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  readBadgeText: { fontSize: 11, fontWeight: "600", color: "#16a34a" },

  scroll:        { padding: 16, paddingBottom: 40 },

  titleCard:     { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  titleIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  notifTitle:    { fontSize: 15, fontWeight: "700", color: "#111827", marginBottom: 4 },
  notifTime:     { fontSize: 12, color: "#9ca3af" },

  sectionLabel:  { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  card:          { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, marginBottom: 16 },

  messageText:   { fontSize: 14, color: "#374151", lineHeight: 22 },

  detailRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 8 },
  detailKey:     { fontSize: 13, color: "#6b7280", textTransform: "capitalize", flex: 1 },
  detailValue:   { fontSize: 13, fontWeight: "600", color: "#111827", textAlign: "right", flex: 1 },
  rowDivider:    { height: 1, backgroundColor: "#f3f4f6" },

  notFoundWrap:  { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  notFoundText:  { fontSize: 15, color: "#6b7280" },
});
