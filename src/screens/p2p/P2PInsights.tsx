import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { useGetP2PInsightsQuery } from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Insights">;
type Period = "today" | "week" | "month";

const BRAND      = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today",      value: "today" },
  { label: "This Week",  value: "week"  },
  { label: "This Month", value: "month" },
];

export default function P2PInsightsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod]           = useState<Period>("week");
  const [orderTab, setOrderTab]       = useState<"buy" | "sell">("buy");
  const [showPicker, setShowPicker]   = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetP2PInsightsQuery({ period });

  const periodLabel = PERIODS.find((p) => p.value === period)?.label ?? "This Week";
  const chart       = data?.chart;
  const maxVal      = chart ? Math.max(...chart.buy, ...chart.sell, 1) : 1;

  const breakdown = orderTab === "buy"
    ? [
        { label: "Success",        icon: "check-circle",   iconBg: "#E8F5E9", iconColor: "#2E7D32", count: data?.buy_orders.success   ?? 0 },
        { label: "Pending",        icon: "clock-outline",  iconBg: "#FFF8E7", iconColor: "#F5A623", count: data?.buy_orders.pending   ?? 0 },
        { label: "Cancelled",      icon: "cancel",         iconBg: "#F5F5F5", iconColor: "#888",    count: data?.buy_orders.cancelled ?? 0 },
      ]
    : [
        { label: "Success",        icon: "check-circle",   iconBg: "#E8F5E9", iconColor: "#2E7D32", count: data?.sell_orders.success   ?? 0 },
        { label: "Pending",        icon: "clock-outline",  iconBg: "#FFF8E7", iconColor: "#F5A623", count: data?.sell_orders.pending   ?? 0 },
        { label: "Cancelled",      icon: "cancel",         iconBg: "#F5F5F5", iconColor: "#888",    count: data?.sell_orders.cancelled ?? 0 },
      ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableRipple onPress={() => navigation.goBack()} style={styles.backBtn} borderless>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableRipple>
        <Text style={styles.headerText}>Insights</Text>
        <TouchableRipple
          style={styles.periodBtn}
          onPress={() => setShowPicker((v) => !v)}>
          <View style={styles.periodBtnInner}>
            <Text style={styles.periodBtnText}>{periodLabel}</Text>
            <MaterialCommunityIcons
              name={showPicker ? "chevron-up" : "chevron-down"}
              size={16}
              color={BRAND}
            />
          </View>
        </TouchableRipple>
      </View>

      {/* Period dropdown */}
      {showPicker && (
        <View style={styles.periodDropdown}>
          {PERIODS.map((p) => (
            <TouchableRipple
              key={p.value}
              style={styles.periodOption}
              onPress={() => { setPeriod(p.value); setShowPicker(false); }}>
              <View style={styles.periodOptionInner}>
                <Text style={[styles.periodOptionText, p.value === period && styles.periodOptionActive]}>
                  {p.label}
                </Text>
                {p.value === period && (
                  <MaterialCommunityIcons name="check" size={16} color={BRAND} />
                )}
              </View>
            </TouchableRipple>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={styles.loadingText}>Loading insights...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}>

          {/* ── Chart card ── */}
          <View style={styles.chartCard}>
            <View style={styles.chartCardHeader}>
              <View>
                <Text style={styles.chartPeriodLabel}>{periodLabel}</Text>
                <Text style={styles.chartDateRange}>{data?.date_range ?? ""}</Text>
              </View>
              <View style={styles.netVolumeBox}>
                <Text style={styles.netVolumeAmount}>
                  ₦{Number(data?.net_volume ?? 0).toLocaleString()}
                </Text>
                <Text style={styles.netVolumeLabel}>Net Volume</Text>
              </View>
            </View>

            {/* ── Bar chart ── */}
            <View style={styles.chartArea}>
              {chart && chart.labels.length > 0 ? (
                <View style={styles.barsContainer}>
                  {chart.labels.map((label, i) => {
                    const buyH  = chart.buy[i]  > 0 ? Math.max((chart.buy[i]  / maxVal) * 80, 4) : 2;
                    const sellH = chart.sell[i] > 0 ? Math.max((chart.sell[i] / maxVal) * 80, 4) : 2;
                    return (
                      <View key={label} style={styles.barGroup}>
                        <View style={styles.barPair}>
                          <View style={[styles.bar, { height: buyH,  backgroundColor: BRAND }]} />
                          <View style={[styles.bar, { height: sellH, backgroundColor: "#E53935" }]} />
                        </View>
                        <Text style={styles.barLabel}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.chartEmpty}>
                  <Text style={styles.chartEmptyTitle}>No trades yet</Text>
                  <Text style={styles.chartEmptySubtitle}>Start trading to see your chart 🚀</Text>
                </View>
              )}
            </View>

            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: BRAND }]} />
                <Text style={styles.legendText}>Buy</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: "#E53935" }]} />
                <Text style={styles.legendText}>Sell</Text>
              </View>
            </View>
          </View>

          {/* ── Volume cards ── */}
          <View style={styles.volumeRow}>
            <View style={styles.volumeCard}>
              <Text style={styles.volumeLabel}>Buy Volume</Text>
              <Text style={styles.volumeAmount}>
                ₦{Number(data?.buy_volume ?? 0).toLocaleString()}
              </Text>
            </View>
            <View style={styles.volumeCard}>
              <Text style={styles.volumeLabel}>Sell Volume</Text>
              <Text style={styles.volumeAmount}>
                ₦{Number(data?.sell_volume ?? 0).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* ── Total orders card ── */}
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Orders</Text>
            <Text style={styles.totalValue}>{data?.total_orders ?? 0}</Text>
          </View>

          {/* ── Order breakdown tabs ── */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, orderTab === "buy" && styles.tabActive]}
              onPress={() => setOrderTab("buy")}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, orderTab === "buy" && styles.tabTextActive]}>
                Buy Orders
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, orderTab === "sell" && styles.tabActive]}
              onPress={() => setOrderTab("sell")}
              activeOpacity={0.8}>
              <Text style={[styles.tabText, orderTab === "sell" && styles.tabTextActive]}>
                Sell Orders
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Breakdown list ── */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Order Breakdown</Text>
            {breakdown.map((item, index) => (
              <View key={item.label}>
                <View style={styles.breakdownRow}>
                  <View style={[styles.breakdownIconBox, { backgroundColor: item.iconBg }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={item.iconColor} />
                  </View>
                  <View style={styles.breakdownText}>
                    <Text style={styles.breakdownLabel}>{item.label}</Text>
                    <Text style={styles.breakdownCount}>{item.count} orders</Text>
                  </View>
                </View>
                {index < breakdown.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1, backgroundColor: "#F4F6FB" },
  center:           { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:      { fontSize: 14, color: "#888" },
  header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  backBtn:          { padding: 4, borderRadius: 20 },
  headerText:       { fontSize: 16, fontWeight: "800", color: "#111" },
  periodBtn:        { borderWidth: 1, borderColor: "#D0D9EE", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: BRAND_LIGHT },
  periodBtnInner:   { flexDirection: "row", alignItems: "center", gap: 4 },
  periodBtnText:    { fontSize: 13, fontWeight: "600", color: BRAND },
  periodDropdown:   { position: "absolute", top: 60, right: 16, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#E8EEF9", zIndex: 99, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 6, minWidth: 150 },
  periodOption:     { paddingHorizontal: 16, paddingVertical: 12 },
  periodOptionInner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  periodOptionText: { fontSize: 14, color: "#555" },
  periodOptionActive: { color: BRAND, fontWeight: "700" },
  scroll:           { padding: 16, gap: 12 },
  chartCard:        { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E8EEF9" },
  chartCardHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  chartPeriodLabel: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  chartDateRange:   { fontSize: 12, color: "#888" },
  netVolumeBox:     { alignItems: "flex-end" },
  netVolumeAmount:  { fontSize: 18, fontWeight: "800", color: "#2E7D32", marginBottom: 2 },
  netVolumeLabel:   { fontSize: 11, color: "#888" },
  chartArea:        { height: 110, backgroundColor: "#F8FAFF", borderRadius: 10, justifyContent: "flex-end", marginBottom: 8, overflow: "hidden", paddingHorizontal: 8, paddingBottom: 4 },
  barsContainer:    { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: "100%", paddingBottom: 16 },
  barGroup:         { alignItems: "center", gap: 4 },
  barPair:          { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar:              { width: 6, borderRadius: 3 },
  barLabel:         { fontSize: 9, color: "#BBB" },
  chartEmpty:       { alignItems: "center", justifyContent: "center", flex: 1 },
  chartEmptyTitle:  { fontSize: 14, fontWeight: "700", color: "#888", marginBottom: 4 },
  chartEmptySubtitle: { fontSize: 12, color: "#AAA" },
  legend:           { flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 4 },
  legendItem:       { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:        { width: 8, height: 8, borderRadius: 4 },
  legendText:       { fontSize: 12, color: "#888" },
  volumeRow:        { flexDirection: "row", gap: 12 },
  volumeCard:       { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E8EEF9" },
  volumeLabel:      { fontSize: 12, color: "#888", marginBottom: 6 },
  volumeAmount:     { fontSize: 20, fontWeight: "800", color: "#111" },
  totalCard:        { backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#E8EEF9", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel:       { fontSize: 13, color: "#888" },
  totalValue:       { fontSize: 20, fontWeight: "800", color: "#111" },
  tabRow:           { flexDirection: "row", backgroundColor: "#E8EEF9", borderRadius: 30, padding: 4 },
  tab:              { flex: 1, paddingVertical: 9, borderRadius: 26, alignItems: "center" },
  tabActive:        { backgroundColor: "#fff" },
  tabText:          { fontSize: 14, fontWeight: "600", color: "#888" },
  tabTextActive:    { color: "#111", fontWeight: "700" },
  breakdownCard:    { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E8EEF9" },
  breakdownTitle:   { fontSize: 14, fontWeight: "800", color: "#111", marginBottom: 12 },
  breakdownRow:     { flexDirection: "row", alignItems: "center", paddingVertical: 10, gap: 12 },
  breakdownIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  breakdownText:    { flex: 1 },
  breakdownLabel:   { fontSize: 14, fontWeight: "600", color: "#111", marginBottom: 2 },
  breakdownCount:   { fontSize: 12, color: "#888" },
  divider:          { height: 1, backgroundColor: "#F0F4FB" },
});
