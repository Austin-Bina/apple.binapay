import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useGetP2PAdsQuery,
  useDelistP2PAdMutation,
  useGetP2PBybitBalanceQuery,
   useSyncP2PAdsMutation,
   useToggleP2PAdAutoUpdateMutation,
   useGetP2PRatesPreviewQuery,
    useRemoveP2PAdLocalMutation,
  P2PAd,
  
} from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";

type Props = P2PStackScreenProps<"P2P Ads">;

const BRAND = "hsl(221, 65%, 51%)";

export default function P2PAdsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [delistingId, setDelistingId] = useState<string | null>(null);

const { data, isLoading, isFetching, refetch } = useGetP2PAdsQuery(undefined, {
  pollingInterval: 30000, // refresh every 30 seconds
});
  const [delistAd] = useDelistP2PAdMutation();
  const [syncAds, { isLoading: isSyncing }] = useSyncP2PAdsMutation();
  const [toggleAutoUpdate] = useToggleP2PAdAutoUpdateMutation();
  const { data: balanceData, refetch: refetchBalance } = useGetP2PBybitBalanceQuery(
  undefined, { pollingInterval: 60000 } );
const { data: ratesPreview, isLoading: isLoadingPreview } =
  useGetP2PRatesPreviewQuery(undefined, { pollingInterval: 60000 });
  const [removeLocal] = useRemoveP2PAdLocalMutation();

  
  const ads = data?.ads ?? [];

  const handleDelist = (ad: P2PAd) => {
    Alert.alert(
      "Delist Ad",
      `Are you sure you want to delist this ${ad.side} ad at ₦${ad.price}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delist",
          style: "destructive",
          onPress: async () => {
            setDelistingId(ad.id);
            try {
              await delistAd(ad.id).unwrap();
              showToast({ message: "Ad delisted successfully.", duration: 2000 });
              refetch();
            } catch (err: any) {
              showToast({
                message: err?.data?.message ?? "Failed to delist ad.",
                duration: 3000,
              });
            } finally {
              setDelistingId(null);
            }
          },
        },
      ]
    );
  };



// Add to handleDelist or make a separate handler:
const handleRemoveLocal = (ad: P2PAd) => {
  Alert.alert(
    "Remove from list",
    "This will only remove the ad from your list here. It will NOT cancel it on Bybit.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeLocal(ad.id).unwrap();
            showToast({ message: "Ad removed from your list.", duration: 2000 });
          } catch (err: any) {
            showToast({ message: "Failed to remove ad.", duration: 3000 });
          }
        },
      },
    ]
  );
};
  const handleSync = async () => {
  try {
    const result = await syncAds().unwrap();
    showToast({ message: result.message, duration: 2000 });
  } catch (err: any) {
    showToast({ message: err?.data?.message ?? "Sync failed.", duration: 3000 });
  }
};

  const statusLabel = (status: number | null, isOnline: boolean) => {
  if (status === 20) return { label: "Sold out", color: "#888",    bg: "#F5F5F5" };
  if (isOnline)      return { label: "Active",   color: "#2E7D32", bg: "#E8F5E9" };
  return               { label: "Hidden",   color: "#F5A623", bg: "#FFF3E0" };
};

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>

      {/* ── Header ── */}
<View style={[styles.header, { paddingTop: insets.top + 8 }]}>
  <TouchableRipple onPress={() => navigation.goBack()} style={styles.backBtn} borderless>
    <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
  </TouchableRipple>
  <Text style={styles.headerText}>My Ads</Text>
  <View style={{ flexDirection: "row", gap: 8 }}>
    <TouchableRipple style={styles.refreshBtn} onPress={handleSync} disabled={isSyncing} borderless>
      {isSyncing
        ? <ActivityIndicator size={18} color={BRAND} />
        : <MaterialCommunityIcons name="sync" size={22} color={BRAND} />}
    </TouchableRipple>
    <TouchableRipple style={styles.refreshBtn} onPress={() => { refetch(); refetchBalance(); }} borderless>
      <MaterialCommunityIcons name="refresh" size={22} color="#111" />
    </TouchableRipple>
  </View>
</View>

      {/* ── Balance card ── */}
    <View style={styles.balanceCard}>
  <View style={styles.balanceRow}>
    <View style={styles.balanceDot}>
      <Text style={styles.balanceDotText}>B</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.balanceLabel}>Bybit USDT Balance</Text>
      <Text style={styles.balanceValue}>
        {balanceData !== undefined
          ? `${balanceData.usdt_balance.toFixed(4)} USDT`
          : "—"}
      </Text>
    </View>
  </View>

  {isLoadingPreview && (
    <View style={styles.ratesRow}>
      <ActivityIndicator size={12} color={BRAND} />
      <Text style={styles.ratesLoading}>Fetching rates...</Text>
    </View>
  )}
  {!isLoadingPreview && ratesPreview && (
    <View style={styles.ratesRow}>
      <View style={styles.rateItem}>
        <Text style={styles.rateLabel}>Buy</Text>
        <Text style={[styles.rateValue, { color: "#2E7D32" }]}>
          ₦{ratesPreview.buy_rate?.toLocaleString() ?? "—"}
        </Text>
      </View>
      <View style={styles.rateDivider} />
      <View style={styles.rateItem}>
        <Text style={styles.rateLabel}>Sell</Text>
        <Text style={[styles.rateValue, { color: "#E53935" }]}>
          ₦{ratesPreview.sell_rate?.toLocaleString() ?? "—"}
        </Text>
      </View>
      {ratesPreview.margin !== null && (
        <>
          <View style={styles.rateDivider} />
          <View style={styles.rateItem}>
            <Text style={styles.rateLabel}>Margin</Text>
            <Text style={[styles.rateValue, { color: ratesPreview.margin_ok ? "#2E7D32" : "#E53935" }]}>
              ₦{ratesPreview.margin} {ratesPreview.margin_ok ? "✓" : "✗"}
            </Text>
          </View>
        </>
      )}
    </View>
  )}
</View>

      {/* ── Ads list ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={styles.loadingText}>Loading your ads...</Text>
        </View>
      ) : ads.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="newspaper-variant-outline" size={52} color="#D0D9EE" />
          <Text style={styles.emptyText}>No ads found</Text>
          <Text style={styles.emptySubtext}>Sync your ads from Bybit to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={BRAND} />
          }
          renderItem={({ item }) => {
           const st = statusLabel(item.status, item.is_online ?? false);
            const isDelisting = delistingId === item.id;

            return (
              <View style={styles.adCard}>
                <View style={styles.adHeader}>
                  <View style={[
                    styles.sideBadge,
                    { backgroundColor: item.side === "Buy" ? "#E8F5E9" : "#EEF3FF" }
                  ]}>
                    <Text style={[
                      styles.sideBadgeText,
                      { color: item.side === "Buy" ? "#2E7D32" : BRAND }
                    ]}>
                      {item.side}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Auto-update toggle — only shown for ads synced to DB */}
<View style={styles.autoUpdateRow}>
  <View>
    <Text style={styles.autoUpdateLabel}>Auto-update price</Text>
    <Text style={styles.autoUpdateSub}>
      Updates price automatically based on your settings
    </Text>
  </View>
  <TouchableOpacity
    style={[
      styles.toggleTrack,
      item.trading_enabled
        && styles.toggleTrackOn,
    ]}
    onPress={async () => {
      try {
        await toggleAutoUpdate(item.id).unwrap();
      } catch {
        showToast({ message: "Failed to toggle.", duration: 2000 });
      }
    }}
    activeOpacity={0.8}>
    <View style={[
      styles.toggleThumb,
      item.trading_enabled
        && styles.toggleThumbOn,
    ]} />
  </TouchableOpacity>
</View>

                <View style={styles.adBody}>
                  <View style={styles.adRow}>
                    <Text style={styles.adLabel}>Price</Text>
                    <Text style={styles.adValueBold}>₦{item.price}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.adRow}>
                    <Text style={styles.adLabel}>Quantity</Text>
                    <Text style={styles.adValue}>{item.quantity} {item.token}</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.adRow}>
                    <Text style={styles.adLabel}>Limit</Text>
                    <Text style={styles.adValue}>₦{item.min_amount} – ₦{item.max_amount}</Text>
                  </View>
                  {!!item.remark && (
                    <>
                      <View style={styles.divider} />
                      <View style={styles.adRow}>
                        <Text style={styles.adLabel}>Remark</Text>
                        <Text style={[styles.adValue, { flex: 1, textAlign: "right" }]} numberOfLines={1}>
                          {item.remark}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.adActions}>
                  <TouchableRipple
                    style={styles.editBtn}
                    onPress={() => navigation.navigate(SCREENS.P2P_EDIT_AD as any, { ad: item })}>
                    <View style={styles.btnInner}>
                      <MaterialCommunityIcons name="pencil-outline" size={16} color={BRAND} />
                      <Text style={styles.editBtnText}>Edit</Text>
                    </View>
                  </TouchableRipple>
                 
                 
                  <TouchableRipple
                    style={[styles.delistBtn, isDelisting && styles.btnDisabled]}
                    onPress={() => handleDelist(item)}
                    disabled={isDelisting}>
                    <View style={styles.btnInner}>
                      {isDelisting
                        ? <ActivityIndicator size={16} color="#E53935" />
                        : <MaterialCommunityIcons name="close-circle-outline" size={16} color="#E53935" />}
                      <Text style={styles.delistBtnText}>
                        {isDelisting ? "Delisting..." : "Delist"}
                      </Text>
                    </View>
                  </TouchableRipple>

                  <TouchableRipple
           style={styles.removeLocalBtn}
            onPress={() => handleRemoveLocal(item)}>
            <View style={styles.btnInner}>
            <MaterialCommunityIcons name="playlist-remove" size={16} color="#888" />
             <Text style={styles.removeLocalBtnText}>Hide</Text>
            </View>
          </TouchableRipple>

                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: "#F4F6FB" },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  backBtn:      { padding: 4, borderRadius: 20 },
  refreshBtn:   { padding: 4, borderRadius: 20 },
  headerText:   { fontSize: 16, fontWeight: "800", color: "#111" },
  balanceCard:  { margin: 16, backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#E8EEF9" },
  balanceRow:   { flexDirection: "row", alignItems: "center", gap: 12 },
  balanceDot:   { width: 40, height: 40, borderRadius: 20, backgroundColor: "#0A0F1E", justifyContent: "center", alignItems: "center" },
  balanceDotText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  balanceLabel: { fontSize: 12, color: "#888" },
  balanceValue: { fontSize: 16, fontWeight: "800", color: "#111" },
  center:       { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText:  { fontSize: 14, color: "#888" },
  emptyText:    { fontSize: 16, fontWeight: "700", color: "#333" },
  emptySubtext: { fontSize: 13, color: "#888", textAlign: "center", paddingHorizontal: 40 },
  list:         { padding: 16, gap: 12 },
  adCard:       { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E8EEF9", overflow: "hidden" },
  adHeader:     { flexDirection: "row", alignItems: "center", gap: 8, padding: 14, borderBottomWidth: 1, borderBottomColor: "#F0F4FB" },
  sideBadge:    { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  sideBadgeText: { fontSize: 12, fontWeight: "700" },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: "auto" },
  statusText:   { fontSize: 12, fontWeight: "600" },
  adBody:       { paddingHorizontal: 16 },
  adRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  adLabel:      { fontSize: 13, color: "#888" },
  adValue:      { fontSize: 13, color: "#222", fontWeight: "500" },
  adValueBold:  { fontSize: 15, color: "#111", fontWeight: "800" },
  divider:      { height: 1, backgroundColor: "#F0F4FB" },
  adActions:    { flexDirection: "row", gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: "#F0F4FB" },
  editBtn:      { flex: 1, borderWidth: 1.5, borderColor: BRAND, borderRadius: 20, paddingVertical: 10, alignItems: "center" },
  delistBtn:    { flex: 1, borderWidth: 1.5, borderColor: "#FFCDD2", borderRadius: 20, paddingVertical: 10, alignItems: "center" },
  btnInner:     { flexDirection: "row", alignItems: "center", gap: 6 },
  editBtnText:  { fontSize: 13, fontWeight: "700", color: BRAND },
  delistBtnText: { fontSize: 13, fontWeight: "700", color: "#E53935" },
  btnDisabled:  { opacity: 0.5 },
  autoUpdateRow:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: "#F0F4FB" },
autoUpdateLabel: { fontSize: 13, fontWeight: "600", color: "#333" },
autoUpdateSub:  { fontSize: 11, color: "#AAA", marginTop: 2 },
toggleTrack:    { width: 44, height: 24, borderRadius: 12, backgroundColor: "#E0E0E0", justifyContent: "center", paddingHorizontal: 2 },
toggleTrackOn:  { backgroundColor: BRAND },
toggleThumb:    { width: 20, height: 20, borderRadius: 10, backgroundColor: "#fff", alignSelf: "flex-start" },
toggleThumbOn:  { alignSelf: "flex-end" },
previewBtn:    { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1.5, borderColor: BRAND },
previewBtnText: { fontSize: 12, fontWeight: "700", color: BRAND },
ratesRow:      { flexDirection: "row", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#F0F4FB" },
ratesLoading:  { fontSize: 12, color: "#888", marginLeft: 8 },
rateItem:      { flex: 1, alignItems: "center" },
rateLabel:     { fontSize: 11, color: "#888", marginBottom: 2 },
rateValue:     { fontSize: 13, fontWeight: "800" },
rateDivider:   { width: 1, height: 28, backgroundColor: "#F0F4FB" },
removeLocalBtn:     { flex: 1, borderWidth: 1.5, borderColor: "#E0E0E0", borderRadius: 20, paddingVertical: 10, alignItems: "center" },
removeLocalBtnText: { fontSize: 13, fontWeight: "700", color: "#888" },
});
