import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  ActivityIndicator,
  TextInput,
  Modal,
   KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useGetP2PStatusQuery,
  useDisconnectP2PMutation,
  useGetUserP2PSettingsQuery,
  useUpdateUserP2PSettingsMutation,
  P2PUserSettings,
} from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";

type Props = P2PStackScreenProps<"P2P Settings">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

export default function P2PSettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const { data: statusData } = useGetP2PStatusQuery();
  const { data: settingsData, isLoading: isLoadingSettings } = useGetUserP2PSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateUserP2PSettingsMutation();
  const [disconnectP2P, { isLoading: isDisconnecting }] = useDisconnectP2PMutation();
  
  // ── Local state ──────────────────────────────────────────────────────────
  const [autoPayment, setAutoPayment] = useState(false);
  const [autoRelease, setAutoRelease] = useState(false);
  const [feeEnabled, setFeeEnabled]   = useState(false);
  const [feeAmount, setFeeAmount]     = useState("");
  const [minFeeAmount, setMinFeeAmount] = useState("");
  const [feeMode, setFeeMode]         = useState<"auto" | "require_word">("require_word");
  const [notifyNewOrders, setNotifyNewOrders] = useState(true);
  const [nameMatchCount, setNameMatchCount]   = useState(2);
  // ── Auto Update Ads state ────────────────────────────────────────────────
