import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, StatusBar } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { useGetP2PInsightsQuery } from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Insights">;
type Period = "today" | "week" | "month";

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const IOS_CARD = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

const PERIODS: { label: string; value: Period }[] = [
  { label: "Today", value: "today" }, { label: "This Week", value: "week" }, { label: "This Month", value: "month" },
];

export default function P2PInsightsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [period, setPeriod]           = useState<Period>("week");
  const [orderTab, setOrderTab]       = useState<"buy" | "sell">("buy");
  const [showPicker, setShowPicker]   = useState(false);

  // ── All original hooks + derived — untouched ──────────────────────────────
  const { data, isLoading } = useGetP2PInsightsQuery({ period });
  const periodLabel = PERIODS.find(p => p.value === period)?.label ?? "This Week";
  const chart       = data?.chart;
  const maxVal      = chart ? Math.max(...chart.buy, ...chart.sell, 1) : 1;

  const breakdown = orderTab === "buy"
    ? [
        { label: "Success",   icon: "check-circle",  iconBg: "#F0FDF4", iconColor: "#16A34A", count: data?.buy_orders.success   ?? 0 },
        { label: "Pending",   icon: "clock-outline", iconBg: "#FFFBEB", iconColor: "#D97706", count: data?.buy_orders.pending   ?? 0 },
        { label: "Cancelled", icon: "cancel",        iconBg: BG,        iconColor: SUBLABEL,  count: data?.buy_orders.cancelled ?? 0 },
      ]
    : [
        { label: "Success",   icon: "check-circle",  iconBg: "#F0FDF4", iconColor: "#16A34A", count: data?.sell_orders.success   ?? 0 },
        { label: "Pending",   icon: "clock-outline", iconBg: "#FFFBEB", iconColor: "#D97706", count: data?.sell_orders.pending   ?? 0 },
        { label: "Cancelled", icon: "cancel",        iconBg: BG,        iconColor: SUBLABEL,  count: data?.sell_orders.cancelled ?? 0 },
      ];

  return (
    <View style={[ins.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={ins.navBar}>
        <TouchableOpacity style={ins.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND_DARK} />
        </TouchableOpacity>
        <Text style={ins.navTitle}>Insights</Text>
        <TouchableOpacity
          style={ins.periodBtn}
          onPress={() => setShowPicker(v => !v)}
          activeOpacity={0.8}>
          <Text style={ins.periodBtnText}>{periodLabel}</Text>
          <MaterialCommunityIcons name={showPicker ? "chevron-up" : "chevron-down"} size={14} color={BRAND} />
        </TouchableOpacity>
      </View>

      {/* Period dropdown */}
      {showPicker && (
        <View style={[ins.periodDropdown, IOS_CARD]}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p.value} style={ins.periodOption} activeOpacity={0.7}
              onPress={() => { setPeriod(p.value); setShowPicker(false); }}>
              <Text style={[ins.periodOptionText, p.value === period && ins.periodOptionActive]}>{p.label}</Text>
              {p.value === period && <MaterialCommunityIcons name="checkmark" size={16} color={BRAND} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading ? (
        <View style={ins.center}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={ins.centerText}>Loading insights…</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={ins.scroll} showsVerticalScrollIndicator={false}>
          {/* Chart card */}
          <View style={[ins.chartCard, IOS_CARD]}>
            <View style={ins.chartCardHeader}>
              <View>
                <Text style={ins.chartPeriodLabel}>{periodLabel}</Text>
                <Text style={ins.chartDateRange}>{data?.date_range ?? ""}</Text>
              </View>
              <View style={ins.netVolumeBox}>
                <Text style={ins.netVolumeAmount}>₦{Number(data?.net_volume ?? 0).toLocaleString()}</Text>
                <Text style={ins.netVolumeLabel}>Net Volume</Text>
              </View>
            </View>
            <View style={ins.chartArea}>
              {chart && chart.labels.length > 0 ? (
                <View style={ins.barsContainer}>
                  {chart.labels.map((label, i) => {
                    const buyH  = chart.buy[i]  > 0 ? Math.max((chart.buy[i]  / maxVal) * 80, 4) : 2;
                    const sellH = chart.sell[i] > 0 ? Math.max((chart.sell[i] / maxVal) * 80, 4) : 2;
                    return (
                      <View key={label} style={ins.barGroup}>
                        <View style={ins.barPair}>
                          <View style={[ins.bar, { height: buyH, backgroundColor: BRAND }]} />
                          <View style={[ins.bar, { height: sellH, backgroundColor: "#DC2626" }]} />
                        </View>
                        <Text style={ins.barLabel}>{label}</Text>
                      </View>
                    );
                  })}
                </View>
              ) : (
                <View style={ins.chartEmpty}>
                  <Text style={ins.chartEmptyTitle}>No trades yet</Text>
                  <Text style={ins.chartEmptySub}>Start trading to see your chart 🚀</Text>
                </View>
              )}
            </View>
            <View style={ins.legend}>
              <View style={ins.legendItem}><View style={[ins.legendDot, { backgroundColor: BRAND }]} /><Text style={ins.legendText}>Buy</Text></View>
              <View style={ins.legendItem}><View style={[ins.legendDot, { backgroundColor: "#DC2626" }]} /><Text style={ins.legendText}>Sell</Text></View>
            </View>
          </View>

          {/* Volume cards */}
          <View style={ins.volumeRow}>
            <View style={[ins.volumeCard, IOS_CARD]}>
              <Text style={ins.volumeLabel}>Buy Volume</Text>
              <Text style={ins.volumeAmount}>₦{Number(data?.buy_volume ?? 0).toLocaleString()}</Text>
            </View>
            <View style={[ins.volumeCard, IOS_CARD]}>
              <Text style={ins.volumeLabel}>Sell Volume</Text>
              <Text style={ins.volumeAmount}>₦{Number(data?.sell_volume ?? 0).toLocaleString()}</Text>
            </View>
          </View>

          <View style={[ins.totalCard, IOS_CARD]}>
            <Text style={ins.totalLabel}>Total Orders</Text>
            <Text style={ins.totalValue}>{data?.total_orders ?? 0}</Text>
          </View>

          {/* Breakdown tabs */}
          <View style={ins.tabRow}>
            {(["buy", "sell"] as const).map(t => (
              <TouchableOpacity key={t} style={[ins.tab, orderTab === t && ins.tabActive]} onPress={() => setOrderTab(t)} activeOpacity={0.8}>
                <Text style={[ins.tabText, orderTab === t && ins.tabTextActive]}>{t === "buy" ? "Buy Orders" : "Sell Orders"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[ins.breakdownCard, IOS_CARD]}>
            <Text style={ins.breakdownTitle}>Order Breakdown</Text>
            {breakdown.map((item, i) => (
              <View key={item.label}>
                {i > 0 && <View style={ins.hairline} />}
                <View style={ins.breakdownRow}>
                  <View style={[ins.breakdownIconBox, { backgroundColor: item.iconBg }]}>
                    <MaterialCommunityIcons name={item.icon as any} size={20} color={item.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={ins.breakdownLabel}>{item.label}</Text>
                    <Text style={ins.breakdownCount}>{item.count} orders</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </View>
  );
}

const ins = StyleSheet.create({
  root:            { flex: 1, backgroundColor: BG },
  navBar:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:        { fontSize: 16, fontWeight: "700", color: BRAND_DARK, letterSpacing: -0.3 },
  periodBtn:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: BLUE_LIGHT, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  periodBtnText:   { fontSize: 13, fontWeight: "600", color: BRAND },
  periodDropdown:  { position: "absolute", top: 56, right: 16, backgroundColor: SURFACE, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, zIndex: 99, minWidth: 160, overflow: "hidden" },
  periodOption:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  periodOptionText:{ fontSize: 14, color: SUBLABEL },
  periodOptionActive: { color: BRAND, fontWeight: "700" },
  center:          { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  centerText:      { fontSize: 14, color: SUBLABEL },
  scroll:          { padding: 16, gap: 12 },
  chartCard:       { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  chartCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  chartPeriodLabel:{ fontSize: 14, fontWeight: "700", color: LABEL, marginBottom: 2 },
  chartDateRange:  { fontSize: 12, color: SUBLABEL },
  netVolumeBox:    { alignItems: "flex-end" },
  netVolumeAmount: { fontSize: 18, fontWeight: "800", color: "#16A34A", marginBottom: 2 },
  netVolumeLabel:  { fontSize: 11, color: SUBLABEL },
  chartArea:       { height: 110, backgroundColor: BG, borderRadius: 10, justifyContent: "flex-end", marginBottom: 8, overflow: "hidden", paddingHorizontal: 8, paddingBottom: 4 },
  barsContainer:   { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", height: "100%", paddingBottom: 16 },
  barGroup:        { alignItems: "center", gap: 4 },
  barPair:         { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  bar:             { width: 6, borderRadius: 3 },
  barLabel:        { fontSize: 9, color: "#BBB" },
  chartEmpty:      { alignItems: "center", justifyContent: "center", flex: 1 },
  chartEmptyTitle: { fontSize: 14, fontWeight: "700", color: SUBLABEL, marginBottom: 4 },
  chartEmptySub:   { fontSize: 12, color: "#9CA3AF" },
  legend:          { flexDirection: "row", gap: 16, justifyContent: "center", marginTop: 4 },
  legendItem:      { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot:       { width: 8, height: 8, borderRadius: 4 },
  legendText:      { fontSize: 12, color: SUBLABEL },
  volumeRow:       { flexDirection: "row", gap: 12 },
  volumeCard:      { flex: 1, backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  volumeLabel:     { fontSize: 12, color: SUBLABEL, marginBottom: 6 },
  volumeAmount:    { fontSize: 20, fontWeight: "800", color: LABEL },
  totalCard:       { backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalLabel:      { fontSize: 13, color: SUBLABEL },
  totalValue:      { fontSize: 20, fontWeight: "800", color: LABEL },
  tabRow:          { flexDirection: "row", backgroundColor: "#E2E8F0", borderRadius: 30, padding: 4 },
  tab:             { flex: 1, paddingVertical: 9, borderRadius: 26, alignItems: "center" },
  tabActive:       { backgroundColor: SURFACE },
  tabText:         { fontSize: 14, fontWeight: "600", color: SUBLABEL },
  tabTextActive:   { color: LABEL, fontWeight: "700" },
  breakdownCard:   { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  breakdownTitle:  { fontSize: 14, fontWeight: "800", color: LABEL, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  hairline:        { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 66 },
  breakdownRow:    { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  breakdownIconBox:{ width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  breakdownLabel:  { fontSize: 14, fontWeight: "600", color: LABEL, marginBottom: 2 },
  breakdownCount:  { fontSize: 12, color: SUBLABEL },
});
