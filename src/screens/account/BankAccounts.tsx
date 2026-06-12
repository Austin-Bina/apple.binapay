// ═══════════════════════════════════════════════════════════════════════════
// BankAccountsScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, StyleSheet, Platform, StatusBar,
} from "react-native";
import API from "@lib/api";
import { useForm, Controller } from "react-hook-form";
import { routes } from "@constants/routes";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { showToast } from "@helpers/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

type Bank = { name: string; code: string };
type FormValues = { account_name: string; account_number: string; bank_code: string };

export default function BankAccountsScreen({ navigation }: any) {
  const user   = useSelector(selectUser);
  const insets = useSafeAreaInsets();

  // ── All original state + handlers — untouched ─────────────────────────────
  const [banks, setBanks]                   = useState<Bank[]>([]);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [isVerified, setIsVerified]         = useState(false);
  const [isProcessing, setIsProcessing]     = useState(false);
  const [bankAccounts, setBankAccounts]     = useState<any[]>([]);

  const { control, handleSubmit, setValue, watch, trigger, reset } = useForm<FormValues>({
    defaultValues: { account_name: "", account_number: "", bank_code: "" },
  });
  const values = watch();
  const bankDropdownData = banks.map((bank) => ({ label: bank.name, id: bank.code }));

  useEffect(() => { setBankAccounts(user?.userBankAccounts || []); }, [user]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsProcessing(true);
        const res = await API.get(routes.api.v1.bank.userBankAccounts.banklist);
        setBanks(res.data.data || []);
      } catch { showToast({ message: "Failed to load bank list.", variant: "error" }); }
      finally { setIsProcessing(false); }
    };
    fetchBanks();
  }, []);

  const verifyAccount = useCallback(async () => {
    const valid = await trigger(["account_number", "bank_code"]); if (!valid) return;
    setIsProcessing(true); setResolvedAccountName(null); setIsVerified(false);
    try {
      const res = await API.post(routes.api.v1.bank.userBankAccounts.accountname, {
        account_number: values.account_number, bank_code: values.bank_code,
      });
      if (res.data.is_valid) {
        setResolvedAccountName(res.data.account_name); setIsVerified(true);
        setValue("account_name", res.data.account_name);
      } else { showToast({ message: "Could not resolve account name.", variant: "error" }); }
    } catch { showToast({ message: "Failed to verify account.", variant: "error" }); }
    finally { setIsProcessing(false); }
  }, [values, trigger]);

  const submit = async (data: FormValues) => {
    if (!isVerified) { showToast({ message: "Please verify your account first.", variant: "error" }); return; }
    const bank = banks.find(b => b.code === data.bank_code);
    if (!bank) { showToast({ message: "Please select a valid bank.", variant: "error" }); return; }
    try {
      setIsProcessing(true);
      const res = await API.post(routes.api.v1.bank.userBankAccounts.create, {
        bank_name: bank.name, bank_code: bank.code,
        account_number: data.account_number, account_name: resolvedAccountName,
      });
      showToast({ message: "Bank account added successfully!", variant: "success" });
      setBankAccounts(prev => [{ bank_name: bank.name, account_number: data.account_number, account_name: resolvedAccountName, id: res.data.id }, ...prev]);
      reset(); setResolvedAccountName(null); setIsVerified(false);
    } catch { showToast({ message: "Failed to add bank account.", variant: "error" }); }
    finally { setIsProcessing(false); }
  };

  const deleteBankAccount = (accountId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this bank account?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        try {
          await API.delete(routes.api.v1.bank.userBankAccounts.delete.replace(":id", accountId));
          setBankAccounts(prev => prev.filter(acc => acc.id !== accountId));
          showToast({ message: "Bank account removed.", variant: "success" });
        } catch { showToast({ message: "Failed to delete bank account.", variant: "error" }); }
      }},
    ]);
  };

  return (
    <View style={[ba.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={ba.navBar}>
        <TouchableOpacity style={ba.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={ba.navCenter}>
          <Text style={ba.navTitle}>Bank Accounts</Text>
          <Text style={ba.navSub}>Manage your saved accounts</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={ba.scroll} showsVerticalScrollIndicator={false}>

        {/* Add form */}
        <Text style={ba.sectionLabel}>Add Bank Account</Text>
        <View style={[ba.card, IOS_SHADOW]}>
          <Controller
            control={control} name="account_number" rules={{ required: true, minLength: 10 }}
            render={({ field: { onChange, value } }) => (
              <View style={ba.fieldWrap}>
                <Text style={ba.fieldLabel}>Account Number</Text>
                <View style={ba.inputRow}>
                  <TextInput style={ba.textInput} placeholder="Enter 10-digit account number"
                    placeholderTextColor={PLACEHOLDER} keyboardType="numeric" value={value}
                    onChangeText={onChange} maxLength={10} />
                </View>
              </View>
            )}
          />
          <View style={ba.fieldWrap}>
            <Controller control={control} name="bank_code" rules={{ required: true }}
              render={({ field: { onChange } }) => (
                <DropdownMenuField label="Select Bank" placeholder="Search and select bank"
                  name="bank_code" control={control} data={bankDropdownData} search={true}
                  onDataSelect={(item) => { onChange(item.id); setResolvedAccountName(null); setIsVerified(false); }} />
              )}
            />
          </View>

          <TouchableOpacity style={ba.verifyBtn} onPress={verifyAccount} disabled={isProcessing} activeOpacity={0.85}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color={SURFACE} />
            <Text style={ba.verifyBtnText}>Verify Account</Text>
          </TouchableOpacity>

          {resolvedAccountName && (
            <View style={ba.resolvedCard}>
              <MaterialCommunityIcons name="account-check" size={16} color="#16A34A" />
              <Text style={ba.resolvedName}>{resolvedAccountName}</Text>
            </View>
          )}

          <TouchableOpacity style={[ba.saveBtn, !isVerified && { opacity: 0.45 }]}
            onPress={handleSubmit(submit)} disabled={isProcessing || !isVerified} activeOpacity={0.85}>
            <MaterialCommunityIcons name="content-save-outline" size={16} color={SURFACE} />
            <Text style={ba.saveBtnText}>Save Account</Text>
          </TouchableOpacity>
        </View>

        {/* Existing accounts */}
        {bankAccounts.length > 0 && (
          <>
            <Text style={[ba.sectionLabel, { marginTop: 8 }]}>My Bank Accounts</Text>
            <View style={[ba.card, IOS_SHADOW]}>
              {bankAccounts.map((acc, index) => (
                <View key={index}>
                  <View style={ba.accountRow}>
                    <View style={ba.accountIconWrap}>
                      <MaterialCommunityIcons name="bank-outline" size={18} color={BLUE} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={ba.accountBank} numberOfLines={1}>{acc.bank_name}</Text>
                      <Text style={ba.accountNumber}>{acc.account_number}</Text>
                      <Text style={ba.accountName} numberOfLines={1}>{acc.account_name}</Text>
                    </View>
                    <TouchableOpacity style={ba.deleteBtn} onPress={() => deleteBankAccount(acc.id)} activeOpacity={0.7}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                  {index < bankAccounts.length - 1 && <View style={ba.rowDivider} />}
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const ba = StyleSheet.create({
  root:            { flex: 1, backgroundColor: BG },
  navBar:          { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:         { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:       { flex: 1, alignItems: "center" },
  navTitle:        { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:          { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:          { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  sectionLabel:    { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, marginLeft: 4 },
  card:            { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, padding: 14, marginBottom: 12 },
  fieldWrap:       { marginBottom: 12 },
  fieldLabel:      { fontSize: 13, fontWeight: "600", color: SUBLABEL, marginBottom: 6 },
  inputRow:        { borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 12, backgroundColor: BG, paddingHorizontal: 14 },
  textInput:       { flex: 1, fontSize: 14, color: LABEL, paddingVertical: 13 },
  verifyBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 13, marginBottom: 10 },
  verifyBtnText:   { color: SURFACE, fontSize: 14, fontWeight: "600" },
  resolvedCard:    { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F0FDF4", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BBF7D0" },
  resolvedName:    { fontSize: 13, fontWeight: "600", color: "#15803D" },
  saveBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 12, paddingVertical: 13 },
  saveBtnText:     { color: SURFACE, fontSize: 14, fontWeight: "600" },
  accountRow:      { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  accountIconWrap: { width: 38, height: 38, borderRadius: 12, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  accountBank:     { fontSize: 13, fontWeight: "600", color: LABEL },
  accountNumber:   { fontSize: 12, color: "#374151", marginTop: 1 },
  accountName:     { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  deleteBtn:       { width: 34, height: 34, borderRadius: 10, backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center" },
  rowDivider:      { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 48 },
});
