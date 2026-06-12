import React, { useState, useEffect } from "react";
import {
  View, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  ActivityIndicator, Modal, Platform, StatusBar,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { SCREENS } from "@constants/screens";
import {
  useGetP2POrdersQuery, P2POrder, useSearchP2POrdersQuery,
  useGetAllP2POrdersQuery,
} from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Dashboard">;

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_CARD = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

export default function P2PDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // ── All original state + hooks — untouched ────────────────────────────────
  const [activeTab, setActiveTab]           = useState<"unpaid" | "paid" | "all">("unpaid");
  const [lastUpdated, setLastUpdated]       = useState<Date>(new Date());
  const [allOrdersFilter, setAllOrdersFilter] = useState<string>("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const { data, isLoading, isFetching, refetch } = useGetP2POrdersQuery(
    { status: activeTab as "unpaid" | "paid" },
    { pollingInterval: activeTab === "unpaid" ? 5000 : activeTab === "paid" ? 10000 : 0,
      skip: activeTab === "all", refetchOnMountOrArgChange: true, refetchOnFocus: true }
  );
  const { data: allData, isLoading: isLoadingAll, isFetching: isFetchingAll, refetch: refetchAll } =
    useGetAllP2POrdersQuery({ status: allOrdersFilter }, { skip: activeTab !== "all", pollingInterval: 30000 });

  const orders = data?.orders ?? [];

  useEffect(() => { if (!isFetching) setLastUpdated(new Date()); }, [isFetching]);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchData } = useSearchP2POrdersQuery(debouncedQuery, { skip: debouncedQuery.length < 3 });

  const currentOrders = activeTab === "all" ? (allData?.orders ?? []) : orders;
  const displayOrders = debouncedQuery.length >= 3 ? (searchData?.orders ?? []) : currentOrders;

  const FILTERS = [
    { label: "All Orders", value: "all" }, { label: "Unpaid", value: "unpaid" },
    { label: "Paid", value: "paid" },      { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" }, { label: "Appealing", value: "appealing" },
  ];

  return (
    <>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />

        {/* ── Nav bar ── */}
        <View style={s.navBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.getParent()?.goBack()} activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND_DARK} />
          </TouchableOpacity>

          {/* Search */}
          <View style={s.searchBar}>
            <MaterialCommunityIcons name="magnify" size={16} color={PLACEHOLDER} />
            <TextInput
              style={s.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search orders…"
              placeholderTextColor={PLACEHOLDER}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialCommunityIcons name="close-circle" size={14} color={PLACEHOLDER} />
              </TouchableOpacity>
            )}
          </View>

          <View style={s.navRight}>
            {activeTab === "all" ? (
              <TouchableOpacity style={s.iconBtn} onPress={() => setShowFilterSheet(true)} activeOpacity={0.7}>
                <MaterialCommunityIcons name="filter-variant" size={22} color={allOrdersFilter !== "all" ? BRAND : LABEL} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate(SCREENS.P2P_INSIGHTS)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="chart-line" size={22} color={LABEL} />
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate(SCREENS.P2P_ADS)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color={LABEL} />
                </TouchableOpacity>
                <TouchableOpacity style={s.iconBtn} onPress={() => navigation.navigate(SCREENS.P2P_SETTINGS)} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="cog-outline" size={22} color={LABEL} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Last updated */}
        <Text style={s.updatedText}>
          {isFetching ? "Refreshing…" : `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
        </Text>

        {/* Tabs */}
        <View style={s.tabRow}>
          {(["unpaid", "paid", "all"] as const).map((tab) => (
            <TouchableOpacity key={tab} style={[s.tab, activeTab === tab && s.tabActive]}
              onPress={() => setActiveTab(tab)} activeOpacity={0.8}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Orders */}
        {(isLoading && activeTab !== "all") || (isLoadingAll && activeTab === "all") ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={BRAND} />
            <Text style={s.loadingText}>Fetching your orders…</Text>
          </View>
        ) : (
          <FlatList
            data={displayOrders}
            keyExtractor={(item) => item.id}
            contentContainerStyle={s.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={activeTab === "all" ? isFetchingAll : isFetching}
                onRefresh={activeTab === "all" ? refetchAll : refetch}
                tintColor={BRAND}
              />
            }
            ListEmptyComponent={<EmptyState tab={activeTab} />}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item }) => (
              <OrderCard order={item} onPress={() => navigation.navigate(SCREENS.P2P_ORDER_DETAIL, { orderId: item.id })} />
            )}
          />
        )}
      </View>

      {/* Filter sheet */}
      <Modal visible={showFilterSheet} transparent animationType="slide" onRequestClose={() => setShowFilterSheet(false)}>
        <TouchableOpacity style={s.filterOverlay} activeOpacity={1} onPress={() => setShowFilterSheet(false)}>
          <View style={[s.filterSheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={s.sheetHandle} />
            <Text style={s.filterTitle}>Filter Orders</Text>
            {FILTERS.map((f) => (
              <TouchableOpacity key={f.value} style={s.filterOption} activeOpacity={0.7}
                onPress={() => { setAllOrdersFilter(f.value); setShowFilterSheet(false); }}>
                <Text style={[s.filterOptionText, allOrdersFilter === f.value && s.filterOptionActive]}>{f.label}</Text>
                {allOrdersFilter === f.value && <MaterialCommunityIcons name="checkmark" size={18} color={BRAND} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

function OrderCard({ order, onPress }: { order: P2POrder; onPress: () => void }) {
  const statusLabel =
    order.status === "unpaid"    ? "Awaiting Payment" :
    order.status === "paid"      ? "Awaiting Release" :
    order.status === "completed" ? "Completed" :
    order.status === "cancelled" ? "Cancelled" : "Appealing";

  const statusColor =
    order.status === "completed" ? "#16A34A" :
    order.status === "cancelled" ? SUBLABEL   :
    order.status === "appealing" ? "#DC2626"  : "#D97706";

  const statusBg =
    order.status === "completed" ? "#F0FDF4" :
    order.status === "cancelled" ? BG        :
    order.status === "appealing" ? "#FEF2F2" : "#FFFBEB";

  return (
    <View style={[s.card, IOS_CARD]}>
      {/* Top */}
      <View style={s.cardTop}>
        <View style={s.cardTopLeft}>
          <View style={[s.typeBadge, order.type === "Buy" ? s.buyBadge : s.sellBadge]}>
            <Text style={[s.typeBadgeText, order.type === "Buy" ? { color: "#16A34A" } : { color: "#DC2626" }]}>{order.type}</Text>
          </View>
          <Text style={s.cardAmount}>{order.quantity} <Text style={s.cardCoin}>{order.coin}</Text></Text>
          <View style={{ position: "relative" }}>
            <View style={s.coinDot}><Text style={s.coinDotText}>T</Text></View>
            {order.needs_attention && <View style={s.attentionDot} />}
          </View>
        </View>
        <View style={[s.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[s.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      <Text style={s.cardRate}>@ ₦{order.price}/{order.coin}</Text>

      <View style={s.cardMeta}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Text style={s.cardOrderNo}>Order #{order.id?.slice(-8)}</Text>
          <View style={s.exchangeDot}><Text style={s.exchangeDotText}>B</Text></View>
        </View>
        <Text style={s.cardDate}>{order.created_at ?? ""}</Text>
      </View>

      <View style={s.hairline} />

      <View style={s.buyerRow}>
        <MaterialCommunityIcons name="account-circle-outline" size={28} color={BRAND} />
        <Text style={s.buyerName}>{order.type === "Buy" ? order.seller_name : order.buyer_name ?? "—"}</Text>
      </View>

      <View style={s.amountRow}>
        <Text style={s.amountLabel}>Amount</Text>
        <Text style={s.amountValue}>₦{order.amount}</Text>
      </View>

      {(order.unread_messages ?? 0) > 0 && (
        <View style={s.unreadBadge}>
          <MaterialCommunityIcons name="chat-outline" size={14} color={BRAND} />
          <Text style={s.unreadText}>{order.unread_messages} new message{(order.unread_messages ?? 0) > 1 ? "s" : ""}</Text>
        </View>
      )}

      <TouchableOpacity style={s.detailsBtn} onPress={onPress} activeOpacity={0.75}>
        <Text style={s.detailsBtnText}>View Details</Text>
      </TouchableOpacity>
    </View>
  );
}

function EmptyState({ tab }: { tab: string }) {
  return (
    <View style={s.emptyWrap}>
      <MaterialCommunityIcons name="text-box-multiple-outline" size={64} color="#D1D5DB" />
      <Text style={s.emptyTitle}>No {tab} orders</Text>
      <Text style={s.emptySub}>When you receive new orders, they will appear here</Text>
    </View>
  );
}

// ─── local aliases so styles compile without import ──────────────────────────
const BG = "#F2F2F7";

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  navBar:       { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  searchBar:    { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: BG, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, marginHorizontal: 8, gap: 6 },
  searchInput:  { flex: 1, fontSize: 13, color: LABEL, padding: 0, height: 20, backgroundColor: "transparent" },
  navRight:     { flexDirection: "row", gap: 2 },
  iconBtn:      { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  updatedText:  { fontSize: 11, color: PLACEHOLDER, paddingHorizontal: 20, marginTop: 8, marginBottom: 4 },
  tabRow:       { flexDirection: "row", marginHorizontal: 16, marginVertical: 10, backgroundColor: "#E2E8F0", borderRadius: 30, padding: 4 },
  tab:          { flex: 1, paddingVertical: 9, borderRadius: 26, alignItems: "center" },
  tabActive:    { backgroundColor: SURFACE },
  tabText:      { fontSize: 14, fontWeight: "600", color: SUBLABEL },
  tabTextActive:{ color: LABEL, fontWeight: "700" },
  listContent:  { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  loadingWrap:  { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  loadingText:  { fontSize: 14, color: SUBLABEL },
  card:         { backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  cardTop:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  cardTopLeft:  { flexDirection: "row", alignItems: "center", gap: 6 },
  typeBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  buyBadge:     { backgroundColor: "#F0FDF4" },
  sellBadge:    { backgroundColor: "#FEF2F2" },
  typeBadgeText:{ fontSize: 12, fontWeight: "700" },
  cardAmount:   { fontSize: 15, fontWeight: "800", color: LABEL },
  cardCoin:     { fontWeight: "600", color: SUBLABEL },
  coinDot:      { width: 20, height: 20, borderRadius: 10, backgroundColor: "#26A17B", justifyContent: "center", alignItems: "center" },
  coinDotText:  { color: SURFACE, fontSize: 10, fontWeight: "800" },
  attentionDot: { position: "absolute", top: -2, right: -2, width: 7, height: 7, borderRadius: 4, backgroundColor: "#DC2626", borderWidth: 1, borderColor: SURFACE },
  statusBadge:  { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  statusText:   { fontSize: 11, fontWeight: "600" },
  cardRate:     { fontSize: 12, color: SUBLABEL, marginBottom: 6 },
  cardMeta:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  cardOrderNo:  { fontSize: 12, color: SUBLABEL },
  exchangeDot:  { width: 18, height: 18, borderRadius: 9, backgroundColor: "#0A0F1E", justifyContent: "center", alignItems: "center" },
  exchangeDotText: { color: SURFACE, fontSize: 8, fontWeight: "800" },
  cardDate:     { fontSize: 12, color: PLACEHOLDER },
  hairline:     { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginVertical: 10 },
  buyerRow:     { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  buyerName:    { fontSize: 14, fontWeight: "600", color: LABEL },
  amountRow:    { flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  amountLabel:  { fontSize: 13, color: SUBLABEL },
  amountValue:  { fontSize: 16, fontWeight: "800", color: LABEL },
  unreadBadge:  { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE_LIGHT, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 10, alignSelf: "flex-start" },
  unreadText:   { fontSize: 12, color: BRAND, fontWeight: "600" },
  detailsBtn:   { borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 30, paddingVertical: 11, alignItems: "center" },
  detailsBtnText: { fontSize: 14, fontWeight: "600", color: LABEL },
  emptyWrap:    { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyTitle:   { fontSize: 18, fontWeight: "800", color: LABEL },
  emptySub:     { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 21, paddingHorizontal: 40 },
  filterOverlay:{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  filterSheet:  { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: SEPARATOR, alignSelf: "center", marginBottom: 18 },
  filterTitle:  { fontSize: 17, fontWeight: "700", color: BRAND_DARK, marginBottom: 12 },
  filterOption: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  filterOptionText:   { fontSize: 15, color: SUBLABEL, fontWeight: "500" },
  filterOptionActive: { color: BRAND, fontWeight: "700" },
});
