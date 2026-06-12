import React, { useState } from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Text, Switch } from "react-native-paper";
import API from "@lib/api";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { useDispatch } from "react-redux";
import { authSliceActions } from "@store/slice/auth";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { useForm } from "react-hook-form";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import ScrollableView from "@components/ui/shared/ScrollableView";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

export default function AutoCryptoSettlement() {
  const user         = useTypedSelector(selectUser);
  const dispatch     = useDispatch();
  const insets       = useSafeAreaInsets();
  const navigation   = useNavigation();

  const bankAccounts    = user?.userBankAccounts || [];
  const bankDropdownData = bankAccounts.map((acc: any) => ({
    label: `${acc.bank_name} — ${acc.account_number}`,
    id: acc.id,
  }));

  const [enabled, setEnabled]     = useState(user?.auto_process_crypto_deposits ?? false);
  const [bankId, setBankId]       = useState(user?.auto_withdraw_bank_account_id ?? "");
  const [processing, setProcessing] = useState(false);

  const { control } = useForm({
    defaultValues: { auto_withdraw_bank_account_id: bankId },
  });

  const handleSave = async () => {
    setProcessing(true);
    try {
      await API.put(route("account.autoCryptoSettlement"), {
        auto_process_crypto_deposits: enabled,
        auto_withdraw_bank_account_id: bankId || null,
      });
      dispatch(authSliceActions.updateUser({
        auto_process_crypto_deposits: enabled,
        auto_withdraw_bank_account_id: bankId,
      }));
      showToast({ message: "Auto crypto settlement updated successfully" });
    } catch {
      showToast({ message: "Failed to update settings" });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <SafeAreaView style={s.root}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Auto Crypto Payout</Text>
          <Text style={s.headerSub}>Auto-convert deposits to Naira</Text>
        </View>
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>
        {/* Info card */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="bank-transfer" size={20} color={BLUE} />
          <Text style={s.infoText}>
            When enabled, crypto deposits are automatically converted to Naira and sent to your selected bank account.
          </Text>
        </View>

        {/* Toggle */}
        <View style={s.card}>
          <View style={s.toggleRow}>
            <View style={s.toggleLeft}>
              <View style={s.toggleIconWrap}>
                <MaterialCommunityIcons name="swap-horizontal" size={18} color={BLUE} />
              </View>
              <View>
                <Text style={s.toggleTitle}>Enable Auto Settlement</Text>
                <Text style={s.toggleSub}>Automatically convert crypto to Naira</Text>
              </View>
            </View>
            <Switch
              value={enabled}
              onValueChange={setEnabled}
              color={BLUE}
            />
          </View>
        </View>

        {/* Bank selector */}
        <Text style={s.sectionLabel}>Payout Bank Account</Text>
        <View style={s.card}>
          {bankAccounts.length > 0 ? (
            <>
              <DropdownMenuField
                control={control}
                name="auto_withdraw_bank_account_id"
                label="Select Bank Account"
                placeholder="Choose a bank account"
                data={bankDropdownData}
                search={false}
                onDataSelect={(item) => setBankId(item.id)}
              />
              {bankId ? (
                <View style={s.selectedBankCard}>
                  <MaterialCommunityIcons name="bank-check" size={16} color="#16a34a" />
                  <Text style={s.selectedBankText}>
                    {bankAccounts.find((a: any) => a.id === bankId)?.bank_name ?? "Selected"}
                  </Text>
                </View>
              ) : null}
            </>
          ) : (
            <View style={s.noBankWrap}>
              <MaterialCommunityIcons name="bank-off-outline" size={32} color="#9ca3af" />
              <Text style={s.noBankTitle}>No bank accounts added</Text>
              <Text style={s.noBankSub}>Go to Manage Bank Accounts to add one first.</Text>
            </View>
          )}
        </View>

        {/* Save */}
        <TouchableOpacity
          style={[s.saveBtn, processing && { opacity: 0.6 }]}
          onPress={handleSave}
          disabled={processing}
          activeOpacity={0.85}
        >
          <Text style={s.saveBtnText}>{processing ? "Saving..." : "Save Settings"}</Text>
        </TouchableOpacity>
      </ScrollableView>

      <PleaseWaitModal visible={processing} />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#f8f9fb" },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:          { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:      { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:        { fontSize: 11, color: "#6b7280", marginTop: 1 },

  scroll:           { padding: 16, paddingBottom: 40 },

  infoCard:         { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14, marginBottom: 16 },
  infoText:         { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },

  card:             { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, marginBottom: 12 },

  toggleRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  toggleLeft:       { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  toggleIconWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  toggleTitle:      { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub:        { fontSize: 11, color: "#6b7280", marginTop: 1 },

  sectionLabel:     { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },

  selectedBankCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  selectedBankText: { fontSize: 13, fontWeight: "600", color: "#15803d" },

  noBankWrap:       { alignItems: "center", paddingVertical: 20, gap: 6 },
  noBankTitle:      { fontSize: 14, fontWeight: "600", color: "#374151" },
  noBankSub:        { fontSize: 12, color: "#9ca3af", textAlign: "center" },

  saveBtn:          { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnText:      { color: "#fff", fontSize: 15, fontWeight: "700" },
});