const [autoUpdateAds, setAutoUpdateAds]       = useState(false);
const [nthAd, setNthAd]                       = useState("3");
const [minBuyAmount, setMinBuyAmount]         = useState("4500");
const [minSellAmount, setMinSellAmount]       = useState("4500");
const [minMargin, setMinMargin]               = useState("4");
const [updateInterval, setUpdateInterval]     = useState("5");
const [showAutoUpdateModal, setShowAutoUpdateModal] = useState(false);
const [skipBadCounterparties, setSkipBadCounterparties] = useState(false);


  // ── Modals ───────────────────────────────────────────────────────────────
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showFeeModal, setShowFeeModal]     = useState(false);

  // ── Sync from backend ────────────────────────────────────────────────────
  useEffect(() => {
    const s = settingsData?.settings;
    if (!s) return;
    setAutoPayment(s.auto_payment_enabled);
    setAutoRelease(s.auto_release_enabled);
    setFeeEnabled(s.fee_enabled);
    setFeeAmount(s.fee_amount ?? "");
    setMinFeeAmount(s.min_fee_amount ?? "");
    setFeeMode(s.fee_mode);
    setNotifyNewOrders(s.notify_new_orders);
    setNameMatchCount(s.name_match_count);
    setAutoUpdateAds(s.auto_update_ads_enabled);
    setNthAd(String(s.nth_ad ?? 3));
    setMinBuyAmount(String(s.min_buy_amount ?? 4500));
    setMinSellAmount(String(s.min_sell_amount ?? 4500));
   setMinMargin(String(s.min_margin ?? 4));
   setUpdateInterval(String(s.ads_update_interval_minutes ?? 5));
   setSkipBadCounterparties(s.skip_bad_counterparties ?? false);
   
  }, [settingsData]);

  const save = async (patch: Partial<P2PUserSettings>) => {
    try {
      await updateSettings(patch).unwrap();
    } catch {
      showToast({ message: "Failed to save setting. Please try again.", duration: 2500 });
    }
  };

  const handleToggle = (field: keyof P2PUserSettings, value: boolean) => {
    save({ [field]: value } as any);
  };

  const handleDisconnect = async () => {
    try {
      await disconnectP2P().unwrap();
      showToast({ message: "Exchange disconnected successfully.", duration: 2000 });
      navigation.replace(SCREENS.P2P_INTRO);
    } catch (err: any) {
      showToast({
        message: err?.data?.message ?? "Failed to disconnect. Please try again.",
        duration: 3000,
      });
    }
  };

  if (isLoadingSettings) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F4F6FB" }}>
        <ActivityIndicator size="large" color={BRAND} />
      </View>
    );
  }

  

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableRipple onPress={() => navigation.goBack()} style={styles.backBtn} borderless>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableRipple>
        <Text style={styles.headerText}>P2P Settings</Text>
        {isUpdating
          ? <ActivityIndicator size={18} color={BRAND} />
          : <View style={{ width: 32 }} />}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Auto Pilot ── */}
        <Text style={styles.sectionLabel}>Auto Pilot</Text>
        <View style={styles.sectionCard}>
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: "#FFF8E7" }]}>
              <MaterialCommunityIcons name="lightning-bolt" size={20} color="#F5A623" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto-Payment</Text>
              <Text style={styles.settingSub}>Pay buy orders from BinaPay wallet</Text>
            </View>
            <Switch
              value={autoPayment}
              onValueChange={(val) => { setAutoPayment(val); handleToggle("auto_payment_enabled", val); }}
              trackColor={{ false: "#E0E0E0", true: BRAND }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
              <MaterialCommunityIcons name="send-outline" size={20} color="#2E7D32" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Auto-Release</Text>
              <Text style={styles.settingSub}>Automatically release sell orders</Text>
            </View>
            <Switch
              value={autoRelease}
              onValueChange={(val) => { setAutoRelease(val); handleToggle("auto_release_enabled", val); }}
              trackColor={{ false: "#E0E0E0", true: BRAND }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* ── Preferences ── */}
        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.sectionCard}>

          {/* Notifications */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: BRAND_LIGHT }]}>
              <MaterialCommunityIcons name="bell-outline" size={20} color={BRAND} />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Order Notifications</Text>
              <Text style={styles.settingSub}>Push alerts for new P2P orders</Text>
            </View>
            <Switch
              value={notifyNewOrders}
              onValueChange={(val) => { setNotifyNewOrders(val); handleToggle("notify_new_orders", val); }}
              trackColor={{ false: "#E0E0E0", true: BRAND }}
              thumbColor="#fff"
            />
          </View>
          <View style={styles.divider} />

          {/* Fee */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
              <MaterialCommunityIcons name="percent-outline" size={20} color="#2E7D32" />
            </View>
            <View style={styles.settingText}>
              <Text style={styles.settingTitle}>Charge Platform Fee</Text>
              <Text style={styles.settingSub}>
                {feeEnabled
                  ? `₦${feeAmount || "0"} — ${feeMode === "auto" ? "Auto deduct" : "Require confirmation"}`
                  : "Pay full amount to counterparty"}
              </Text>
            </View>
            <View style={styles.rowActions}>
              <Switch
                value={feeEnabled}
                onValueChange={(val) => { setFeeEnabled(val); handleToggle("fee_enabled", val); }}
                trackColor={{ false: "#E0E0E0", true: BRAND }}
                thumbColor="#fff"
              />
              {feeEnabled && (
                <TouchableRipple onPress={() => setShowFeeModal(true)} style={styles.editBtn} borderless>
                  <MaterialCommunityIcons name="pencil-outline" size={18} color={BRAND} />
                </TouchableRipple>
              )}
            </View>
          </View>

          <View style={styles.divider} />
      <View style={styles.settingRow}>
  <View style={[styles.iconBox, { backgroundColor: "#FFEBEE" }]}>
    <MaterialCommunityIcons name="shield-alert-outline" size={20} color="#E53935" />
  </View>
  <View style={styles.settingText}>
    <Text style={styles.settingTitle}>Skip Bad Counterparties</Text>
    <Text style={styles.settingSub}>
      {skipBadCounterparties
        ? "Flagged counterparties will be rejected automatically"
        : "All counterparties will be processed"}
    </Text>
  </View>
  <Switch
    value={skipBadCounterparties}
    onValueChange={(val) => {
      setSkipBadCounterparties(val);
      handleToggle("skip_bad_counterparties", val);
    }}
    trackColor={{ false: "#E0E0E0", true: "#E53935" }}
    thumbColor="#fff"
  />
   </View>
          <View style={styles.divider} />
              
          {/* Match Sell Orders */}
          <TouchableRipple style={styles.settingRow} onPress={() => setShowMatchModal(true)}>
            <View style={styles.settingRowInner}>
              <View style={[styles.iconBox, { backgroundColor: BRAND_LIGHT }]}>
                <MaterialCommunityIcons name="swap-horizontal" size={20} color={BRAND} />
              </View>
              <View style={styles.settingText}>
                <Text style={styles.settingTitle}>Match Sell Orders</Text>
                <Text style={styles.settingSub}>
                  {nameMatchCount} name token{nameMatchCount > 1 ? "s" : ""} must match
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
            </View>
          </TouchableRipple>
          <View style={styles.divider} />

        

        {/* ── Automation ── */}
{/* Message Templates */}
<TouchableRipple
  style={styles.settingRow}
  onPress={() => navigation.navigate(SCREENS.P2P_MESSAGE_TEMPLATES as any)}>
  <View style={styles.settingRowInner}>
    <View style={[styles.iconBox, { backgroundColor: BRAND_LIGHT }]}>
      <MaterialCommunityIcons name="message-text-outline" size={20} color={BRAND} />
    </View>
    <View style={styles.settingText}>
      <Text style={styles.settingTitle}>Message Templates</Text>
      <Text style={styles.settingSub}>Auto messages, confirmation words and fee settings</Text>
    </View>
    <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
  </View>
</TouchableRipple>
         </View>
         

         {/* ── Auto Update Ads ── */}
<Text style={styles.sectionLabel}>Auto Update Ads</Text>
<View style={styles.sectionCard}>

  {/* Master toggle */}
  <View style={styles.settingRow}>
    <View style={[styles.iconBox, { backgroundColor: "#E8F5E9" }]}>
      <MaterialCommunityIcons name="refresh-auto" size={20} color="#2E7D32" />
    </View>
    <View style={styles.settingText}>
      <Text style={styles.settingTitle}>Auto-Update Prices</Text>
      <Text style={styles.settingSub}>Automatically update your ad prices</Text>
    </View>
    <Switch
      value={autoUpdateAds}
      onValueChange={(val) => {
        setAutoUpdateAds(val);
        handleToggle("auto_update_ads_enabled", val);
      }}
      trackColor={{ false: "#E0E0E0", true: BRAND }}
      thumbColor="#fff"
    />
  </View>
  <View style={styles.divider} />

  {/* Configure button */}
  <TouchableRipple style={styles.settingRow} onPress={() => setShowAutoUpdateModal(true)}>
    <View style={styles.settingRowInner}>
      <View style={[styles.iconBox, { backgroundColor: BRAND_LIGHT }]}>
        <MaterialCommunityIcons name="tune" size={20} color={BRAND} />
      </View>
      <View style={styles.settingText}>
        <Text style={styles.settingTitle}>Configure Parameters</Text>
        <Text style={styles.settingSub}>
          Nth ad: {nthAd} · Interval: {updateInterval}m · Margin: ₦{minMargin}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
    </View>
  </TouchableRipple>
  <View style={styles.divider} />
</View>

        {/* ── Account ── */}
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.sectionCard}>
          <TouchableRipple
            style={styles.settingRow}
            onPress={handleDisconnect}
            disabled={isDisconnecting}>
            <View style={styles.settingRowInner}>
              <View style={[styles.iconBox, { backgroundColor: "#FFEBEE" }]}>
                {isDisconnecting
                  ? <ActivityIndicator size={18} color="#E53935" />
                  : <MaterialCommunityIcons name="link-variant-off" size={20} color="#E53935" />}
              </View>
              <View style={styles.settingText}>
                <Text style={[styles.settingTitle, { color: "#E53935" }]}>Disconnect Exchange</Text>
                <Text style={styles.settingSub}>Remove your Bybit API connection</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#CCC" />
            </View>
          </TouchableRipple>
        </View>

        {/* ── Connected badge ── */}
        {statusData?.connected && (
          <View style={styles.connectedBadge}>
            <View style={styles.connectedDot} />
            <View style={styles.exchangeCircle}>
              <Text style={styles.exchangeCircleText}>
                {statusData.exchange?.toUpperCase().slice(0, 5)}
              </Text>
            </View>
            <Text style={styles.connectedText}>
              {statusData.exchange?.charAt(0).toUpperCase() + (statusData.exchange?.slice(1) ?? "")}
            </Text>
            <Text style={styles.connectedStatus}>Connected</Text>
          </View>
        )}

      </ScrollView>

      {/* ── Fee modal ── */}
      <Modal visible={showFeeModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
           <TouchableWithoutFeedback onPress={() => {}}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fee Preference</Text>
            <Text style={styles.modalLabel}>Fee amount (₦)</Text>
            <TextInput
              style={styles.modalInput}
              value={feeAmount}
              onChangeText={setFeeAmount}
              keyboardType="numeric"
              placeholder="e.g. 100"
              placeholderTextColor="#BBB"
            />
            {/* ── Add this ── */}
<Text style={styles.modalLabel}>Minimum acceptable fee (₦)</Text>
<Text style={styles.modalHint}>
  If counterparty declines your fee, this is the fallback amount you'll request.
</Text>
<TextInput
  style={styles.modalInput}
  value={minFeeAmount}
  onChangeText={setMinFeeAmount}
  keyboardType="numeric"
  placeholder="e.g. 50"
  placeholderTextColor="#BBB"
/>

            <Text style={styles.modalLabel}>Deduction mode</Text>
            <View style={styles.modeRow}>
              <TouchableRipple
                style={[styles.modeBtn, feeMode === "auto" && styles.modeBtnActive]}
                onPress={() => setFeeMode("auto")}>
                <Text style={[styles.modeBtnText, feeMode === "auto" && styles.modeBtnTextActive]}>
                  Auto deduct
                </Text>
              </TouchableRipple>
              <TouchableRipple
                style={[styles.modeBtn, feeMode === "require_word" && styles.modeBtnActive]}
                onPress={() => setFeeMode("require_word")}>
                <Text style={[styles.modeBtnText, feeMode === "require_word" && styles.modeBtnTextActive]}>
                  Require confirmation
                </Text>
              </TouchableRipple>
            </View>
            <Text style={styles.modalHint}>
              {feeMode === "auto"
                ? "Fee is deducted automatically before payment is sent."
                : "Fee is only deducted after counterparty confirms in chat."}
            </Text>
            <View style={styles.modalActions}>
              <TouchableRipple style={styles.modalCancel} onPress={() => setShowFeeModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.modalSave}
                onPress={async () => {
                  await save({ fee_amount: feeAmount || null, min_fee_amount: minFeeAmount || null, fee_mode: feeMode });
                  setShowFeeModal(false);
                  showToast({ message: "Fee preference saved.", duration: 1500 });
                }}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableRipple>
            </View>
          </View>
           </TouchableWithoutFeedback>
        </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ── Match preferences modal ── */}
      <Modal visible={showMatchModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Match Sell Orders</Text>
            <Text style={styles.modalHint}>
              How many name tokens must match between the sender name on your BinaPay account and the buyer's name on Bybit?
            </Text>
            {[1, 2, 3].map((count) => (
              <TouchableRipple
                key={count}
                style={[styles.matchOption, nameMatchCount === count && styles.matchOptionActive]}
                onPress={() => setNameMatchCount(count)}>
                <View style={styles.matchOptionInner}>
                  <View style={[styles.matchRadio, nameMatchCount === count && styles.matchRadioActive]} />
                  <View>
                    <Text style={[styles.matchOptionTitle, nameMatchCount === count && { color: BRAND }]}>
                      {count === 1 ? "1 token (loose)" : count === 2 ? "2 tokens (recommended)" : "3 tokens (strict)"}
                    </Text>
                    <Text style={styles.matchOptionSub}>
                      {count === 1
                        ? "Any single word from the name matches"
                        : count === 2
                        ? "Two words from the name must match"
                        : "Three words from the name must match"}
                    </Text>
                  </View>
                </View>
              </TouchableRipple>
            ))}
            <View style={styles.modalActions}>
              <TouchableRipple style={styles.modalCancel} onPress={() => setShowMatchModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableRipple>
              <TouchableRipple
                style={styles.modalSave}
                onPress={async () => {
                  await save({ name_match_count: nameMatchCount });
                  setShowMatchModal(false);
                  showToast({ message: "Match preference saved.", duration: 1500 });
                }}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableRipple>
            </View>
          </View>
        </View>
      </Modal>

{/* ── Auto Update Config Modal ── */}
<Modal visible={showAutoUpdateModal} transparent animationType="slide">
  <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
    <View style={styles.modalOverlay}>
      <TouchableWithoutFeedback onPress={() => {}}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Auto Update Config</Text>
          
          <ScrollView 
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={{ maxHeight: 500 }}
          >
            <Text style={styles.modalLabel}>Reference Ad Position (Nth)</Text>
            <Text style={styles.modalHint}>
              Which competitor's price to reference. 1 = best price, 3 = 3rd best, etc.
            </Text>
            <TextInput style={styles.modalInput} value={nthAd} onChangeText={setNthAd} keyboardType="numeric" placeholder="3" placeholderTextColor="#BBB" />

            <Text style={[styles.modalLabel, { marginTop: 8 }]}>Min Buy Amount (₦)</Text>
            <TextInput style={styles.modalInput} value={minBuyAmount} onChangeText={setMinBuyAmount} keyboardType="numeric" placeholder="4500" placeholderTextColor="#BBB" />

            <Text style={[styles.modalLabel, { marginTop: 8 }]}>Min Sell Amount (₦)</Text>
            <TextInput style={styles.modalInput} value={minSellAmount} onChangeText={setMinSellAmount} keyboardType="numeric" placeholder="4500" placeholderTextColor="#BBB" />

            <Text style={[styles.modalLabel, { marginTop: 8 }]}>Minimum Margin (₦)</Text>
            <Text style={styles.modalHint}>If the spread between buy and sell is less than this, ads won't update.</Text>
            <TextInput style={styles.modalInput} value={minMargin} onChangeText={setMinMargin} keyboardType="numeric" placeholder="4" placeholderTextColor="#BBB" />

            <Text style={[styles.modalLabel, { marginTop: 8 }]}>Update Interval (minutes)</Text>
            <Text style={styles.modalHint}>Minimum 1 minute. How often to update your ad prices.</Text>
            <TextInput style={styles.modalInput} value={updateInterval} onChangeText={setUpdateInterval} keyboardType="numeric" placeholder="5" placeholderTextColor="#BBB" />
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableRipple style={styles.modalCancel} onPress={() => { Keyboard.dismiss(); setShowAutoUpdateModal(false); }}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableRipple>
            <TouchableRipple
              style={styles.modalSave}
              onPress={async () => {
                Keyboard.dismiss();
                const interval = Math.max(1, parseInt(updateInterval) || 5);
                await save({
                  nth_ad:                      parseInt(nthAd) || 3,
                  min_buy_amount:              parseFloat(minBuyAmount) || 4500,
                  min_sell_amount:             parseFloat(minSellAmount) || 4500,
                  min_margin:                  parseFloat(minMargin) || 4,
                  ads_update_interval_minutes: interval,
                });
                setUpdateInterval(String(interval));
                setShowAutoUpdateModal(false);
                showToast({ message: "Auto-update config saved.", duration: 1500 });
              }}>
              <Text style={styles.modalSaveText}>Save & Preview</Text>
            </TouchableRipple>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
</Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FB" },
  header: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1, borderBottomColor: "#EFEFEF",
  },
  backBtn: { padding: 4, borderRadius: 20 },
  headerText: { fontSize: 16, fontWeight: "800", color: "#111" },
  scroll: { padding: 16, gap: 8, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 12, fontWeight: "700", color: "#888",
    textTransform: "uppercase", letterSpacing: 0.6,
    paddingLeft: 4, marginTop: 8, marginBottom: 4,
  },
  sectionCard: {
    backgroundColor: "#fff", borderRadius: 16,
    borderWidth: 1, borderColor: "#E8EEF9", overflow: "hidden",
  },
  settingRow: {
    paddingHorizontal: 14, paddingVertical: 12,
    flexDirection: "row", alignItems: "center", gap: 12,
  },
  settingRowInner: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  settingText: { flex: 1 },
  settingTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  settingSub: { fontSize: 12, color: "#888" },
  divider: { height: 1, backgroundColor: "#F0F4FB", marginLeft: 66 },
  rowActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  editBtn: { padding: 4, borderRadius: 16 },
  connectedBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fff", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#E8EEF9", marginTop: 8,
  },
  connectedDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#2E7D32" },
  exchangeCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#0A0F1E",
    justifyContent: "center", alignItems: "center",
  },
  exchangeCircleText: { color: "#fff", fontSize: 7, fontWeight: "800", letterSpacing: 0.5 },
  connectedText: { flex: 1, fontSize: 14, fontWeight: "700", color: "#111" },
  connectedStatus: { fontSize: 13, fontWeight: "600", color: "#2E7D32" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  modalCard: {
    backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#111", marginBottom: 4 },
  modalLabel: { fontSize: 13, fontWeight: "700", color: "#555" },
  modalHint: { fontSize: 12, color: "#888", lineHeight: 18 },
  modalInput: {
    borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: "#111",
  },
  modeRow: { flexDirection: "row", gap: 10 },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: "#E8EEF9", alignItems: "center",
  },
  modeBtnActive: { borderColor: BRAND, backgroundColor: BRAND_LIGHT },
  modeBtnText: { fontSize: 13, fontWeight: "600", color: "#888" },
  modeBtnTextActive: { color: BRAND },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  modalCancel: {
    flex: 1, paddingVertical: 14, borderRadius: 30,
    borderWidth: 1.5, borderColor: "#D0D9EE", alignItems: "center",
  },
  modalCancelText: { fontSize: 15, fontWeight: "700", color: "#555" },
  modalSave: { flex: 1.5, paddingVertical: 14, borderRadius: 30, backgroundColor: BRAND, alignItems: "center" },
  modalSaveText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  matchOption: {
    borderWidth: 1.5, borderColor: "#E8EEF9", borderRadius: 12, padding: 12,
  },
  matchOptionActive: { borderColor: BRAND, backgroundColor: BRAND_LIGHT },
  matchOptionInner: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  matchRadio: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: "#CCC", marginTop: 2,
  },
  matchRadioActive: { borderColor: BRAND, backgroundColor: BRAND },
  matchOptionTitle: { fontSize: 14, fontWeight: "700", color: "#111", marginBottom: 2 },
  matchOptionSub: { fontSize: 12, color: "#888" },
});
