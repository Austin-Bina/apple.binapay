import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  ScrollView, Alert, StyleSheet,
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
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

type Bank = { name: string; code: string };
type FormValues = { account_name: string; account_number: string; bank_code: string };

export default function BankAccountsScreen({ navigation }: any) {
  const user    = useSelector(selectUser);
  const insets  = useSafeAreaInsets();
  const [banks, setBanks]                       = useState<Bank[]>([]);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [isVerified, setIsVerified]             = useState(false);
  const [isProcessing, setIsProcessing]         = useState(false);
  const [bankAccounts, setBankAccounts]         = useState<any[]>([]);

  const { control, handleSubmit, setValue, watch, trigger, reset } = useForm<FormValues>({
    defaultValues: { account_name: "", account_number: "", bank_code: "" },
  });
  const values = watch();

  const bankDropdownData = banks.map((bank) => ({ label: bank.name, id: bank.code }));

  useEffect(() => {
    setBankAccounts(user?.userBankAccounts || []);
  }, [user]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        setIsProcessing(true);
        const res = await API.get(routes.api.v1.bank.userBankAccounts.banklist);
        setBanks(res.data.data || []);
      } catch {
        showToast({ message: "Failed to load bank list.", variant: "error" });
      } finally {
        setIsProcessing(false);
      }
    };
    fetchBanks();
  }, []);

  const verifyAccount = useCallback(async () => {
    const valid = await trigger(["account_number", "bank_code"]);
    if (!valid) return;
    setIsProcessing(true);
    setResolvedAccountName(null);
    setIsVerified(false);
    try {
      const res = await API.post(routes.api.v1.bank.userBankAccounts.accountname, {
        account_number: values.account_number,
        bank_code: values.bank_code,
      });
      if (res.data.is_valid) {
        setResolvedAccountName(res.data.account_name);
        setIsVerified(true);
        setValue("account_name", res.data.account_name);
      } else {
        showToast({ message: "Could not resolve account name.", variant: "error" });
      }
    } catch {
      showToast({ message: "Failed to verify account.", variant: "error" });
    } finally {
      setIsProcessing(false);
    }
  }, [values, trigger]);

  const submit = async (data: FormValues) => {
    if (!isVerified) { showToast({ message: "Please verify your account first.", variant: "error" }); return; }
    const bank = banks.find((b) => b.code === data.bank_code);
    if (!bank) { showToast({ message: "Please select a valid bank.", variant: "error" }); return; }
    try {
      setIsProcessing(true);
      const res = await API.post(routes.api.v1.bank.userBankAccounts.create, {
        bank_name: bank.name, bank_code: bank.code,
        account_number: data.account_number, account_name: resolvedAccountName,
      });
      showToast({ message: "Bank account added successfully!", variant: "success" });
      setBankAccounts((prev) => [{ bank_name: bank.name, account_number: data.account_number, account_name: resolvedAccountName, id: res.data.id }, ...prev]);
      reset();
      setResolvedAccountName(null);
      setIsVerified(false);
    } catch {
      showToast({ message: "Failed to add bank account.", variant: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteBankAccount = (accountId: string) => {
    Alert.alert("Confirm Delete", "Are you sure you want to delete this bank account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          try {
            await API.delete(routes.api.v1.bank.userBankAccounts.delete.replace(":id", accountId));
            setBankAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
            showToast({ message: "Bank account removed.", variant: "success" });
          } catch {
            showToast({ message: "Failed to delete bank account.", variant: "error" });
          }
        },
      },
    ]);
  };

  return (
     <View style={s.root}>
      {/* Header */}

 <ScreenHeader
          title="Bank Accounts"
          subtitle="Manage your saved bank accounts"
          onBack={() => navigation.goBack()}
          rightIcon="shield-check-outline"
        />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Add Bank Account form ── */}
        <Text style={s.sectionTitle}>Add Bank Account</Text>
        <View style={s.card}>
          {/* Account Number */}
          <Controller
            control={control}
            name="account_number"
            rules={{ required: true, minLength: 10 }}
            render={({ field: { onChange, value } }) => (
              <View style={s.fieldWrap}>
                <Text style={s.fieldLabel}>Account Number</Text>
                <View style={s.inputRow}>
                  <TextInput
                    style={s.textInput}
                    placeholder="Enter 10-digit account number"
                    placeholderTextColor="#9ca3af"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                    maxLength={10}
                  />
                </View>
              </View>
            )}
          />

          {/* Bank selector */}
          <View style={s.fieldWrap}>
            <Controller
              control={control}
              name="bank_code"
              rules={{ required: true }}
              render={({ field: { onChange } }) => (
                <DropdownMenuField
                  label="Select Bank"
                  placeholder="Search and select bank"
                  name="bank_code"
                  control={control}
                  data={bankDropdownData}
                  search={true}
                  onDataSelect={(item) => {
                    onChange(item.id);
                    setResolvedAccountName(null);
                    setIsVerified(false);
                  }}
                />
              )}
            />
          </View>

          {/* Verify button */}
          <TouchableOpacity style={s.verifyBtn} onPress={verifyAccount} disabled={isProcessing}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color="#fff" />
            <Text style={s.verifyBtnText}>Verify Account</Text>
          </TouchableOpacity>

          {/* Resolved name */}
          {resolvedAccountName && (
            <View style={s.resolvedCard}>
              <MaterialCommunityIcons name="account-check" size={16} color="#16a34a" />
              <Text style={s.resolvedName}>{resolvedAccountName}</Text>
            </View>
          )}

          {/* Save button */}
          <TouchableOpacity
            style={[s.saveBtn, !isVerified && { opacity: 0.5 }]}
            onPress={handleSubmit(submit)}
            disabled={isProcessing || !isVerified}
          >
            <MaterialCommunityIcons name="content-save-outline" size={16} color="#fff" />
            <Text style={s.saveBtnText}>Save Account</Text>
          </TouchableOpacity>
        </View>

        {/* ── Existing accounts ── */}
        {bankAccounts.length > 0 && (
          <>
            <Text style={[s.sectionTitle, { marginTop: 8 }]}>My Bank Accounts</Text>
            <View style={s.card}>
              {bankAccounts.map((acc, index) => (
                <View key={index}>
                  <View style={s.accountRow}>
                    <View style={s.accountIconWrap}>
                      <MaterialCommunityIcons name="bank-outline" size={18} color={BLUE} />
                    </View>
                    <View style={s.accountInfo}>
                      <Text style={s.accountBank} numberOfLines={1}>{acc.bank_name}</Text>
                      <Text style={s.accountNumber}>{acc.account_number}</Text>
                      <Text style={s.accountName} numberOfLines={1}>{acc.account_name}</Text>
                    </View>
                    <TouchableOpacity style={s.deleteBtn} onPress={() => deleteBankAccount(acc.id)}>
                      <MaterialCommunityIcons name="trash-can-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                  {index < bankAccounts.length - 1 && <View style={s.rowDivider} />}
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

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#f8f9fb" },
  header:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:        { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:    { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:      { fontSize: 11, color: "#6b7280", marginTop: 1 },

  scroll:         { padding: 16, paddingBottom: 40 },
  sectionTitle:   { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  card:           { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, marginBottom: 12 },

  fieldWrap:      { marginBottom: 12 },
  fieldLabel:     { fontSize: 12, fontWeight: "600", color: "#374151", marginBottom: 6 },
  inputRow:       { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, backgroundColor: "#f9fafb", paddingHorizontal: 12 },
  textInput:      { flex: 1, fontSize: 14, color: "#111827", paddingVertical: 12 },

  verifyBtn:      { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#2563EB", borderRadius: 10, paddingVertical: 12, marginBottom: 10 },
  verifyBtnText:  { color: "#fff", fontSize: 14, fontWeight: "600" },

  resolvedCard:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderRadius: 10, padding: 10, marginBottom: 10, borderWidth: 1, borderColor: "#bbf7d0" },
  resolvedName:   { fontSize: 13, fontWeight: "600", color: "#15803d" },

  saveBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: BRAND, borderRadius: 10, paddingVertical: 12 },
  saveBtnText:    { color: "#fff", fontSize: 14, fontWeight: "600" },

  accountRow:     { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  accountIconWrap:{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  accountInfo:    { flex: 1 },
  accountBank:    { fontSize: 13, fontWeight: "600", color: "#111827" },
  accountNumber:  { fontSize: 12, color: "#374151", marginTop: 1 },
  accountName:    { fontSize: 11, color: "#6b7280", marginTop: 1 },
  deleteBtn:      { width: 32, height: 32, borderRadius: 8, backgroundColor: "#FEF2F2", justifyContent: "center", alignItems: "center" },
  rowDivider:     { height: 1, backgroundColor: "#f3f4f6", marginLeft: 46 },
});
