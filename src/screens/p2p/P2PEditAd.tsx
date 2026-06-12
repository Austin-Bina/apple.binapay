// ═══════════════════════════════════════════════════════════════════════════
// P2PEditAdScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState } from "react";
import {
  View, StyleSheet, ScrollView, ActivityIndicator, TextInput,
  TouchableOpacity, Switch, Platform, StatusBar, KeyboardAvoidingView,
} from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { useUpdateP2PAdMutation, useGetP2PPaymentMethodsQuery, P2PAd } from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";

type EditProps = P2PStackScreenProps<"P2P Edit Ad">;

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
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

export default function P2PEditAdScreen({ navigation, route }: EditProps) {
  const insets = useSafeAreaInsets();
  const { ad } = route.params as { ad: P2PAd };

  // ── All original state — untouched ────────────────────────────────────────
  const [price, setPrice]           = useState(ad.price ?? "");
  const [minAmount, setMinAmount]   = useState(ad.min_amount ?? "");
  const [maxAmount, setMaxAmount]   = useState(ad.max_amount ?? "");
  const [quantity, setQuantity]     = useState(ad.quantity ?? "");
  const [remark, setRemark]         = useState(ad.remark ?? "");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>(ad.payment_ids ?? []);
  const [prefKyc, setPrefKyc]       = useState(ad.trading_pref_kyc ?? true);
  const [prefMinOrders, setPrefMinOrders] = useState(String(ad.trading_pref_min_orders ?? 5));
  const [prefNoUnposted, setPrefNoUnposted] = useState(ad.trading_pref_no_unposted_ad ?? true);
  const [paymentPeriod, setPaymentPeriod] = useState(ad.payment_period ?? "15");

  const { data: pmData, isLoading: isLoadingPM } = useGetP2PPaymentMethodsQuery();
  const [updateAd, { isLoading: isUpdating }]    = useUpdateP2PAdMutation();
  const paymentMethods = pmData?.payment_methods ?? [];

  const togglePaymentMethod = (id: string) => {
    setSelectedPaymentIds(prev => prev.indexOf(id) !== -1 ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const handleSave = async () => {
    if (!price || !minAmount || !maxAmount || !quantity) {
      showToast({ message: "Please fill all required fields.", duration: 2500 }); return;
    }
    if (selectedPaymentIds.length === 0) {
      showToast({ message: "Please select at least one payment method.", duration: 2500 }); return;
    }
    try {
      await updateAd({
        adId: ad.id, price: parseFloat(price), min_amount: parseFloat(minAmount),
        max_amount: parseFloat(maxAmount), quantity: parseFloat(quantity),
        payment_ids: selectedPaymentIds, remark,
        payment_period: paymentPeriod, trading_pref_kyc: prefKyc,
        trading_pref_min_orders: parseInt(prefMinOrders) || 5,
        trading_pref_no_unposted_ad: prefNoUnposted,
      }).unwrap();
      showToast({ message: "Ad updated successfully.", duration: 2000 });
      navigation.goBack();
    } catch (err: any) {
      showToast({ message: err?.data?.message ?? "Failed to update ad.", duration: 3000 });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[es.root, { paddingBottom: insets.bottom }]}>
        <StatusBar barStyle="dark-content" />

        {/* Nav */}
        <View style={[es.navBar, { paddingTop: insets.top + 6 }]}>
          <TouchableOpacity style={es.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND_DARK} />
          </TouchableOpacity>
          <Text style={es.navTitle}>Edit Ad</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={es.scroll} showsVerticalScrollIndicator={false}>
          {/* Ad info pill */}
          <View style={es.infoPill}>
            <View style={[es.sideBadge, { backgroundColor: ad.side === "Buy" ? "#F0FDF4" : BLUE_LIGHT }]}>
              <Text style={[es.sideBadgeText, { color: ad.side === "Buy" ? "#16A34A" : BRAND }]}>{ad.side}</Text>
            </View>
            <Text style={es.infoPillText}>{ad.token}/{ad.currency}</Text>
          </View>

          {/* Price & Quantity */}
          <Text style={es.sectionLabel}>Price &amp; Quantity</Text>
          <View style={[es.iosCard, IOS_CARD]}>
            <EField label="Price (₦)"         value={price}     onChangeText={setPrice}     />
            <View style={es.hairline} />
            <EField label="Quantity (USDT)"    value={quantity}  onChangeText={setQuantity}  />
            <View style={es.hairline} />
            <EField label="Min Amount (₦)"    value={minAmount} onChangeText={setMinAmount} />
            <View style={es.hairline} />
            <EField label="Max Amount (₦)"    value={maxAmount} onChangeText={setMaxAmount} />
          </View>

          {/* Payment Period */}
          <Text style={es.sectionLabel}>Payment Period</Text>
          <View style={[es.iosCard, IOS_CARD]}>
            {["15", "30"].map((opt, i) => (
              <React.Fragment key={opt}>
                {i > 0 && <View style={es.hairline} />}
                <TouchableOpacity style={es.radioRow} onPress={() => setPaymentPeriod(opt)} activeOpacity={0.7}>
                  <Text style={es.radioLabel}>{opt} minutes</Text>
                  <View style={[es.radio, paymentPeriod === opt && es.radioActive]}>
                    {paymentPeriod === opt && <View style={es.radioDot} />}
                  </View>
                </TouchableOpacity>
              </React.Fragment>
            ))}
          </View>

          {/* Trading Preferences */}
          <Text style={es.sectionLabel}>Trading Preferences</Text>
          <View style={[es.iosCard, IOS_CARD]}>
            <View style={es.prefRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={es.prefLabel}>KYC Verified Only</Text>
                <Text style={es.prefSub}>Only trade with verified buyers</Text>
              </View>
              <Switch value={prefKyc} onValueChange={setPrefKyc} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
            </View>
            <View style={es.hairline} />
            <View style={es.prefRow}>
              <View style={{ flex: 1, marginRight: 12 }}>
                <Text style={es.prefLabel}>No Unposted Ad</Text>
                <Text style={es.prefSub}>Require counterparty to have active ads</Text>
              </View>
              <Switch value={prefNoUnposted} onValueChange={setPrefNoUnposted} trackColor={{ false: "#D1D5DB", true: BRAND }} thumbColor={SURFACE} />
            </View>
            <View style={es.hairline} />
            <View style={es.prefRow}>
              <Text style={es.prefLabel}>Min Completed Orders (30d)</Text>
              <TextInput style={es.prefNumInput} value={prefMinOrders} onChangeText={setPrefMinOrders} keyboardType="numeric" placeholder="5" placeholderTextColor={PLACEHOLDER} />
            </View>
          </View>

          {/* Remark */}
          <Text style={es.sectionLabel}>Remark</Text>
          <View style={[es.iosCard, IOS_CARD]}>
            <TextInput style={es.remarkInput} value={remark} onChangeText={setRemark}
              placeholder="Optional remark for buyers…" placeholderTextColor={PLACEHOLDER} multiline maxLength={200} />
          </View>

          {/* Payment Methods */}
          <Text style={es.sectionLabel}>Payment Methods</Text>
          {isLoadingPM ? (
            <View style={es.pmLoading}>
              <ActivityIndicator size="small" color={BRAND} />
              <Text style={es.pmLoadingText}>Loading…</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={[es.iosCard, IOS_CARD]}>
              <Text style={es.pmEmpty}>No payment methods found on your Bybit account.</Text>
            </View>
          ) : (
            <View style={[es.iosCard, IOS_CARD]}>
              {paymentMethods.map((pm, i) => {
                const selected = selectedPaymentIds.indexOf(pm.id) !== -1;
                return (
                  <React.Fragment key={pm.id}>
                    {i > 0 && <View style={es.hairline} />}
                    <TouchableOpacity style={es.pmRow} onPress={() => togglePaymentMethod(pm.id)} activeOpacity={0.7}>
                      <View style={{ flex: 1 }}>
                        <Text style={es.pmName}>{pm.payment_name}</Text>
                        <Text style={es.pmDetail}>{pm.account_no}{pm.real_name ? ` · ${pm.real_name}` : ""}</Text>
                      </View>
                      <View style={[es.checkbox, selected && es.checkboxSelected]}>
                        {selected && <MaterialCommunityIcons name="check" size={14} color={SURFACE} />}
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          )}
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* Footer */}
        <View style={[es.footer, { paddingBottom: insets.bottom + 8 }, IOS_SHEET]}>
          <TouchableOpacity style={[es.saveBtn, isUpdating && es.disabledBtn]} onPress={handleSave} disabled={isUpdating} activeOpacity={0.85}>
            {isUpdating
              ? <ActivityIndicator size={18} color={SURFACE} />
              : <MaterialCommunityIcons name="check-circle-outline" size={18} color={SURFACE} />}
            <Text style={es.saveBtnText}>{isUpdating ? "Saving…" : "Save Changes"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function EField({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={es.fieldRow}>
      <Text style={es.fieldLabel}>{label}</Text>
      <TextInput style={es.fieldInput} value={value} onChangeText={onChangeText} keyboardType="numeric" placeholder="0" placeholderTextColor={PLACEHOLDER} />
    </View>
  );
}

const es = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  navBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingBottom: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:     { fontSize: 16, fontWeight: "700", color: BRAND_DARK },
  scroll:       { padding: 16, gap: 6, paddingBottom: 24 },
  sectionLabel: { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginTop: 10, marginBottom: 6, marginLeft: 4 },
  iosCard:      { backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  hairline:     { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  infoPill:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6 },
  sideBadge:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  sideBadgeText:{ fontSize: 13, fontWeight: "700" },
  infoPillText: { fontSize: 14, color: SUBLABEL, fontWeight: "600" },
  fieldRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  fieldLabel:   { fontSize: 15, color: SUBLABEL },
  fieldInput:   { fontSize: 15, color: LABEL, fontWeight: "700", textAlign: "right", minWidth: 120 },
  radioRow:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  radioLabel:   { fontSize: 15, color: LABEL },
  radio:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center" },
  radioActive:  { borderColor: BRAND },
  radioDot:     { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },
  prefRow:      { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  prefLabel:    { fontSize: 14, fontWeight: "600", color: LABEL, marginBottom: 2 },
  prefSub:      { fontSize: 12, color: SUBLABEL },
  prefNumInput: { fontSize: 15, color: LABEL, fontWeight: "700", textAlign: "right", minWidth: 60 },
  remarkInput:  { padding: 16, fontSize: 14, color: LABEL, minHeight: 80, textAlignVertical: "top" },
  pmLoading:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  pmLoadingText:{ fontSize: 14, color: SUBLABEL },
  pmEmpty:      { padding: 16, fontSize: 14, color: SUBLABEL, textAlign: "center" },
  pmRow:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  pmName:       { fontSize: 14, fontWeight: "700", color: LABEL },
  pmDetail:     { fontSize: 12, color: SUBLABEL, marginTop: 2 },
  checkbox:     { width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: "#D1D5DB", justifyContent: "center", alignItems: "center" },
  checkboxSelected: { backgroundColor: BRAND, borderColor: BRAND },
  footer:       { paddingHorizontal: 16, paddingTop: 12, backgroundColor: SURFACE, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  saveBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 15 },
  saveBtnText:  { fontSize: 15, fontWeight: "700", color: SURFACE },
  disabledBtn:  { opacity: 0.5 },
});
