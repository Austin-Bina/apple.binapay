// ═══════════════════════════════════════════════════════════════════════════
// EarningSummaryScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
import React, { useMemo } from "react";
import { RefreshControl, View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Text } from "react-native-paper";
import { AvatarImage } from "@components/avatar";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { useGetReferralRewardsQuery } from "@store/redux-api/referralQueryApi";
import { selectUser } from "@store/selectors/auth";
import { formatToNaira } from "@utils/money";
import DefaultAvatar from "@assets/draft/male-avatar-circle.png";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

type ESProps = AccountStackScreenProps<"Earning Summary">;

export default function EarningSummaryScreen({}: ESProps) {
  const user       = useTypedSelector(selectUser);
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<ESProps["navigation"]>();

  const { data: queryData, error, isFetching, refetch } = useGetReferralRewardsQuery({ page: 1, per_page: 10 });
  const summary = useMemo(() => {
    if (!queryData) return { data: [], meta: { has_more: false, total_earnings: 0, total_volume: 0 } };
    return queryData;
  }, [queryData]);

  return (
    <View style={[es.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={es.navBar}>
        <TouchableOpacity style={es.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={es.navCenter}>
          <Text style={es.navTitle}>Earnings Overview</Text>
          <Text style={es.navSub}>Your referral earnings at a glance</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollableView
        contentContainerStyle={es.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={BLUE} />}
      >
        {/* Stats */}
        <View style={es.statsRow}>
          <View style={[es.statCard, IOS_SHADOW]}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={BLUE} style={{ marginBottom: 6 }} />
            <Text style={es.statValue}>{formatToNaira(summary.meta.total_earnings)}</Text>
            <Text style={es.statLabel}>Total Earnings</Text>
          </View>
          <View style={[es.statCard, IOS_SHADOW]}>
            <MaterialCommunityIcons name="chart-line" size={20} color="#7C3AED" style={{ marginBottom: 6 }} />
            <Text style={[es.statValue, { color: "#7C3AED" }]}>{formatToNaira(summary.meta.total_volume)}</Text>
            <Text style={es.statLabel}>Trading Volume</Text>
          </View>
        </View>

        <TouchableOpacity style={es.leaderboardBtn} onPress={() => navigation.navigate("Leaderboard", { filter: "weekly" })} activeOpacity={0.85}>
          <MaterialCommunityIcons name="trophy-outline" size={18} color="#fff" />
          <Text style={es.leaderboardBtnText}>View Leaderboard</Text>
        </TouchableOpacity>

        {user?.affiliate_id && (
          <View style={{ marginBottom: 20 }}>
            <CopyReferralCode referralCode={user.affiliate_id} />
          </View>
        )}

        {!!error && !isFetching && (
          <View style={es.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={es.errorText}>Couldn't fetch earnings. Pull down to refresh.</Text>
          </View>
        )}

        <Text style={es.sectionLabel}>Earnings Summary</Text>

        {summary.data.length === 0 && !isFetching && (
          <View style={es.emptyWrap}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#D1D5DB" />
            <Text style={es.emptyTitle}>No earnings yet</Text>
            <Text style={es.emptySub}>Invite friends to start earning rewards.</Text>
          </View>
        )}

        <View style={[es.card, IOS_SHADOW]}>
          {summary.data.map((item, index) => (
            <View key={item.id}>
              <View style={es.refereeRow}>
                <AvatarImage avatar={item.referee?.avatar ?? DefaultAvatar} size={40} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={es.refereeName} numberOfLines={1}>{item.referee?.name ?? "Unknown User"}</Text>
                  <Text style={es.refereeVolume}>Vol: {formatToNaira(item.total_trading_volume)}</Text>
                </View>
                <View style={es.rewardBadge}>
                  <Text style={es.rewardBadgeText}>{formatToNaira(item.total_reward_earned)}</Text>
                </View>
              </View>
              {index < summary.data.length - 1 && <View style={es.hairline} />}
            </View>
          ))}
        </View>
      </ScrollableView>
    </View>
  );
}

const es = StyleSheet.create({
  root:              { flex: 1, backgroundColor: BG },
  navBar:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:         { flex: 1, alignItems: "center" },
  navTitle:          { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:            { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:            { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  statsRow:          { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard:          { flex: 1, backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, padding: 14, alignItems: "center" },
  statValue:         { fontSize: 16, fontWeight: "800", color: BRAND, marginBottom: 2 },
  statLabel:         { fontSize: 11, color: SUBLABEL, textAlign: "center" },
  leaderboardBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 13, marginBottom: 16 },
  leaderboardBtnText:{ color: "#fff", fontSize: 14, fontWeight: "700" },
  errorCard:         { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FECACA" },
  errorText:         { fontSize: 13, color: "#DC2626", flex: 1 },
  sectionLabel:      { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, marginLeft: 4 },
  emptyWrap:         { alignItems: "center", paddingVertical: 32, gap: 6 },
  emptyTitle:        { fontSize: 15, fontWeight: "700", color: "#374151" },
  emptySub:          { fontSize: 13, color: "#9CA3AF", textAlign: "center" },
  card:              { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, overflow: "hidden" },
  hairline:          { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 62 },
  refereeRow:        { flexDirection: "row", alignItems: "center", padding: 14 },
  refereeName:       { fontSize: 13, fontWeight: "600", color: LABEL },
  refereeVolume:     { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  rewardBadge:       { backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rewardBadgeText:   { fontSize: 12, fontWeight: "700", color: "#16A34A" },
});
