import React, { useState } from "react";
import { View, FlatList, Image, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useGetReferralLeaderboardQuery } from "@store/redux-api/referralQueryApi";
import { ReferralLeaderboardItem } from "@type/user";
import { AccountStackScreenProps } from "@navigators/types";
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

const FILTERS: ("weekly" | "monthly" | "alltime")[] = ["weekly", "monthly", "alltime"];
const FILTER_LABELS = { weekly: "Weekly", monthly: "Monthly", alltime: "All-Time" };
const MEDAL_COLORS  = ["#F59E0B", "#9CA3AF", "#D97706"];
const MEDAL_ICONS   = ["trophy", "medal", "medal-outline"];

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

export default function LeaderboardScreen() {
  const route      = useRoute<AccountStackScreenProps<"Leaderboard">["route"]>();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  // ── All original state + logic — untouched ────────────────────────────────
  const [activeFilter, setActiveFilter] = useState<"weekly" | "monthly" | "alltime">(route.params?.filter ?? "alltime");
  const { data, isFetching } = useGetReferralLeaderboardQuery({ limit: 20, filter: activeFilter });

  return (
    <View style={[lb.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={lb.navBar}>
        <TouchableOpacity style={lb.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={lb.navCenter}>
          <Text style={lb.navTitle}>Leaderboard</Text>
          <Text style={lb.navSub}>Top referrers on BinaPay</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Filter tabs */}
      <View style={lb.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} style={[lb.filterTab, activeFilter === f && lb.filterTabActive]}
            onPress={() => setActiveFilter(f)} activeOpacity={0.8}>
            <Text style={[lb.filterTabText, activeFilter === f && lb.filterTabTextActive]}>{FILTER_LABELS[f]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {isFetching ? (
        <View style={lb.centerWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={lb.loadingText}>Loading leaderboard…</Text>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={lb.centerWrap}>
          <MaterialCommunityIcons name="trophy-outline" size={56} color="#D1D5DB" />
          <Text style={lb.emptyTitle}>No data yet</Text>
          <Text style={lb.emptySub}>Be the first to top the leaderboard!</Text>
        </View>
      ) : (
        <FlatList<ReferralLeaderboardItem>
          data={data}
          keyExtractor={item => item.referrer_id}
          contentContainerStyle={lb.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isTop3     = index < 3;
            const medalColor = MEDAL_COLORS[index] ?? SEPARATOR;
            return (
              <View style={[lb.row, isTop3 && lb.rowTop3, IOS_SHADOW]}>
                <View style={[lb.rankWrap, { backgroundColor: isTop3 ? medalColor : BG }]}>
                  {isTop3
                    ? <MaterialCommunityIcons name={MEDAL_ICONS[index] as any} size={16} color="#fff" />
                    : <Text style={lb.rankText}>{index + 1}</Text>}
                </View>
                <Image
                  source={{ uri: `/storage/${item.referrer.avatar}` }}
                  style={lb.avatar}
                  defaultSource={require("@assets/draft/male-avatar-circle.png")}
                />
                <View style={{ flex: 1 }}>
                  <Text style={lb.name} numberOfLines={1}>{item.referrer.name}</Text>
                  <Text style={lb.volume}>Vol: ₦{item.total_volume.toLocaleString()}</Text>
                </View>
                <View style={[lb.earnedBadge, isTop3 && { backgroundColor: "#DCFCE7" }]}>
                  <Text style={[lb.earnedText, isTop3 && { color: "#16A34A" }]}>
                    ₦{item.total_earned.toLocaleString()}
                  </Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const lb = StyleSheet.create({
  root:              { flex: 1, backgroundColor: BG },
  navBar:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:         { flex: 1, alignItems: "center" },
  navTitle:          { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:            { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  filterRow:         { flexDirection: "row", marginHorizontal: 16, marginVertical: 12, backgroundColor: SEPARATOR, borderRadius: 12, padding: 3, gap: 2 },
  filterTab:         { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center" },
  filterTabActive:   { backgroundColor: SURFACE, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4 } }) },
  filterTabText:     { fontSize: 13, fontWeight: "500", color: SUBLABEL },
  filterTabTextActive: { color: BRAND, fontWeight: "700" },
  centerWrap:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:       { fontSize: 14, color: SUBLABEL },
  emptyTitle:        { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub:          { fontSize: 13, color: "#9CA3AF" },
  list:              { paddingHorizontal: 16, paddingBottom: 40, gap: 8 },
  row:               { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: SURFACE, borderRadius: 14, padding: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  rowTop3:           { borderColor: "#FDE68A", backgroundColor: "#FFFBF0" },
  rankWrap:          { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  rankText:          { fontSize: 13, fontWeight: "700", color: SUBLABEL },
  avatar:            { width: 38, height: 38, borderRadius: 19, backgroundColor: SEPARATOR },
  name:              { fontSize: 13, fontWeight: "600", color: LABEL },
  volume:            { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  earnedBadge:       { backgroundColor: BG, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  earnedText:        { fontSize: 12, fontWeight: "700", color: "#374151" },
});
