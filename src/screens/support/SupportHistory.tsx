import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { SupportStackScreenProps } from "@navigators/types";
import { useGetSupportHistoryQuery } from "@store/redux-api/supportApi";
import { formatSecondsToDate } from "@utils/index";
import { Fragment } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type Props = SupportStackScreenProps<typeof SCREENS.SUPPORT_HISTORY>;

export default function SupportHistory({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: historyQuery, isError: isHistoryError } = useGetSupportHistoryQuery();
  const history = historyQuery?.data.tickets ?? [];

  const handleNavigateHistory = (args: { departmentId: string; ticketId: string }) => {
    navigation.navigate(SCREENS.SUPPORT_CHAT, { ...args });
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Support History</Text>
          <Text style={s.headerSub}>All your previous support tickets</Text>
        </View>
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>
        {isHistoryError && (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={s.errorText}>Couldn't load support history. Pull down to refresh.</Text>
          </View>
        )}

        {history.length === 0 && !isHistoryError && (
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="inbox-outline" size={56} color="#d1d5db" />
            <Text style={s.emptyTitle}>No tickets yet</Text>
            <Text style={s.emptySub}>Your support history will appear here.</Text>
          </View>
        )}

        {history.length > 0 && (
          <View style={s.card}>
            {history.map((ticket, index) => (
              <Fragment key={ticket.id}>
                <TouchableOpacity
                  style={s.ticketRow}
                  onPress={() => handleNavigateHistory({ ticketId: ticket.id, departmentId: ticket.department_id })}
                  activeOpacity={0.7}
                >
                  <View style={s.ticketIconWrap}>
                    <MaterialCommunityIcons name="ticket-outline" size={18} color={BLUE} />
                  </View>
                  <View style={s.ticketInfo}>
                    <Text style={s.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                    <Text style={s.ticketMeta}>
                      {formatSecondsToDate(ticket.last_update)} · {ticket.department_name}
                    </Text>
                  </View>
                  <View style={s.repliesBadge}>
                    <Text style={s.repliesBadgeText}>{ticket.replies} replies</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={16} color="#9ca3af" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
                {index !== history.length - 1 && <View style={s.rowDivider} />}
              </Fragment>
            ))}
          </View>
        )}
      </ScrollableView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  header:          { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:         { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:     { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:       { fontSize: 11, color: "#6b7280", marginTop: 1 },

  scroll:          { padding: 16, paddingBottom: 40 },

  errorCard:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText:       { fontSize: 13, color: "#DC2626", flex: 1 },

  emptyWrap:       { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 8 },
  emptyTitle:      { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub:        { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  card:            { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  rowDivider:      { height: 1, backgroundColor: "#f3f4f6", marginLeft: 54 },

  ticketRow:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  ticketIconWrap:  { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  ticketInfo:      { flex: 1 },
  ticketSubject:   { fontSize: 13, fontWeight: "600", color: "#111827" },
  ticketMeta:      { fontSize: 11, color: "#6b7280", marginTop: 2 },
  repliesBadge:    { backgroundColor: "#EEF3FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  repliesBadgeText:{ fontSize: 11, fontWeight: "700", color: BLUE },
});
