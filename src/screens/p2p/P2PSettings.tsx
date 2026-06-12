// ═══════════════════════════════════════════════════════════════════════════
// P2PSettingsScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useState } from "react";
import {
  View, StyleSheet, ScrollView, Switch, ActivityIndicator,
  TextInput, Modal, TouchableOpacity, Platform, StatusBar,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useGetP2PStatusQuery, useDisconnectP2PMutation, useGetUserP2PSettingsQuery,
  useUpdateUserP2PSettingsMutation, P2PUserSettings,
} from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";

type SettingsProps = P2PStackScreenProps<"P2P Settings">;

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
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
  android: { elevation: 1 },
});
const IOS_SHEET = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.10, shadowRadius: 20 },
  android: { elevation: 16 },
});

export default function P2PSettingsScreen({ navigation }: SettingsProps) {
  const insets = useSafeAreaInsets();

  const { data: statusData } = useGetP2PStatusQuery();
  const { data: settingsData, isLoading: isLoadingSettings } = useGetUserP2PSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateUserP2PSettingsMutation();
  const [disconnectP2P, { isLoading: isDisconnecting }] = useDisconnectP2PMutation();

  // ── All original state — untouched ────────────────────────────────────────
  const [autoPayment, setAutoPayment]     = useState(false);
  const [autoRelease, setAutoRelease]     = useState(false);
  const [feeEnabled, setFeeEnabled]       = useState(false);
  const [feeAmount, setFeeAmount]         = useState("");
  const [minFeeAmount, setMinFeeAmount]   = useState("");
  const [feeMode, setFeeMode]             = useState<"auto" | "require_word">("require_word");
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [nameMatchCount, setNameMatchCount]   = useState(2);
  const [autoUpdateAds, setAutoUpdateAds]     = useState(false);
  const [nthAd, setNthAd]                     = useState("3");
  const [minBuyAmount, setMinBuyAmount]       = useState("4500");
  const [minSellAmount, setMinSellAmount]     = useState("4500");
  const [minMargin, setMinMargin]             = useState("4");
  const [updateInterval, setUpdateInterval]   = useState("5");
  const [showAutoUpdateModal, setShowAutoUpdateModal] = useState(false);
  const [skipBadCounterparties, setSkipBadCounterparties] = useState(false);
  const [showMatchModal, setShowMatchModal]   = useState(false);
  const [showFeeModal, setShowFeeModal]       = useState(false);

  useEffect(() => {
    const s = settingsData?.settings; if (!s) return;
    setAutoPayment(s.auto_payment_enabled);    setAutoRelease(s.auto_release_enabled);
    setFeeEnabled(s.fee_enabled);              setFeeAmount(s.fee_amount ?? "");
    setMinFeeAmount(s.min_fee_amount ?? "");   setFeeMode(s.fee_mode);
    setNotifyNewOrders(s.notify_new_orders);   setNameMatchCount(s.name_match_count);
    setAutoUpdateAds(s.auto_update_ads_enabled); setNthAd(String(s.nth_ad ?? 3));
    setMinBuyAmount(String(s.min_buy_amount ?? 4500)); setMinSellAmount(String(s.min_sell_amount ?? 4500));
    setMinMargin(String(s.min_margin ?? 4));   setUpdateInterval(String(s.ads_update_interval_minutes ?? 5));
    setSkipBadCounterparties(s.skip_bad_counterparties ?? false);
  }, [settingsData]);

  const save = async (patch: Partial<P2PUserSettings>) => {
    try { await updateSettings(patch).unwrap(); }
    catch { showToast({ message: "Failed to save setting.", duration: 2500 }); }
  };
  const handleToggle = (field: keyof P2PUserSettings, value: boolean) => save({ [field]: value } as any);

  const handleDisconnect = async () => {
    try {
      await disconnectP2P().unwrap();
      showToast({ message: "Exchange disconnected successfully.", duration: 2000 });
      navigation.replace(SCREENS.P2P_INTRO);
    } catch (err: any) {
      showToast({ message: err?.data?.message ?? "Failed to disconnect.", duration: 3000 });
    }
  };

  if (isLoadingSettings) return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: BG }}>
      <ActivityIndicator size="large" color={BRAND} />
    </View>
  );

  return (
    <View style={[ss.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={ss.navBar}>
        <TouchableOpacity style={ss.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND_DARK} />
        </TouchableOpacity>
        <Text style={ss.navTitle}>P2P Settings</Text>
        {isUpdating ? <ActivityIndicator size={18} color={BRAND} /> : <View style={{ width: 36 }} />}
      </View>

      <ScrollView contentContainerStyle={ss.scroll} showsVerticalScrollIndicator={false}>

        {/* Auto Pilot */}
        <Text style={ss.sectionLabel}>Auto Pilot</Text>
        <View style={[ss.card, IOS_CARD]}>
          <SettingRow icon="lightning-bolt" iconBg="#FFFBEB" iconColor="#D97706" title="Auto-Payment" sub="Pay buy orders from BinaPay wallet">
            <Switch value={autoPayment} onValueChange={val => { setAutoPayment(val); handleToggle("auto_payment_enabled", val); }} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
          </SettingRow>
          <View style={ss.hairline} />
          <SettingRow icon="send-outline" iconBg="#F0FDF4" iconColor="#16A34A" title="Auto-Release" sub="Automatically release sell orders">
            <Switch value={autoRelease} onValueChange={val => { setAutoRelease(val); handleToggle("auto_release_enabled", val); }} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
          </SettingRow>
        </View>

        {/* Preferences */}
        <Text style={ss.sectionLabel}>Preferences</Text>
        <View style={[ss.card, IOS_CARD]}>
          <SettingRow icon="bell-outline" iconBg={BLUE_LIGHT} iconColor={BRAND} title="Order Notifications" sub="Push alerts for new P2P orders">
            <Switch value={notifyNewOrders} onValueChange={val => { setNotifyNewOrders(val); handleToggle("notify_new_orders", val); }} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
          </SettingRow>
          <View style={ss.hairline} />
          <SettingRow icon="percent-outline" iconBg="#F0FDF4" iconColor="#16A34A" title="Charge Platform Fee"
            sub={feeEnabled ? `₦${feeAmount || "0"} — ${feeMode === "auto" ? "Auto deduct" : "Require confirmation"}` : "Pay full amount to counterparty"}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Switch value={feeEnabled} onValueChange={val => { setFeeEnabled(val); handleToggle("fee_enabled", val); }} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
              {feeEnabled && (
                <TouchableOpacity onPress={() => setShowFeeModal(true)} style={ss.editBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={BRAND} />
                </TouchableOpacity>
              )}
            </View>
          </SettingRow>
          <View style={ss.hairline} />
          <SettingRow icon="shield-alert-outline" iconBg="#FEF2F2" iconColor="#DC2626" title="Skip Bad Counterparties"
            sub={skipBadCounterparties ? "Flagged counterparties will be rejected" : "All counterparties will be processed"}>
            <Switch value={skipBadCounterparties} onValueChange={val => { setSkipBadCounterparties(val); handleToggle("skip_bad_counterparties", val); }} trackColor={{ false: "#D1D5DB", true: "#DC2626" }} thumbColor={SURFACE} />
          </SettingRow>
          <View style={ss.hairline} />
          <TouchableOpacity style={ss.chevronRow} onPress={() => setShowMatchModal(true)} activeOpacity={0.7}>
            <View style={[ss.iconBox, { backgroundColor: BLUE_LIGHT }]}>
              <MaterialCommunityIcons name="swap-horizontal" size={20} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.rowTitle}>Match Sell Orders</Text>
              <Text style={ss.rowSub}>{nameMatchCount} name token{nameMatchCount > 1 ? "s" : ""} must match</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
          </TouchableOpacity>
          <View style={ss.hairline} />
          <TouchableOpacity style={ss.chevronRow} onPress={() => navigation.navigate(SCREENS.P2P_MESSAGE_TEMPLATES as any)} activeOpacity={0.7}>
            <View style={[ss.iconBox, { backgroundColor: BLUE_LIGHT }]}>
              <MaterialCommunityIcons name="message-text-outline" size={20} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.rowTitle}>Message Templates</Text>
              <Text style={ss.rowSub}>Auto messages, confirmation words and fee settings</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
          </TouchableOpacity>
        </View>

        {/* Auto Update Ads */}
        <Text style={ss.sectionLabel}>Auto Update Ads</Text>
        <View style={[ss.card, IOS_CARD]}>
          <SettingRow icon="refresh-auto" iconBg="#F0FDF4" iconColor="#16A34A" title="Auto-Update Prices" sub="Automatically update your ad prices">
            <Switch value={autoUpdateAds} onValueChange={val => { setAutoUpdateAds(val); handleToggle("auto_update_ads_enabled", val); }} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
          </SettingRow>
          <View style={ss.hairline} />
          <TouchableOpacity style={ss.chevronRow} onPress={() => setShowAutoUpdateModal(true)} activeOpacity={0.7}>
            <View style={[ss.iconBox, { backgroundColor: BLUE_LIGHT }]}>
              <MaterialCommunityIcons name="tune" size={20} color={BRAND} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={ss.rowTitle}>Configure Parameters</Text>
              <Text style={ss.rowSub}>Nth ad: {nthAd} · Interval: {updateInterval}m · Margin: ₦{minMargin}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
          </TouchableOpacity>
        </View>

        {/* Account */}
        <Text style={ss.sectionLabel}>Account</Text>
        <View style={[ss.card, IOS_CARD]}>
          <TouchableOpacity style={ss.chevronRow} onPress={handleDisconnect} disabled={isDisconnecting} activeOpacity={0.7}>
            <View style={[ss.iconBox, { backgroundColor: "#FEF2F2" }]}>
              {isDisconnecting
                ? <ActivityIndicator size={18} color="#DC2626" />
                : <MaterialCommunityIcons name="link-variant-off" size={20} color="#DC2626" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[ss.rowTitle, { color: "#DC2626" }]}>Disconnect Exchange</Text>
              <Text style={ss.rowSub}>Remove your Bybit API connection</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />
          </TouchableOpacity>
        </View>

        {statusData?.connected && (
          <View style={[ss.connectedBadge, IOS_CARD]}>
            <View style={ss.connectedDot} />
            <View style={ss.exchangeCircle}>
              <Text style={ss.exchangeCircleText}>{statusData.exchange?.toUpperCase().slice(0, 5)}</Text>
            </View>
            <Text style={ss.connectedText}>{statusData.exchange?.charAt(0).toUpperCase() + (statusData.exchange?.slice(1) ?? "")}</Text>
            <Text style={ss.connectedStatus}>Connected</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Fee modal ── */}
      <Modal visible={showFeeModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { paddingBottom: insets.bottom + 20 }, IOS_SHEET]}>
            <View style={ss.sheetHandle} />
            <Text style={ss.modalTitle}>Fee Preference</Text>
            <Text style={ss.modalLabel}>Fee amount (₦)</Text>
            <TextInput style={ss.modalInput} value={feeAmount} onChangeText={setFeeAmount} keyboardType="numeric" placeholder="e.g. 100" placeholderTextColor={PLACEHOLDER} />
            <Text style={ss.modalLabel}>Minimum acceptable fee (₦)</Text>
            <Text style={ss.modalHint}>If counterparty declines your fee, this is the fallback amount.</Text>
            <TextInput style={ss.modalInput} value={minFeeAmount} onChangeText={setMinFeeAmount} keyboardType="numeric" placeholder="e.g. 50" placeholderTextColor={PLACEHOLDER} />
            <Text style={ss.modalLabel}>Deduction mode</Text>
            <View style={ss.modeRow}>
              {(["auto", "require_word"] as const).map(m => (
                <TouchableOpacity key={m} style={[ss.modeBtn, feeMode === m && ss.modeBtnActive]} onPress={() => setFeeMode(m)} activeOpacity={0.8}>
                  <Text style={[ss.modeBtnText, feeMode === m && { color: BRAND }]}>{m === "auto" ? "Auto deduct" : "Require confirmation"}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={ss.modalHint}>{feeMode === "auto" ? "Fee is deducted automatically." : "Fee deducted after counterparty confirms in chat."}</Text>
            <View style={ss.modalActions}>
              <TouchableOpacity style={ss.modalCancel} onPress={() => setShowFeeModal(false)} activeOpacity={0.8}>
                <Text style={ss.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ss.modalSave} activeOpacity={0.85} onPress={async () => {
                await save({ fee_amount: feeAmount || null, min_fee_amount: minFeeAmount || null, fee_mode: feeMode });
                setShowFeeModal(false); showToast({ message: "Fee preference saved.", duration: 1500 });
              }}>
                <Text style={ss.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Match modal ── */}
      <Modal visible={showMatchModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { paddingBottom: insets.bottom + 20 }, IOS_SHEET]}>
            <View style={ss.sheetHandle} />
            <Text style={ss.modalTitle}>Match Sell Orders</Text>
            <Text style={ss.modalHint}>How many name tokens must match between sender and buyer?</Text>
            {[1, 2, 3].map((count) => (
              <TouchableOpacity key={count} style={[ss.matchOption, nameMatchCount === count && ss.matchOptionActive]}
                onPress={() => setNameMatchCount(count)} activeOpacity={0.8}>
                <View style={[ss.matchRadio, nameMatchCount === count && ss.matchRadioActive]} />
                <View>
                  <Text style={[ss.matchTitle, nameMatchCount === count && { color: BRAND }]}>
                    {count === 1 ? "1 token (loose)" : count === 2 ? "2 tokens (recommended)" : "3 tokens (strict)"}
                  </Text>
                  <Text style={ss.matchSub}>{count === 1 ? "Any single word matches" : count === 2 ? "Two words must match" : "Three words must match"}</Text>
                </View>
              </TouchableOpacity>
            ))}
            <View style={ss.modalActions}>
              <TouchableOpacity style={ss.modalCancel} onPress={() => setShowMatchModal(false)} activeOpacity={0.8}>
                <Text style={ss.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ss.modalSave} activeOpacity={0.85} onPress={async () => {
                await save({ name_match_count: nameMatchCount }); setShowMatchModal(false);
                showToast({ message: "Match preference saved.", duration: 1500 });
              }}>
                <Text style={ss.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Auto Update modal ── */}
      <Modal visible={showAutoUpdateModal} transparent animationType="slide">
        <View style={ss.modalOverlay}>
          <View style={[ss.modalCard, { paddingBottom: insets.bottom + 20 }, IOS_SHEET]}>
            <View style={ss.sheetHandle} />
            <Text style={ss.modalTitle}>Auto Update Config</Text>
            {[
              { label: "Reference Ad Position (Nth)", hint: "1 = best price, 3 = 3rd best, etc.", val: nthAd, set: setNthAd, ph: "3" },
              { label: "Min Buy Amount (₦)",          hint: null,                                   val: minBuyAmount, set: setMinBuyAmount, ph: "4500" },
              { label: "Min Sell Amount (₦)",         hint: null,                                   val: minSellAmount, set: setMinSellAmount, ph: "4500" },
              { label: "Minimum Margin (₦)",          hint: "If spread < this, ads won't update.",  val: minMargin, set: setMinMargin, ph: "4" },
              { label: "Update Interval (minutes)",   hint: "Minimum 1 minute.",                    val: updateInterval, set: setUpdateInterval, ph: "5" },
            ].map(f => (
              <React.Fragment key={f.label}>
                <Text style={ss.modalLabel}>{f.label}</Text>
                {f.hint && <Text style={ss.modalHint}>{f.hint}</Text>}
                <TextInput style={ss.modalInput} value={f.val} onChangeText={f.set} keyboardType="numeric" placeholder={f.ph} placeholderTextColor={PLACEHOLDER} />
              </React.Fragment>
            ))}
            <View style={ss.modalActions}>
              <TouchableOpacity style={ss.modalCancel} onPress={() => setShowAutoUpdateModal(false)} activeOpacity={0.8}>
                <Text style={ss.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ss.modalSave} activeOpacity={0.85} onPress={async () => {
                const interval = Math.max(1, parseInt(updateInterval) || 5);
                await save({ nth_ad: parseInt(nthAd)||3, min_buy_amount: parseFloat(minBuyAmount)||4500, min_sell_amount: parseFloat(minSellAmount)||4500, min_margin: parseFloat(minMargin)||4, ads_update_interval_minutes: interval });
                setUpdateInterval(String(interval)); setShowAutoUpdateModal(false);
                showToast({ message: "Auto-update config saved.", duration: 1500 });
              }}>
                <Text style={ss.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function SettingRow({ icon, iconBg, iconColor, title, sub, children }: any) {
  return (
    <View style={ss.settingRow}>
      <View style={[ss.iconBox, { backgroundColor: iconBg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ss.rowTitle}>{title}</Text>
        <Text style={ss.rowSub}>{sub}</Text>
      </View>
      {children}
    </View>
  );
}

const ss = StyleSheet.create({
  root:           { flex: 1, backgroundColor: BG },
  navBar:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:       { fontSize: 16, fontWeight: "700", color: BRAND_DARK, letterSpacing: -0.3 },
  scroll:         { padding: 16, gap: 6, paddingBottom: 40 },
  sectionLabel:   { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, paddingLeft: 4, marginTop: 10, marginBottom: 6 },
  card:           { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  hairline:       { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 66 },
  settingRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  chevronRow:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  iconBox:        { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  rowTitle:       { fontSize: 14, fontWeight: "600", color: LABEL, marginBottom: 2 },
  rowSub:         { fontSize: 12, color: SUBLABEL },
  editBtn:        { padding: 4 },
  connectedBadge: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginTop: 8 },
  connectedDot:   { width: 8, height: 8, borderRadius: 4, backgroundColor: "#16A34A" },
  exchangeCircle: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#0A0F1E", justifyContent: "center", alignItems: "center" },
  exchangeCircleText: { color: SURFACE, fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  connectedText:  { flex: 1, fontSize: 14, fontWeight: "700", color: LABEL },
  connectedStatus:{ fontSize: 13, fontWeight: "600", color: "#16A34A" },
  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalCard:      { backgroundColor: SURFACE, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  sheetHandle:    { width: 40, height: 4, borderRadius: 2, backgroundColor: SEPARATOR, alignSelf: "center", marginBottom: 12 },
  modalTitle:     { fontSize: 18, fontWeight: "700", color: BRAND_DARK, marginBottom: 4 },
  modalLabel:     { fontSize: 13, fontWeight: "600", color: SUBLABEL },
  modalHint:      { fontSize: 12, color: PLACEHOLDER, lineHeight: 18, marginTop: -6 },
  modalInput:     { borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 14, color: LABEL },
  modeRow:        { flexDirection: "row", gap: 10 },
  modeBtn:        { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: SEPARATOR, alignItems: "center" },
  modeBtnActive:  { borderColor: BRAND, backgroundColor: BLUE_LIGHT },
  modeBtnText:    { fontSize: 13, fontWeight: "600", color: SUBLABEL },
  modalActions:   { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel:    { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: SEPARATOR, alignItems: "center" },
  modalCancelText:{ fontSize: 15, fontWeight: "700", color: SUBLABEL },
  modalSave:      { flex: 1.5, paddingVertical: 14, borderRadius: 14, backgroundColor: BRAND, alignItems: "center" },
  modalSaveText:  { fontSize: 15, fontWeight: "700", color: SURFACE },
  matchOption:    { borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 12, padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  matchOptionActive: { borderColor: BRAND, backgroundColor: BLUE_LIGHT },
  matchRadio:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#D1D5DB", marginTop: 2 },
  matchRadioActive: { borderColor: BRAND, backgroundColor: BRAND },
  matchTitle:     { fontSize: 14, fontWeight: "700", color: LABEL, marginBottom: 2 },
  matchSub:       { fontSize: 12, color: SUBLABEL },
});
