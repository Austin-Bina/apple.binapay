import { SupportHead } from "@components/icons/svg";
import { ActionWithDescription, SupportAction } from "@components/screens/account";
import Banner from "@components/ui/banner";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { SupportStackScreenProps } from "@navigators/types";
import {
  useGetSupportDepartmentsQuery,
  useGetSupportHistoryQuery,
  useSupportPrefetch,
} from "@store/redux-api/supportApi";
import { formatSecondsToDate } from "@utils/index";
import { Fragment, useEffect, useState } from "react";
import { RefreshControl, View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { ProgressBar, Text } from "react-native-paper";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type Props = SupportStackScreenProps<typeof SCREENS.SUPPORT_DEPARTMENT>;

export default function SupportDepartment({ navigation, route }: Props) {
  const [isSupportIdError, setIsSupportIdError]       = useState(false);
  const [storedInitialMessage, setStoredInitialMessage] = useState<string>("");
  const insets = useSafeAreaInsets();

  const user = useTypedSelector(selectUser);
  const { data: queryData, isFetching, isError } = useGetSupportDepartmentsQuery();
  const {
    data: historyQuery,
    error,
    isError: isHistoryError,
    isFetching: isHistoryFetching,
  } = useGetSupportHistoryQuery(undefined, {
    refetchOnMountOrArgChange: true,
    pollingInterval: 10000,
    skip: !user,
  });

  const prefetchDepartments = useSupportPrefetch("getSupportDepartments", { force: true });
  const prefetchHistory     = useSupportPrefetch("getSupportHistory", { force: true });

  useEffect(() => {
    const checkStoredMessage = async () => {
      try {
        const message = await AsyncStorage.getItem("SUPPORT_INITIAL_MESSAGE");
        if (message) {
          setStoredInitialMessage(message);
          await AsyncStorage.removeItem("SUPPORT_INITIAL_MESSAGE");
        }
      } catch (err) {
        console.error("Error retrieving support message:", err);
      }
    };
    checkStoredMessage();
  }, []);

  useEffect(() => {
    if (isSupportIdError) return;
    const err = error as any;
    const errorMessage = err?.data?.message || ("" as string | undefined);
    if (errorMessage?.includes("Support initialization required.")) {
      setIsSupportIdError(true);
    }
  }, [error]);

  const departments = queryData?.departments ?? [];
  const history     = historyQuery?.data.tickets.slice(0, 5) ?? [];

  const handleNavigate = (departmentId: string) => {
    const initialMessage = storedInitialMessage || route.params?.initialMessage;
    navigation.navigate(SCREENS.SUPPORT_START_CONVERSATION, { departmentId, initialMessage });
  };

  const handleNavigateHistory = (args: { departmentId: string; ticketId: string }) => {
    navigation.navigate(SCREENS.SUPPORT_CHAT, { ...args });
  };

  const handleRefresh = () => {
    prefetchDepartments();
    prefetchHistory();
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerIconWrap}>
          <MaterialCommunityIcons name="headset" size={20} color={BLUE} />
        </View>
        <View>
          <Text style={s.headerTitle}>Help & Support</Text>
          <Text style={s.headerSub}>We're available 24/7 to assist you</Text>
        </View>
      </View>

      <ScrollableView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={false} onRefresh={handleRefresh} />}
      >
        {!!isError && (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#DC2626" />
            <Text style={s.errorText}>Couldn't load departments. Pull down to refresh.</Text>
          </View>
        )}

        {/* Departments */}
        <Text style={s.sectionTitle}>Select Department</Text>
        <View style={s.card}>
          {departments.map((department, index) => (
            <Fragment key={department.id}>
              <TouchableOpacity
                style={s.departmentRow}
                onPress={() => handleNavigate(department.id)}
                activeOpacity={0.7}
              >
                <View style={s.departmentIconWrap}>
                  <MaterialCommunityIcons name="message-text-outline" size={18} color={BLUE} />
                </View>
                <Text style={s.departmentName}>{department.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#9ca3af" />
              </TouchableOpacity>
              {index !== departments.length - 1 && <View style={s.rowDivider} />}
            </Fragment>
          ))}
        </View>

        {/* Recent issues */}
        <View style={s.recentHeader}>
          <Text style={s.sectionTitle}>Recent Issues</Text>
          <TouchableOpacity onPress={() => navigation.navigate(SCREENS.SUPPORT_HISTORY)}>
            <Text style={s.seeAllText}>See All</Text>
          </TouchableOpacity>
        </View>

        <View style={s.card}>
          {isHistoryFetching && <ProgressBar indeterminate color={BLUE} style={{ borderRadius: 4 }} />}

          {(history.length === 0 || isHistoryError) && !isHistoryFetching && (
            <View style={s.emptyWrap}>
              <MaterialCommunityIcons name="inbox-outline" size={36} color="#d1d5db" />
              <Text style={s.emptyText}>No recent issues</Text>
            </View>
          )}

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
                  <Text style={s.repliesBadgeText}>{ticket.replies}</Text>
                </View>
              </TouchableOpacity>
              {index !== history.length - 1 && <View style={s.rowDivider} />}
            </Fragment>
          ))}
        </View>
      </ScrollableView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#f8f9fb" },
  header:            { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  headerIconWrap:    { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:       { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:         { fontSize: 11, color: "#6b7280", marginTop: 1 },

  scroll:            { padding: 16, paddingBottom: 40 },

  errorCard:         { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText:         { fontSize: 13, color: "#DC2626", flex: 1 },

  sectionTitle:      { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  recentHeader:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8, marginTop: 8 },
  seeAllText:        { fontSize: 13, fontWeight: "600", color: BLUE },

  card:              { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden", marginBottom: 12 },
  rowDivider:        { height: 1, backgroundColor: "#f3f4f6", marginLeft: 54 },

  departmentRow:     { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  departmentIconWrap:{ width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  departmentName:    { flex: 1, fontSize: 14, fontWeight: "500", color: "#111827" },

  ticketRow:         { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  ticketIconWrap:    { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  ticketInfo:        { flex: 1 },
  ticketSubject:     { fontSize: 13, fontWeight: "600", color: "#111827" },
  ticketMeta:        { fontSize: 11, color: "#6b7280", marginTop: 2 },
  repliesBadge:      { backgroundColor: "#EEF3FF", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  repliesBadgeText:  { fontSize: 11, fontWeight: "700", color: BLUE },

  emptyWrap:         { alignItems: "center", paddingVertical: 24, gap: 6 },
  emptyText:         { fontSize: 13, color: "#9ca3af" },
});
