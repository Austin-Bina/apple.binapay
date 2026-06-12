import React, { useState } from "react";
import {
  TouchableOpacity, View, StyleSheet, FlatList,
  ActivityIndicator, RefreshControl, Alert, Platform, StatusBar,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useGetP2PAdsQuery, useDelistP2PAdMutation, useGetP2PBybitBalanceQuery,
  useSyncP2PAdsMutation, useToggleP2PAdAutoUpdateMutation,
  useGetP2PRatesPreviewQuery, useRemoveP2PAdLocalMutation, P2PAd,
} from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";

type Props = P2PStackScreenProps<"P2P Ads">;

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const IOS_CARD_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

export default function P2PAdsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [delistingId, setDelistingId] = useState<string | null>(null);

  // ── All original hooks — untouched ────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useGetP2PAdsQuery(undefined, { pollingInterval: 30000 });
  const [delistAd]       = useDelistP2PAdMutation();
  const [syncAds, { isLoading: isSyncing }] = useSyncP2PAdsMutation();
  const [toggleAutoUpdate] = useToggleP2PAdAutoUpdateMutation();
  const { data: balanceData, refetch: refetchBalance } = useGetP2PBybitBalanceQuery(undefined, { pollingInterval: 60000 });
  const { data: ratesPreview, isLoading: isLoadingPreview } = useGetP2PRatesPreviewQuery(undefined, { pollingInterval: 60000 });
  const [removeLocal] = useRemoveP2PAdLocalMutation();
  const ads = data?.ads ?? [];

  // ── All original handlers — untouched ────────────────────────────────────
  const handleDelist = (ad: P2PAd) => {
    Alert.alert("Delist Ad", `Are you sure you want to delist this ${ad.side} ad at ₦${ad.price}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delist", style: "destructive", onPress: async () => {
        setDelistingId(ad.id);
        try {
          await delistAd(ad.id).unwrap();
          showToast({ message: "Ad delisted successfully.", duration: 2000 });
          refetch();
        } catch (err: any) {
          showToast({ message: err?.data?.message ?? "Failed to delist ad.", duration: 3000 });
        } finally { setDelistingId(null); }
      }},
    ]);
  };

  const handleRemoveLocal = (ad: P2PAd) => {
    Alert.alert("Remove from list", "This will only remove the ad from your list here. It will NOT cancel it on Bybit.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: async () => {
        try {
          await removeLocal(ad.id).unwrap();
          showToast({ message: "Ad removed from your list.", duration: 2000 });
        } catch { showToast({ message: "Failed to remove ad.", duration: 3000 }); }
      }},
    ]);
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
    if (status === 20) return { label: "Sold out", color: SUBLABEL,   bg: BG };
    if (isOnline)      return { label: "Active",   color: "#16A34A",  bg: "#F0FDF4" };
    return               { label: "Hidden",   color: "#D97706",  bg: "#FFFBEB" };
  };

  return (
    <View style={[s.root, { paddingBottom: insets.bottom }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Nav bar ── */}
      <View style={[s.navBar, { paddingTop: insets.top + 6 }]}>
        <TouchableOpacity style={s.navBackBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND_DARK} />
        </TouchableOpacity>
        <Text style={s.navTitle}>My Ads</Text>
        <View style={s.navRight}>
          <TouchableOpacity style={s.iconBtn} onPress={handleSync} disabled={isSyncing} activeOpacity={0.7}>
            {isSyncing
              ? <ActivityIndicator size={18} color={BRAND} />
              : <MaterialCommunityIcons name="sync" size={20} color={BRAND} />}
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} onPress={() => { refetch(); refetchBalance(); }} activeOpacity={0.7}>
            <MaterialCommunityIcons name="refresh" size={20} color={LABEL} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Balance card ── */}
      <View style={[s.balanceCard, IOS_CARD_SHADOW]}>
        <View style={s.balanceTop}>
          <View style={s.balanceAvatar}>
            <Text style={s.balanceAvatarText}>B</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.balanceLabel}>Bybit USDT Balance</Text>
            <Text style={s.balanceValue}>
              {balanceData !== undefined ? `${balanceData.usdt_balance.toFixed(4)} USDT` : "—"}
            </Text>
          </View>
        </View>

        {isLoadingPreview && (
          <View style={s.ratesRow}>
            <ActivityIndicator size={12} color={BRAND} />
            <Text style={s.ratesLoading}>Fetching rates…</Text>
          </View>
        )}
        {!isLoadingPreview && ratesPreview && (
          <View style={s.ratesRow}>
            <View style={s.rateItem}>
              <Text style={s.rateLabel}>Buy</Text>
              <Text style={[s.rateValue, { color: "#16A34A" }]}>₦{ratesPreview.buy_rate?.toLocaleString() ?? "—"}</Text>
            </View>
            <View style={s.rateDivider} />
            <View style={s.rateItem}>
              <Text style={s.rateLabel}>Sell</Text>
              <Text style={[s.rateValue, { color: "#DC2626" }]}>₦{ratesPreview.sell_rate?.toLocaleString() ?? "—"}</Text>
            </View>
            {ratesPreview.margin !== null && (
              <>
                <View style={s.rateDivider} />
                <View style={s.rateItem}>
                  <Text style={s.rateLabel}>Margin</Text>
                  <Text style={[s.rateValue, { color: ratesPreview.margin_ok ? "#16A34A" : "#DC2626" }]}>
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
        <View style={s.center}>
          <ActivityIndicator size="large" color={BRAND} />
          <Text style={s.centerText}>Loading your ads…</Text>
        </View>
      ) : ads.length === 0 ? (
        <View style={s.center}>
          <View style={s.emptyIconWrap}>
            <MaterialCommunityIcons name="newspaper-variant-outline" size={36} color={BRAND} />
          </View>
          <Text style={s.emptyTitle}>No ads found</Text>
          <Text style={s.emptySub}>Sync your ads from Bybit to see them here</Text>
        </View>
      ) : (
        <FlatList
          data={ads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} tintColor={BRAND} />}
          renderItem={({ item }) => {
            const st = statusLabel(item.status, item.is_online ?? false);
            const isDelisting = delistingId === item.id;
            return (
              <View style={[s.adCard, IOS_CARD_SHADOW]}>
                {/* Card header */}
                <View style={s.adCardHeader}>
                  <View style={[s.sidePill, { backgroundColor: item.side === "Buy" ? "#F0FDF4" : BLUE_LIGHT }]}>
                    <Text style={[s.sidePillText, { color: item.side === "Buy" ? "#16A34A" : BRAND }]}>{item.side}</Text>
                  </View>
                  <View style={[s.statusPill, { backgroundColor: st.bg }]}>
                    <View style={[s.statusDot, { backgroundColor: st.color }]} />
                    <Text style={[s.statusPillText, { color: st.color }]}>{st.label}</Text>
                  </View>
                </View>

                {/* Auto-update toggle */}
                <View style={s.toggleRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Auto-update price</Text>
                    <Text style={s.toggleSub}>Updates price automatically</Text>
                  </View>
                  <TouchableOpacity
                    style={[s.toggleTrack, item.trading_enabled && s.toggleTrackOn]}
                    onPress={async () => {
                      try { await toggleAutoUpdate(item.id).unwrap(); }
                      catch { showToast({ message: "Failed to toggle.", duration: 2000 }); }
                    }}
                    activeOpacity={0.8}>
                    <View style={[s.toggleThumb, item.trading_enabled && s.toggleThumbOn]} />
                  </TouchableOpacity>
                </View>

                {/* Fields */}
                <View style={s.adBody}>
                  <AdRow label="Price"    value={`₦${item.price}`}                        bold />
                  <View style={s.hairline} />
                  <AdRow label="Quantity" value={`${item.quantity} ${item.token}`}         />
                  <View style={s.hairline} />
                  <AdRow label="Limit"    value={`₦${item.min_amount} – ₦${item.max_amount}`} />
                  {!!item.remark && (
                    <>
                      <View style={s.hairline} />
                      <AdRow label="Remark" value={item.remark!} truncate />
                    </>
                  )}
                </View>

                {/* Actions */}
                <View style={s.adActions}>
                  <TouchableOpacity
                    style={s.actionBtnOutline}
                    onPress={() => navigation.navigate(SCREENS.P2P_EDIT_AD as any, { ad: item })}
                    activeOpacity={0.75}>
                    <MaterialCommunityIcons name="pencil-outline" size={15} color={BRAND} />
                    <Text style={[s.actionBtnText, { color: BRAND }]}>Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.actionBtnOutline, s.actionBtnRed, isDelisting && s.disabledBtn]}
                    onPress={() => handleDelist(item)}
                    disabled={isDelisting}
                    activeOpacity={0.75}>
                    {isDelisting
                      ? <ActivityIndicator size={15} color="#DC2626" />
                      : <MaterialCommunityIcons name="close-circle-outline" size={15} color="#DC2626" />}
                    <Text style={[s.actionBtnText, { color: "#DC2626" }]}>
                      {isDelisting ? "Delisting…" : "Delist"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[s.actionBtnOutline, s.actionBtnGray]}
                    onPress={() => handleRemoveLocal(item)}
                    activeOpacity={0.75}>
                    <MaterialCommunityIcons name="playlist-remove" size={15} color={SUBLABEL} />
                    <Text style={[s.actionBtnText, { color: SUBLABEL }]}>Hide</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
  );
}

function AdRow({ label, value, bold, truncate }: { label: string; value: string; bold?: boolean; truncate?: boolean }) {
  return (
    <View style={s.adRow}>
      <Text style={s.adLabel}>{label}</Text>
      <Text style={[s.adValue, bold && s.adValueBold]} numberOfLines={truncate ? 1 : undefined}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: BG },
  navBar:            { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  navBackBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:          { fontSize: 16, fontWeight: "700", color: BRAND_DARK, letterSpacing: -0.3 },
  navRight:          { flexDirection: "row", gap: 4 },
  iconBtn:           { width: 36, height: 36, borderRadius: 18, justifyContent: "center", alignItems: "center" },
  balanceCard:       { margin: 16, backgroundColor: SURFACE, borderRadius: 16, padding: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  balanceTop:        { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  balanceAvatar:     { width: 40, height: 40, borderRadius: 20, backgroundColor: "#0A0F1E", justifyContent: "center", alignItems: "center" },
  balanceAvatarText: { color: SURFACE, fontSize: 14, fontWeight: "800" },
  balanceLabel:      { fontSize: 12, color: SUBLABEL },
  balanceValue:      { fontSize: 16, fontWeight: "700", color: LABEL },
  ratesRow:          { flexDirection: "row", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  ratesLoading:      { fontSize: 12, color: SUBLABEL, marginLeft: 8 },
  rateItem:          { flex: 1, alignItems: "center" },
  rateLabel:         { fontSize: 11, color: SUBLABEL, marginBottom: 2 },
  rateValue:         { fontSize: 13, fontWeight: "700" },
  rateDivider:       { width: StyleSheet.hairlineWidth, height: 28, backgroundColor: SEPARATOR },
  center:            { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  centerText:        { fontSize: 14, color: SUBLABEL },
  emptyIconWrap:     { width: 72, height: 72, borderRadius: 36, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  emptyTitle:        { fontSize: 16, fontWeight: "700", color: LABEL },
  emptySub:          { fontSize: 13, color: SUBLABEL, textAlign: "center", paddingHorizontal: 40 },
  list:              { padding: 16, gap: 12 },
  adCard:            { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  adCardHeader:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  sidePill:          { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  sidePillText:      { fontSize: 12, fontWeight: "700" },
  statusPill:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, marginLeft: "auto" },
  statusDot:         { width: 6, height: 6, borderRadius: 3 },
  statusPillText:    { fontSize: 12, fontWeight: "600" },
  toggleRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  toggleLabel:       { fontSize: 13, fontWeight: "600", color: LABEL },
  toggleSub:         { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  toggleTrack:       { width: 44, height: 26, borderRadius: 13, backgroundColor: "#D1D5DB", justifyContent: "center", paddingHorizontal: 3 },
  toggleTrackOn:     { backgroundColor: BRAND },
  toggleThumb:       { width: 20, height: 20, borderRadius: 10, backgroundColor: SURFACE, alignSelf: "flex-start", ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2 } }) },
  toggleThumbOn:     { alignSelf: "flex-end" },
  adBody:            { paddingHorizontal: 14 },
  adRow:             { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12 },
  adLabel:           { fontSize: 13, color: SUBLABEL },
  adValue:           { fontSize: 13, color: LABEL, fontWeight: "500" },
  adValueBold:       { fontSize: 15, fontWeight: "700" },
  hairline:          { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  adActions:         { flexDirection: "row", gap: 8, padding: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  actionBtnOutline:  { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1.5, borderColor: BRAND, borderRadius: 22, paddingVertical: 10 },
  actionBtnRed:      { borderColor: "#FECACA" },
  actionBtnGray:     { borderColor: SEPARATOR },
  actionBtnText:     { fontSize: 13, fontWeight: "700" },
  disabledBtn:       { opacity: 0.45 },
});
