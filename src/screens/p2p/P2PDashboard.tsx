import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Text, TextInput, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { SCREENS } from "@constants/screens";
import { useGetP2POrdersQuery, P2POrder, useSearchP2POrdersQuery, useGetAllP2POrdersQuery } from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Dashboard">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

export default function P2PDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
 const [activeTab, setActiveTab] = useState<"unpaid" | "paid" | "all">("unpaid");
  const [autoPayment] = useState(false);
const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
const [allOrdersFilter, setAllOrdersFilter] = useState<string>("all");
const [showFilterSheet, setShowFilterSheet] = useState(false);

  
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
const { data, isLoading, isFetching, refetch } = useGetP2POrdersQuery(
  { status: activeTab as "unpaid" | "paid" },
  { 
    pollingInterval: activeTab === "unpaid" ? 5000 : activeTab === "paid" ? 10000 : 0,
    skip: activeTab === "all",
     refetchOnMountOrArgChange: true,  // ← add this
    refetchOnFocus: true,             // ← add this
  }
);

const { data: allData, isLoading: isLoadingAll, isFetching: isFetchingAll, refetch: refetchAll } = 
  useGetAllP2POrdersQuery(
    { status: allOrdersFilter },
    {
      skip: activeTab !== "all",
      pollingInterval: 30000,
    }
  );


  const orders = data?.orders ?? [];
  const openCount = activeTab === "unpaid" ? (data?.total ?? 0) : 0;

  const filteredOrders = orders.filter((o) => {
  if (!searchQuery) return true;
  const q = searchQuery.toLowerCase();
  return (
    o.id?.toLowerCase().includes(q) ||
    o.amount?.toString().includes(q)
  );
});

useEffect(() => {
  if (!isFetching) {
    setLastUpdated(new Date());
  }
}, [isFetching]);

// Debounce the search
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedQuery(searchQuery);
  }, 500);
  return () => clearTimeout(timer);
}, [searchQuery]);

const { data: searchData } = useSearchP2POrdersQuery(debouncedQuery, {
  skip: debouncedQuery.length < 3,
});

// Use search results when query active, otherwise use tab orders
const currentOrders = activeTab === "all"
  ? (allData?.orders ?? [])
  : orders;

