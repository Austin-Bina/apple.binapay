import { AvatarImage } from "@components/avatar";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { useGetReferralRewardsQuery } from "@store/redux-api/referralQueryApi";
import { selectUser } from "@store/selectors/auth";
import { formatToNaira } from "@utils/money";
import React, { useMemo } from "react";
import { RefreshControl, View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
import DefaultAvatar from "@assets/draft/male-avatar-circle.png";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

type Props = AccountStackScreenProps<"Earning Summary">;

export default function EarningSummaryScreen({}: Props) {
  const user       = useTypedSelector(selectUser);
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<Props["navigation"]>();

  const { data: queryData, error, isFetching, refetch } = useGetReferralRewardsQuery({ page: 1, per_page: 10 });

  const summary = useMemo(() => {
    if (!queryData) return { data: [], meta: { has_more: false, total_earnings: 0, total_volume: 0 } };
    return queryData;
  }, [queryData]);

  return (
    <View style={s.root}>
      {/* Header */}
         <ScreenHeader
          title="Earnings Overview"
          subtitle="Your referral earnings at a glance"
          onBack={() => navigation.goBack()}
          rightIcon="shield-check-outline"       
        />

      <ScrollableView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {/* Stats cards */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { flex: 1 }]}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={BLUE} style={{ marginBottom: 6 }} />
            <Text style={s.statValue}>{formatToNaira(summary.meta.total_earnings)}</Text>
            <Text style={s.statLabel}>Total Earnings</Text>
          </View>
          <View style={[s.statCard, { flex: 1 }]}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#7c3aed" style={{ marginBottom: 6 }} />
            <Text style={[s.statValue, { color: "#7c3aed" }]}>{formatToNaira(summary.meta.total_volume)}</Text>
            <Text style={s.statLabel}>Trading Volume</Text>
          </View>
        </View>

        {/* Leaderboard button */}
        <TouchableOpacity
          style={s.leaderboardBtn}
          onPress={() => navigation.navigate("Leaderboard", { filter: "weekly" })}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="trophy-outline" size={18} color="#fff" />
          <Text style={s.leaderboardBtnText}>View Leaderboard</Text>
        </TouchableOpacity>

        {/* Referral code */}
        {user?.affiliate_id && (
          <View style={{ marginBottom: 20 }}>
            <CopyReferralCode referralCode={user.affiliate_id} />
          </View>
        )}

        {/* Error */}
        {!!error && !isFetching && (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={s.errorText}>Couldn't fetch earnings. Pull down to refresh.</Text>
          </View>
        )}

        {/* Section title */}
        <Text style={s.sectionTitle}>Earnings Summary</Text>

        {/* Empty state */}
        {summary.data.length === 0 && !isFetching && (
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#d1d5db" />
            <Text style={s.emptyTitle}>No earnings yet</Text>
            <Text style={s.emptySub}>Invite friends to start earning rewards.</Text>
          </View>
        )}

        {/* Referee list */}
        <View style={s.card}>
          {summary.data.map((item, index) => (
            <View key={item.id}>
              <View style={s.refereeRow}>
                <AvatarImage avatar={item.referee?.avatar ?? DefaultAvatar} size={40} />
                <View style={s.refereeInfo}>
                  <Text style={s.refereeName} numberOfLines={1}>{item.referee?.name ?? "Unknown User"}</Text>
                  <Text style={s.refereeVolume}>Vol: {formatToNaira(item.total_trading_volume)}</Text>
                </View>
                <View style={s.rewardBadge}>
                  <Text style={s.rewardBadgeText}>{formatToNaira(item.total_reward_earned)}</Text>
                </View>
              </View>
              {index < summary.data.length - 1 && <View style={s.rowDivider} />}
            </View>
          ))}
        </View>
      </ScrollableView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#f8f9fb" },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:          { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:      { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:        { fontSize: 11, color: "#6b7280", marginTop: 1 },
  scroll:           { padding: 16, paddingBottom: 40 },

  statsRow:         { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard:         { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, alignItems: "center" },
  statValue:        { fontSize: 16, fontWeight: "800", color: BRAND, marginBottom: 2 },
  statLabel:        { fontSize: 11, color: "#6b7280", textAlign: "center" },

  leaderboardBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 12, paddingVertical: 13, marginBottom: 16 },
  leaderboardBtnText:{ color: "#fff", fontSize: 14, fontWeight: "700" },

  errorCard:        { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText:        { fontSize: 13, color: "#DC2626", flex: 1 },

  sectionTitle:     { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  emptyWrap:        { alignItems: "center", paddingVertical: 32, gap: 6 },
  emptyTitle:       { fontSize: 15, fontWeight: "700", color: "#374151" },
  emptySub:         { fontSize: 13, color: "#9ca3af", textAlign: "center" },

  card:             { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  refereeRow:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  refereeInfo:      { flex: 1 },
  refereeName:      { fontSize: 13, fontWeight: "600", color: "#111827" },
  refereeVolume:    { fontSize: 11, color: "#6b7280", marginTop: 1 },
  rewardBadge:      { backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rewardBadgeText:  { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  rowDivider:       { height: 1, backgroundColor: "#f3f4f6", marginLeft: 62 },
});
