import React, { useState } from "react";
import { View, FlatList, Image, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRoute, useNavigation } from "@react-navigation/native";
import { useGetReferralLeaderboardQuery } from "@store/redux-api/referralQueryApi";
import { ReferralLeaderboardItem } from "@type/user";
import { AccountStackScreenProps } from "@navigators/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

const FILTERS: ("weekly" | "monthly" | "alltime")[] = ["weekly", "monthly", "alltime"];
const FILTER_LABELS = { weekly: "Weekly", monthly: "Monthly", alltime: "All-Time" };

const MEDAL_COLORS = ["#F59E0B", "#9CA3AF", "#D97706"];
const MEDAL_ICONS  = ["trophy", "medal", "medal-outline"];

export default function LeaderboardScreen() {
  const route      = useRoute<AccountStackScreenProps<"Leaderboard">["route"]>();
  const navigation = useNavigation();
  const insets     = useSafeAreaInsets();

  const [activeFilter, setActiveFilter] = useState<"weekly" | "monthly" | "alltime">(
    route.params?.filter ?? "alltime"
  );

  const { data, isFetching } = useGetReferralLeaderboardQuery({ limit: 20, filter: activeFilter });

  return (
    <View style={s.root}>
      {/* Header */}
        <ScreenHeader
          title="Leaderboard"
          subtitle="Top referrers on BinaPay"
          onBack={() => navigation.goBack()} 
        />

      {/* Filter tabs */}
      <View style={s.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[s.filterTab, activeFilter === f && s.filterTabActive]}
            onPress={() => setActiveFilter(f)}
            activeOpacity={0.8}
          >
            <Text style={[s.filterTabText, activeFilter === f && s.filterTabTextActive]}>
              {FILTER_LABELS[f]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isFetching ? (
        <View style={s.loadingWrap}>
          <ActivityIndicator size="large" color={BLUE} />
          <Text style={s.loadingText}>Loading leaderboard...</Text>
        </View>
      ) : !data || data.length === 0 ? (
        <View style={s.emptyWrap}>
          <MaterialCommunityIcons name="trophy-outline" size={56} color="#d1d5db" />
          <Text style={s.emptyTitle}>No data yet</Text>
          <Text style={s.emptySub}>Be the first to top the leaderboard!</Text>
        </View>
      ) : (
        <FlatList<ReferralLeaderboardItem>
          data={data}
          keyExtractor={(item) => item.referrer_id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const isTop3    = index < 3;
            const medalColor = MEDAL_COLORS[index] ?? "#e5e7eb";

            return (
              <View style={[s.row, isTop3 && s.rowTop3]}>
                {/* Rank */}
                <View style={[s.rankWrap, { backgroundColor: isTop3 ? medalColor : "#f3f4f6" }]}>
                  {isTop3 ? (
                    <MaterialCommunityIcons name={MEDAL_ICONS[index] as any} size={16} color="#fff" />
                  ) : (
                    <Text style={s.rankText}>{index + 1}</Text>
                  )}
                </View>

                {/* Avatar */}
                <Image
                  source={{ uri: `/storage/${item.referrer.avatar}` }}
                  style={s.avatar}
                  defaultSource={require("@assets/draft/male-avatar-circle.png")}
                />

                {/* Name + volume */}
                <View style={s.info}>
                  <Text style={s.name} numberOfLines={1}>{item.referrer.name}</Text>
                  <Text style={s.volume}>Vol: ₦{item.total_volume.toLocaleString()}</Text>
                </View>

                {/* Earned */}
                <View style={[s.earnedBadge, isTop3 && { backgroundColor: "#dcfce7" }]}>
                  <Text style={[s.earnedText, isTop3 && { color: "#16a34a" }]}>
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

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#f8f9fb" },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:          { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:      { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:        { fontSize: 11, color: "#6b7280", marginTop: 1 },

  filterRow:        { flexDirection: "row", marginHorizontal: 16, marginVertical: 12, backgroundColor: "#f3f4f6", borderRadius: 10, padding: 3, gap: 2 },
  filterTab:        { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  filterTabActive:  { backgroundColor: "#fff", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 },
  filterTabText:    { fontSize: 13, fontWeight: "500", color: "#6b7280" },
  filterTabTextActive: { color: BRAND, fontWeight: "700" },

  loadingWrap:      { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:      { fontSize: 14, color: "#6b7280" },

  emptyWrap:        { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  emptyTitle:       { fontSize: 16, fontWeight: "700", color: "#374151" },
  emptySub:         { fontSize: 13, color: "#9ca3af" },

  list:             { padding: 16, paddingBottom: 40, gap: 8 },

  row:              { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 14, padding: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  rowTop3:          { borderColor: "#e5e7eb", backgroundColor: "#fffbf0" },

  rankWrap:         { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  rankText:         { fontSize: 13, fontWeight: "700", color: "#6b7280" },

  avatar:           { width: 38, height: 38, borderRadius: 19, backgroundColor: "#e5e7eb" },

  info:             { flex: 1 },
  name:             { fontSize: 13, fontWeight: "600", color: "#111827" },
  volume:           { fontSize: 11, color: "#6b7280", marginTop: 1 },

  earnedBadge:      { backgroundColor: "#f3f4f6", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  earnedText:       { fontSize: 12, fontWeight: "700", color: "#374151" },
});