const displayOrders = debouncedQuery.length >= 3
  ? (searchData?.orders ?? [])
  : currentOrders;

  return (
    <>
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
<View style={styles.header}>
  <TouchableRipple
    onPress={() => navigation.getParent()?.goBack()}
    style={styles.backBtn}
    borderless>
    <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
  </TouchableRipple>

  {/* Search bar — compact, center */}
  <View style={styles.searchBar}>
    <MaterialCommunityIcons name="magnify" size={16} color="#AAA" />
    <TextInput
      style={styles.searchInput}
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search orders..."
      placeholderTextColor="#BBB"
    />
    {searchQuery.length > 0 && (
      <TouchableOpacity onPress={() => setSearchQuery("")}>
        <MaterialCommunityIcons name="close-circle" size={14} color="#BBB" />
      </TouchableOpacity>
    )}
  </View>

  <View style={{ flexDirection: "row", gap: 6 }}>
  {activeTab === "all" ? (
    <TouchableRipple
      onPress={() => setShowFilterSheet(true)}
      style={styles.iconBtn}
      borderless>
      <MaterialCommunityIcons name="filter-variant" size={22} color={allOrdersFilter !== "all" ? BRAND : "#111"} />
    </TouchableRipple>
  ) : (
    <>
      <TouchableRipple onPress={() => navigation.navigate(SCREENS.P2P_INSIGHTS)} style={styles.iconBtn} borderless>
        <MaterialCommunityIcons name="chart-line" size={22} color="#111" />
      </TouchableRipple>
      <TouchableRipple onPress={() => navigation.navigate(SCREENS.P2P_ADS)} style={styles.iconBtn} borderless>
        <MaterialCommunityIcons name="newspaper-variant-outline" size={22} color="#111" />
      </TouchableRipple>
      <TouchableRipple onPress={() => navigation.navigate(SCREENS.P2P_SETTINGS)} style={styles.iconBtn} borderless>
        <MaterialCommunityIcons name="cog-outline" size={22} color="#111" />
      </TouchableRipple>
    </>
  )}
</View>
</View>

     

      {/* ── Last updated ── */}
      <Text style={styles.updatedText}>
  {isFetching
    ? "Refreshing..."
    : `Updated ${lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
    </Text>

      {/* ── Tabs ── */}
      <View style={styles.tabRow}>
  <TouchableOpacity
    style={[styles.tab, activeTab === "unpaid" && styles.tabActive]}
    onPress={() => setActiveTab("unpaid")}
    activeOpacity={0.8}>
    <Text style={[styles.tabText, activeTab === "unpaid" && styles.tabTextActive]}>
      Unpaid
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.tab, activeTab === "paid" && styles.tabActive]}
    onPress={() => setActiveTab("paid")}
    activeOpacity={0.8}>
    <Text style={[styles.tabText, activeTab === "paid" && styles.tabTextActive]}>
      Paid
    </Text>
  </TouchableOpacity>
  <TouchableOpacity
    style={[styles.tab, activeTab === "all" && styles.tabActive]}
    onPress={() => setActiveTab("all")}
    activeOpacity={0.8}>
    <Text style={[styles.tabText, activeTab === "all" && styles.tabTextActive]}>
      All
    </Text>
  </TouchableOpacity>
</View>

      {/* ── Orders list ── */}
      {(isLoading && activeTab !== "all") || (isLoadingAll && activeTab === "all") ? (
  <View style={styles.loadingWrap}>
    <ActivityIndicator size="large" color={BRAND} />
    <Text style={styles.loadingText}>Fetching your orders...</Text>
  </View>
) : (
        <FlatList
         data={displayOrders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
           <RefreshControl
    refreshing={activeTab === "all" ? isFetchingAll : isFetching}
    onRefresh={activeTab === "all" ? refetchAll : refetch}
    colors={[BRAND]}
    tintColor={BRAND}
       />
       }
          ListEmptyComponent={<EmptyState tab={activeTab} />}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              onPress={() =>
                navigation.navigate(SCREENS.P2P_ORDER_DETAIL, { orderId: item.id })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>

    {/* ── Filter Sheet ── */}
<Modal
  visible={showFilterSheet}
  transparent
  animationType="slide"
  onRequestClose={() => setShowFilterSheet(false)}>
  <TouchableOpacity
    style={styles.filterOverlay}
    activeOpacity={1}
    onPress={() => setShowFilterSheet(false)}>
    <View style={styles.filterSheet}>
      <Text style={styles.filterTitle}>Filter Orders</Text>
      {[
        { label: "All Orders",  value: "all" },
        { label: "Unpaid",      value: "unpaid" },
        { label: "Paid",        value: "paid" },
        { label: "Completed",   value: "completed" },
        { label: "Cancelled",   value: "cancelled" },
        { label: "Appealing",   value: "appealing" },
      ].map((f) => (
        <TouchableRipple
          key={f.value}
          style={styles.filterOption}
          onPress={() => {
            setAllOrdersFilter(f.value);
            setShowFilterSheet(false);
          }}>
          <View style={styles.filterOptionInner}>
            <Text style={[
              styles.filterOptionText,
              allOrdersFilter === f.value && styles.filterOptionActive,
            ]}>
              {f.label}
            </Text>
            {allOrdersFilter === f.value && (
              <MaterialCommunityIcons name="check" size={18} color={BRAND} />
            )}
          </View>
        </TouchableRipple>
      ))}
    </View>
  </TouchableOpacity>
</Modal>
 
  </>
   );
}

// ─── Order Card ──────────────────────────────────────────────────────────────
function OrderCard({ order, onPress }: { order: P2POrder; onPress: () => void }) {
  const statusLabel =
    order.status === "unpaid" ? "Awaiting Payment" :
    order.status === "paid"   ? "Awaiting Release" :
    order.status === "completed" ? "Completed" :
    order.status === "cancelled" ? "Cancelled" : "Appealing";

  const statusColor =
    order.status === "completed" ? "#2E7D32" :
    order.status === "cancelled" ? "#888"    :
    order.status === "appealing" ? "#E53935" : "#F5A623";

  const statusBg =
    order.status === "completed" ? "#E8F5E9" :
    order.status === "cancelled" ? "#F5F5F5" :
    order.status === "appealing" ? "#FFEBEE" : "#FFF3E0";

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.cardTop}>
        <View style={styles.cardTopLeft}>
          <View style={[styles.typeBadge, order.type === "Buy" ? styles.buyBadge : styles.sellBadge]}>
            <Text style={[styles.typeBadgeText, order.type === "Buy" ? styles.buyText : styles.sellText]}>
              {order.type}
            </Text>           
          </View>

          {/* Coin dot with attention overlay */}


          <Text style={styles.cardAmount}>
            {order.quantity}{" "}
            <Text style={styles.cardCoin}>{order.coin}</Text>
          </Text>
         <View style={{ position: "relative" }}>
          <View style={styles.coinDot}>
            <Text style={styles.coinDotText}>T</Text>
          </View>
          {order.needs_attention && (
    <View style={styles.attentionDot} />
  )}
</View>

        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
        </View>
      </View>

      {/* Rate + order info */}
      <Text style={styles.cardRate}>@ ₦{order.price}/{order.coin}</Text>
      <View style={styles.cardMeta}>
        <View style={styles.cardMetaLeft}>
          <Text style={styles.cardOrderNo}>Order #{order.id?.slice(-8)}</Text>
          <View style={styles.exchangeDot}>
            <Text style={styles.exchangeDotText}>B</Text>
          </View>
        </View>
        <Text style={styles.cardDate}>{order.created_at ?? ""}</Text>
      </View>

      {/* Counterparty */}
      <View style={styles.buyerRow}>
        <MaterialCommunityIcons name="account-circle-outline" size={28} color={BRAND} />
        <Text style={styles.buyerName}>
        {order.type === "Buy" ? order.seller_name : order.buyer_name ?? "—"}
        </Text>
      </View>

      {/* Amount */}
      <View style={styles.amountRow}>
        <Text style={styles.amountLabel}>Amount</Text>
        <Text style={styles.amountValue}>₦{order.amount}</Text>
      </View>

      {/* Unread messages badge */}
{(order.unread_messages ?? 0) > 0 && (
  <View style={styles.unreadBadge}>
    <MaterialCommunityIcons name="chat-outline" size={14} color={BRAND} />
    <Text style={styles.unreadText}>
      {order.unread_messages} new message{(order.unread_messages ?? 0) > 1 ? "s" : ""}
    </Text>
  </View>
)}

      {/* View details */}
      <TouchableRipple style={styles.detailsBtn} onPress={onPress}>
        <Text style={styles.detailsBtnText}>View Details</Text>
      </TouchableRipple>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: string }) {
  return (
    <View style={styles.emptyWrap}>
      <MaterialCommunityIcons name="text-box-multiple-outline" size={64} color="#D0D9EE" />
      <Text style={styles.emptyTitle}>No {tab} orders</Text>
      <Text style={styles.emptySub}>
        When you receive new orders, they will appear here
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  backBtn: { padding: 4, borderRadius: 20 },
  headerTitle: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerText: { fontSize: 16, fontWeight: "800", color: "#111" },
  countBadge: {
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 20,
  },
  countText: { fontSize: 12, fontWeight: "700", color: BRAND },
  autoBanner: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8EEF9",
  },
  autoBannerInner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  autoDot: { width: 10, height: 10, borderRadius: 5 },
  autoDotOn: { backgroundColor: "#2E7D32" },
  autoDotOff: { backgroundColor: "#BBB" },
  autoBannerText: { flex: 1, fontSize: 13, color: "#555" },
  updatedText: {
    fontSize: 11,
    color: "#AAA",
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  tabRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginVertical: 12,
    backgroundColor: "#E8EEF9",
    borderRadius: 30,
    padding: 4,
  },
  tab: { flex: 1, paddingVertical: 9, borderRadius: 26, alignItems: "center" },
  tabActive: { backgroundColor: "#fff" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#888" },
  tabTextActive: { color: "#111", fontWeight: "700" },
  listContent: { paddingHorizontal: 16, paddingBottom: 32, flexGrow: 1 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  loadingText: { fontSize: 14, color: "#888" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8EEF9",
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  cardTopLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  buyBadge: { backgroundColor: "#E8F5E9" },
  sellBadge: { backgroundColor: "#FFEBEE" },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  buyText: { color: "#2E7D32" },
  sellText: { color: "#E53935" },
  cardAmount: { fontSize: 15, fontWeight: "800", color: "#111" },
  cardCoin: { fontWeight: "600", color: "#555" },
  coinDot: {
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#26A17B",
    justifyContent: "center", alignItems: "center",
  },
  coinDotText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  statusText: { fontSize: 11, fontWeight: "600" },
  cardRate: { fontSize: 12, color: "#888", marginBottom: 6 },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cardMetaLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  cardOrderNo: { fontSize: 12, color: "#888" },
  exchangeDot: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: "#0A0F1E",
    justifyContent: "center", alignItems: "center",
  },
  exchangeDotText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  cardDate: { fontSize: 12, color: "#AAA" },
  buyerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4FB",
  },
  buyerName: { fontSize: 14, fontWeight: "600", color: "#222" },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  amountLabel: { fontSize: 13, color: "#888" },
  amountValue: { fontSize: 16, fontWeight: "800", color: "#111" },
  detailsBtn: {
    borderWidth: 1.5,
    borderColor: "#D0D9EE",
    borderRadius: 30,
    paddingVertical: 11,
    alignItems: "center",
  },
  detailsBtnText: { fontSize: 14, fontWeight: "600", color: "#333" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    gap: 12,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#222" },
  emptySub: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 40,
  },

  // REPLACE searchBar and searchInput styles:
searchBar: {
  flex: 1,
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#F4F6FB",
  borderRadius: 20,
  paddingHorizontal: 10,
  paddingVertical: 6,
  marginHorizontal: 8,
  gap: 6,
},
searchInput: {
  flex: 1,
  fontSize: 12,
  color: "#111",
  padding: 0,
  height: 20,
},
iconBtn: { padding: 3, borderRadius: 20 },

filterOverlay:      { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
filterSheet:        { backgroundColor: "#fff", borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40, gap: 4 },
filterTitle:        { fontSize: 16, fontWeight: "800", color: "#111", marginBottom: 12 },
filterOption:       { paddingVertical: 4, borderRadius: 8 },
filterOptionInner:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 4 },
filterOptionText:   { fontSize: 15, color: "#555", fontWeight: "500" },
filterOptionActive: { color: BRAND, fontWeight: "700" },

unreadBadge: { 
  flexDirection: "row", 
  alignItems: "center", 
  gap: 6, 
  backgroundColor: BRAND_LIGHT, 
  borderRadius: 20, 
  paddingHorizontal: 10, 
  paddingVertical: 6, 
  marginBottom: 10,
  alignSelf: "flex-start",
},
unreadText: { fontSize: 12, color: BRAND, fontWeight: "600" },
attentionDot: {
  position: "absolute",
  top: -2,
  right: -2,
  width: 7,
  height: 7,
  borderRadius: 4,
  backgroundColor: "#E53935",
  borderWidth: 1,
  borderColor: "#fff", // white ring makes it pop on any background
},
});
