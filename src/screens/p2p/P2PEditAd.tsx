import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import {
  useUpdateP2PAdMutation,
  useGetP2PPaymentMethodsQuery,
  P2PAd,
} from "@store/redux-api/p2p";
import { showToast } from "@helpers/toast";

type Props = P2PStackScreenProps<"P2P Edit Ad">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

export default function P2PEditAdScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { ad } = route.params as { ad: P2PAd };

  const [price, setPrice]       = useState(ad.price ?? "");
  const [minAmount, setMinAmount] = useState(ad.min_amount ?? "");
  const [maxAmount, setMaxAmount] = useState(ad.max_amount ?? "");
  const [quantity, setQuantity]   = useState(ad.quantity ?? "");
  const [remark, setRemark]       = useState(ad.remark ?? "");
  const [selectedPaymentIds, setSelectedPaymentIds] = useState<string[]>(ad.payment_ids ?? []);
  const [prefKyc, setPrefKyc]               = useState(ad.trading_pref_kyc ?? true);
  const [prefMinOrders, setPrefMinOrders]   = useState(String(ad.trading_pref_min_orders ?? 5));
  const [prefNoUnposted, setPrefNoUnposted] = useState(ad.trading_pref_no_unposted_ad ?? true);
  const [paymentPeriod, setPaymentPeriod] = useState(ad.payment_period ?? "15");

  const { data: pmData, isLoading: isLoadingPM } = useGetP2PPaymentMethodsQuery();
  const [updateAd, { isLoading: isUpdating }] = useUpdateP2PAdMutation();

  const paymentMethods = pmData?.payment_methods ?? [];

  const togglePaymentMethod = (id: string) => {
    setSelectedPaymentIds((prev) =>
      prev.indexOf(id) !== -1
        ? prev.filter((p) => p !== id)
        : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!price || !minAmount || !maxAmount || !quantity) {
      showToast({ message: "Please fill all required fields.", duration: 2500 });
      return;
    }

    if (selectedPaymentIds.length === 0) {
      showToast({ message: "Please select at least one payment method.", duration: 2500 });
      return;
    }

    try {
      await updateAd({
        adId:        ad.id,
        price:       parseFloat(price),
        min_amount:  parseFloat(minAmount),
        max_amount:  parseFloat(maxAmount),
        quantity:    parseFloat(quantity),
        payment_ids: selectedPaymentIds,
        remark:      remark,
          payment_period:              paymentPeriod,
         trading_pref_kyc:            prefKyc,
        trading_pref_min_orders:     parseInt(prefMinOrders) || 5,
        trading_pref_no_unposted_ad: prefNoUnposted,
      }).unwrap();

      showToast({ message: "Ad updated successfully.", duration: 2000 });
      navigation.goBack();
    } catch (err: any) {
      showToast({
        message: err?.data?.message ?? "Failed to update ad. Please try again.",
        duration: 3000,
      });
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableRipple onPress={() => navigation.goBack()} style={styles.backBtn} borderless>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#111" />
        </TouchableRipple>
        <Text style={styles.headerText}>Edit Ad</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Ad info pill ── */}
        <View style={styles.infoPill}>
          <View style={[
            styles.sideBadge,
            { backgroundColor: ad.side === "Buy" ? "#E8F5E9" : BRAND_LIGHT }
          ]}>
            <Text style={[
              styles.sideBadgeText,
              { color: ad.side === "Buy" ? "#2E7D32" : BRAND }
            ]}>
              {ad.side}
            </Text>
          </View>
          <Text style={styles.infoPillText}>{ad.token}/{ad.currency}</Text>
        </View>

        {/* ── Fields ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price & Quantity</Text>
          <View style={styles.card}>
            <Field label="Price (₦)" value={price} onChangeText={setPrice} keyboardType="numeric" />
            <View style={styles.divider} />
            <Field label="Quantity (USDT)" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            <View style={styles.divider} />
            <Field label="Min Amount (₦)" value={minAmount} onChangeText={setMinAmount} keyboardType="numeric" />
            <View style={styles.divider} />
            <Field label="Max Amount (₦)" value={maxAmount} onChangeText={setMaxAmount} keyboardType="numeric" />
          </View>
        </View>

        {/* ── Payment Period ── */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Payment Period</Text>
  <View style={styles.card}>
    {["15", "30"].map((opt, index) => (
      <React.Fragment key={opt}>
        {index > 0 && <View style={styles.divider} />}
        <TouchableOpacity
          style={ppStyles.row}
          onPress={() => setPaymentPeriod(opt)}
          activeOpacity={0.7}>
          <Text style={ppStyles.label}>{opt} minutes</Text>
          <View style={[ppStyles.radio, paymentPeriod === opt && ppStyles.radioSelected]}>
            {paymentPeriod === opt && <View style={ppStyles.radioDot} />}
          </View>
        </TouchableOpacity>
      </React.Fragment>
    ))}
  </View>
</View>

           {/* ── Trading Preferences ── */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Trading Preferences</Text>
  <View style={styles.card}>

    <View style={prefStyles.row}>
      <View style={prefStyles.textCol}>
        <Text style={prefStyles.label}>KYC Verified Only</Text>
        <Text style={prefStyles.sub}>Only trade with verified buyers</Text>
      </View>
      <Switch
        value={prefKyc}
        onValueChange={setPrefKyc}
        trackColor={{ false: "#E0E0E0", true: BRAND }}
        thumbColor="#fff"
      />
    </View>

    <View style={styles.divider} />

    <View style={prefStyles.row}>
      <View style={prefStyles.textCol}>
        <Text style={prefStyles.label}>No Unposted Ad</Text>
        <Text style={prefStyles.sub}>Require counterparty to have active ads</Text>
      </View>
      <Switch
        value={prefNoUnposted}
        onValueChange={setPrefNoUnposted}
        trackColor={{ false: "#E0E0E0", true: BRAND }}
        thumbColor="#fff"
      />
    </View>

    <View style={styles.divider} />

    <View style={prefStyles.row}>
      <Text style={prefStyles.label}>Min Completed Orders (30d)</Text>
      <TextInput
        style={prefStyles.input}
        value={prefMinOrders}
        onChangeText={setPrefMinOrders}
        keyboardType="numeric"
        placeholder="5"
        placeholderTextColor="#BBB"
      />
    </View>

  </View>
</View>
        {/* ── Remark ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remark</Text>
          <View style={styles.card}>
            <TextInput
              style={styles.remarkInput}
              value={remark}
              onChangeText={setRemark}
              placeholder="Optional remark for buyers..."
              placeholderTextColor="#BBB"
              multiline
              maxLength={200}
            />
          </View>
        </View>

        {/* ── Payment methods ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          {isLoadingPM ? (
            <View style={styles.pmLoading}>
              <ActivityIndicator size="small" color={BRAND} />
              <Text style={styles.pmLoadingText}>Loading payment methods...</Text>
            </View>
          ) : paymentMethods.length === 0 ? (
            <View style={styles.card}>
              <Text style={styles.emptyPm}>No payment methods found on your Bybit account.</Text>
            </View>
          ) : (
            <View style={styles.card}>
              {paymentMethods.map((pm, index) => {
                const selected = selectedPaymentIds.indexOf(pm.id) !== -1;
                return (
                  <React.Fragment key={pm.id}>
                    {index > 0 && <View style={styles.divider} />}
                    <TouchableOpacity
                      style={styles.pmRow}
                      onPress={() => togglePaymentMethod(pm.id)}
                      activeOpacity={0.7}>
                      <View style={styles.pmInfo}>
                        <Text style={styles.pmName}>{pm.payment_name}</Text>
                        <Text style={styles.pmDetail}>
                          {pm.account_no}{pm.real_name ? ` · ${pm.real_name}` : ""}
                        </Text>
                      </View>
                      <View style={[
                        styles.checkbox,
                        selected && styles.checkboxSelected,
                      ]}>
                        {selected && (
                          <MaterialCommunityIcons name="check" size={14} color="#fff" />
                        )}
                      </View>
                    </TouchableOpacity>
                  </React.Fragment>
                );
              })}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* ── Save button ── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 8 }]}>
        <TouchableRipple
          style={[styles.saveBtn, isUpdating && styles.btnDisabled]}
          onPress={handleSave}
          disabled={isUpdating}>
          <View style={styles.saveBtnInner}>
            {isUpdating
              ? <ActivityIndicator size={18} color="#fff" />
              : <MaterialCommunityIcons name="check-circle-outline" size={18} color="#fff" />}
            <Text style={styles.saveBtnText}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </Text>
          </View>
        </TouchableRipple>
      </View>

    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboardType = "default",
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  keyboardType?: "default" | "numeric";
}) {
  return (
    <View style={fieldStyles.row}>
      <Text style={fieldStyles.label}>{label}</Text>
      <TextInput
        style={fieldStyles.input}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        placeholderTextColor="#BBB"
        placeholder="0"
      />
    </View>
  );
}

const fieldStyles = StyleSheet.create({
  row:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 16 },
  label: { fontSize: 14, color: "#555", fontWeight: "500" },
  input: { fontSize: 15, color: "#111", fontWeight: "700", textAlign: "right", minWidth: 120 },
});

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: "#F4F6FB" },
  header:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#EFEFEF" },
  backBtn:       { padding: 4, borderRadius: 20 },
  headerText:    { fontSize: 16, fontWeight: "800", color: "#111" },
  scroll:        { padding: 16, gap: 16 },
  infoPill:      { flexDirection: "row", alignItems: "center", gap: 10 },
  sideBadge:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  sideBadgeText: { fontSize: 13, fontWeight: "700" },
  infoPillText:  { fontSize: 14, color: "#555", fontWeight: "600" },
  section:       { gap: 8 },
  sectionTitle:  { fontSize: 13, fontWeight: "700", color: "#888", paddingLeft: 4 },
  card:          { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#E8EEF9", overflow: "hidden" },
  divider:       { height: 1, backgroundColor: "#F0F4FB" },
  remarkInput:   { padding: 16, fontSize: 14, color: "#111", minHeight: 80, textAlignVertical: "top" },
  pmLoading:     { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  pmLoadingText: { fontSize: 14, color: "#888" },
  emptyPm:       { padding: 16, fontSize: 14, color: "#888", textAlign: "center" },
  pmRow:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  pmInfo:        { flex: 1 },
  pmName:        { fontSize: 14, fontWeight: "700", color: "#111" },
  pmDetail:      { fontSize: 12, color: "#888", marginTop: 2 },
  checkbox:      { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: "#D0D9EE", justifyContent: "center", alignItems: "center" },
  checkboxSelected: { backgroundColor: BRAND, borderColor: BRAND },
  footer:        { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#EFEFEF" },
  saveBtn:       { backgroundColor: BRAND, borderRadius: 30, paddingVertical: 15, alignItems: "center" },
  saveBtnInner:  { flexDirection: "row", alignItems: "center", gap: 8 },
  saveBtnText:   { fontSize: 15, fontWeight: "700", color: "#fff" },
  btnDisabled:   { opacity: 0.5 },
});

const ppStyles = StyleSheet.create({
  row:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center",
                   paddingHorizontal: 16, paddingVertical: 14 },
  label:         { fontSize: 14, color: "#111", fontWeight: "500" },
  radio:         { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
                   borderColor: "#D0D9EE", justifyContent: "center", alignItems: "center" },
  radioSelected: { borderColor: BRAND },
  radioDot:      { width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND },
});

const prefStyles = StyleSheet.create({
  row:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  textCol: { flex: 1, marginRight: 12 },
  label:   { fontSize: 14, fontWeight: "600", color: "#111" },
  sub:     { fontSize: 12, color: "#888", marginTop: 2 },
  input:   { fontSize: 15, color: "#111", fontWeight: "700", textAlign: "right", minWidth: 60 },
});
