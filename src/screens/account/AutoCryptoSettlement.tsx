import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Text } from "react-native-paper";
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
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

type PayoutMode = "crypto" | "wallet" | "bank";

const OPTIONS: { mode: PayoutMode; icon: string; title: string; sub: string }[] = [
  {
    mode: "crypto",
    icon: "wallet-outline",
    title: "Keep as Crypto",
    sub: "Deposits stay as crypto — nothing happens automatically",
  },
  {
    mode: "wallet",
    icon: "autorenew",
    title: "Naira Wallet",
    sub: "Deposits convert automatically to your BinaPay Naira balance",
  },
  {
    mode: "bank",
    icon: "bank-transfer",
    title: "Bank Account",
    sub: "Deposits convert and are sent straight to your bank account",
  },
];

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

  // Derive the current single choice from the two backend booleans —
  // "bank" implies conversion already happened, so auto_process_crypto_deposits
  // alone is enough to know the mode; no separate check on auto_convert needed
  // once auto_process_crypto_deposits is true.
  const initialMode: PayoutMode = user?.auto_process_crypto_deposits
    ? "bank"
    : (user?.auto_convert ?? true)
      ? "wallet"
      : "crypto";

  const [payoutMode, setPayoutMode] = useState<PayoutMode>(initialMode);
  const [bankId, setBankId]         = useState(user?.auto_withdraw_bank_account_id ?? "");
  const [processing, setProcessing] = useState(false);

  const { control } = useForm({
    defaultValues: { auto_withdraw_bank_account_id: bankId },
  });

  const handleSave = async () => {
    if (payoutMode === "bank" && !bankId) {
      showToast({ message: "Select a bank account for this option." });
      return;
    }

    // One choice, two backend booleans — "bank" always implies conversion.
    const auto_convert = payoutMode !== "crypto";
    const auto_process_crypto_deposits = payoutMode === "bank";

    setProcessing(true);
    try {
      await API.put(route("account.autoCryptoSettlement"), {
        auto_convert,
        auto_process_crypto_deposits,
        auto_withdraw_bank_account_id: payoutMode === "bank" ? bankId : null,
      });
      dispatch(authSliceActions.updateUser({
        auto_convert,
        auto_process_crypto_deposits,
        auto_withdraw_bank_account_id: payoutMode === "bank" ? bankId : null,
      }));
      showToast({ message: "Auto crypto settlement updated successfully" });
    } catch {
      showToast({ message: "Failed to update settings" });
    } finally {
      setProcessing(false);
    }
  };


  return (
     <View style={s.root}>
      {/* Header */}
   <ScreenHeader
          title="Crypto Deposit Settings"
          subtitle="Choose what happens to your crypto deposits"
          onBack={() => navigation.goBack()}
          rightIcon="shield-check-outline"
        />


      <ScrollableView contentContainerStyle={s.scroll}>
        {/* Info card */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color={BLUE} />
          <Text style={s.infoText}>
            When you deposit crypto, this is what happens to it — pick one.
          </Text>
        </View>

        {/* Three-way choice */}
        {OPTIONS.map((opt) => {
          const selected = payoutMode === opt.mode;
          return (
            <TouchableOpacity
              key={opt.mode}
              style={[s.optionCard, selected && s.optionCardSelected]}
              onPress={() => setPayoutMode(opt.mode)}
              activeOpacity={0.8}
            >
              <View style={[s.toggleIconWrap, selected && s.toggleIconWrapSelected]}>
                <MaterialCommunityIcons
                  name={opt.icon as any}
                  size={18}
                  color={selected ? "#fff" : BLUE}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.toggleTitle}>{opt.title}</Text>
                <Text style={s.toggleSub}>{opt.sub}</Text>
              </View>
              <MaterialCommunityIcons
                name={selected ? "radiobox-marked" : "radiobox-blank"}
                size={20}
                color={selected ? BLUE : "#d1d5db"}
              />
            </TouchableOpacity>
          );
        })}

        {/* Bank selector — only relevant when "Bank Account" is chosen */}
        {payoutMode === "bank" && (
          <>
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
  <Text style={s.noBankSub}>Add a bank account to use this option.</Text>
  <TouchableOpacity
    style={s.addBankBtn}
    onPress={() => navigation.navigate("Bank Accounts" as never)}
    activeOpacity={0.85}
  >
    <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#fff" />
    <Text style={s.addBankBtnText}>Set Up Bank Account</Text>
  </TouchableOpacity>
</View>
              )}
            </View>
          </>
        )}

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
     </View>
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

  optionCard:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 14, borderWidth: 1.5, borderColor: "#f0f0f0", padding: 14, marginBottom: 10 },
  optionCardSelected: { borderColor: BLUE, backgroundColor: "#f0f7ff" },

  toggleIconWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  toggleIconWrapSelected: { backgroundColor: BLUE },
  toggleTitle:      { fontSize: 14, fontWeight: "600", color: "#111827" },
  toggleSub:        { fontSize: 11, color: "#6b7280", marginTop: 1 },

  sectionLabel:     { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 4 },

  selectedBankCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginTop: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  selectedBankText: { fontSize: 13, fontWeight: "600", color: "#15803d" },

  noBankWrap:       { alignItems: "center", paddingVertical: 20, gap: 6 },
  noBankTitle:      { fontSize: 14, fontWeight: "600", color: "#374151" },
  noBankSub:        { fontSize: 12, color: "#9ca3af", textAlign: "center" },

  saveBtn:          { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 8 },
  saveBtnText:      { color: "#fff", fontSize: 15, fontWeight: "700" },
  addBankBtn:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE, borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10, marginTop: 12 },
addBankBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
