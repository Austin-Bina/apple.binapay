import React, { useEffect, useState, useRef } from "react";
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { routes } from "@constants/routes";
import API from "@lib/api";
import { useNavigation } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import { showToast } from "@helpers/toast";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type BankAccount = {
  id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
};

type Props = {
  visible: boolean;
  amount: string;
  bankAccount: BankAccount;
  onClose: () => void;
  onSuccessRedirect: () => void;
};

export default function NairaWithdrawalOTPSheet({
  visible, amount, bankAccount, onClose, onSuccessRedirect,
}: Props) {
  const [otp, setOtp]               = useState("");
  const [sending, setSending]       = useState(false);
  const [sent, setSent]             = useState(false);
  const [cooldown, setCooldown]     = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigation        = useNavigation();
  const idempotencyKeyRef = useRef<string | null>(null);
  const biometricToken    = useRef(Crypto.randomUUID());
  const BASE_URL          = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  if (!idempotencyKeyRef.current) {
    idempotencyKeyRef.current = Crypto.randomUUID();
  }

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-redirect after success
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(onSuccessRedirect, 3000);
    return () => clearTimeout(t);
  }, [showSuccess]);

  const sendOtp = async () => {
    if (cooldown > 0) return;
    setSending(true);
    try {
      API.defaults.baseURL = BASE_URL;
      await API.post(routes.api.v1.auth.nairawithdrawalotp);
      setSent(true);
      setCooldown(30);
      showToast({ variant: "success", message: "OTP sent to your email." });
    } catch (e: any) {
      showToast({ variant: "error", message: e?.response?.data?.message ?? "Failed to send OTP." });
    } finally {
      setSending(false);
    }
  };

  const submit = async () => {
    if (!otp) return;
    setSending(true);
    try {
      API.defaults.baseURL = BASE_URL;
      const res = await API.post(
        routes.api.v1.services.wallets.withdrawnaira,
        { amount, bank_account_id: bankAccount.id, otp },
        { headers: { "Idempotency-Key": idempotencyKeyRef.current } }
      );
      if (res.data.success) {
        setSuccessMessage(`₦${parseFloat(amount).toLocaleString()} sent successfully.`);
        setShowSuccess(true);
      }
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 403) showToast({ variant: "warning", message: "Account blocked. Contact support." });
      else if (status === 422) showToast({ variant: "error", message: "Invalid OTP." });
      else showToast({ variant: "error", message: e?.response?.data?.message ?? "Something went wrong." });
      setOtp("");
    } finally {
      setSending(false);
    }
  };

  const handleBiometric = async () => {
    try {
      setSending(true);
      await authenticateWithBiometrics();
      API.defaults.baseURL = BASE_URL;
      const res = await API.post(
        routes.api.v1.services.wallets.withdrawnaira,
        { amount, bank_account_id: bankAccount.id, biometric: true, biometric_token: biometricToken.current },
        { headers: { "Idempotency-Key": idempotencyKeyRef.current } }
      );
      if (res.data.success) {
        setSuccessMessage(`₦${parseFloat(amount).toLocaleString()} sent successfully.`);
        setShowSuccess(true);
      }
    } catch (err: any) {
      showToast({ variant: "error", message: err.message ?? "Biometric authentication failed." });
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={s.overlay}
      >
        <View style={s.sheet}>
          {/* Handle */}
          <View style={s.handle} />

          {!showSuccess ? (
            <>
              <Text style={s.title}>Confirm Transfer</Text>
              <Text style={s.subtitle}>Enter the OTP sent to your email to authorize this transfer.</Text>

              {/* Summary */}
              <View style={s.summaryCard}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>Amount</Text>
                  <Text style={s.summaryValue}>₦{parseFloat(amount).toLocaleString()}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>To</Text>
                  <Text style={s.summaryValue} numberOfLines={1}>{bankAccount.account_name}</Text>
                </View>
                <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                  <Text style={s.summaryLabel}>{bankAccount.bank_name}</Text>
                  <Text style={s.summaryValue}>{bankAccount.account_number}</Text>
                </View>
              </View>

              {/* OTP row */}
              <View style={s.otpRow}>
                <TextInput
                  style={s.otpInput}
                  placeholder="Enter OTP"
                  placeholderTextColor="#9ca3af"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                />
                <TouchableOpacity
                  style={[s.sendOtpBtn, (sending || cooldown > 0) && s.disabledBtn]}
                  onPress={sendOtp}
                  disabled={sending || cooldown > 0}
                >
                  <Text style={s.sendOtpText}>
                    {cooldown > 0 ? `Resend (${cooldown}s)` : sent ? "Resend" : "Send OTP"}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Confirm */}
              <TouchableOpacity
                style={[s.confirmBtn, (!otp || sending) && s.disabledBtn]}
                onPress={submit}
                disabled={!otp || sending}
              >
                <Text style={s.confirmBtnText}>{sending ? "Processing..." : "Confirm & Send"}</Text>
              </TouchableOpacity>

              {/* Biometric */}
              <TouchableOpacity style={s.biometricRow} onPress={handleBiometric} disabled={sending}>
                <MaterialCommunityIcons name="fingerprint" size={40} color={BLUE} />
                <Text style={s.biometricLabel}>Use Biometric Instead</Text>
              </TouchableOpacity>

              {/* Cancel */}
              <TouchableOpacity style={s.cancelBtn} onPress={onClose}>
                <Text style={s.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── Success state ── */
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <MaterialCommunityIcons name="check" size={40} color="#fff" />
              </View>
              <Text style={s.successTitle}>Transfer Submitted</Text>
              <Text style={s.successSub}>{successMessage}</Text>
              <TouchableOpacity style={s.confirmBtn} onPress={onSuccessRedirect}>
                <Text style={s.confirmBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay:       { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" },
  sheet:         { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, paddingBottom: 36 },
  handle:        { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 18 },

  title:         { fontSize: 16, fontWeight: "700", color: BRAND, textAlign: "center", marginBottom: 4 },
  subtitle:      { fontSize: 12, color: "#6b7280", textAlign: "center", marginBottom: 16 },

  summaryCard:   { backgroundColor: "#f8f9fb", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 16 },
  summaryRow:    { flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  summaryLabel:  { fontSize: 12, color: "#6b7280" },
  summaryValue:  { fontSize: 13, fontWeight: "600", color: "#111827", maxWidth: "60%", textAlign: "right" },

  otpRow:        { flexDirection: "row", gap: 10, marginBottom: 12 },
  otpInput:      { flex: 1, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, textAlign: "center", letterSpacing: 4, backgroundColor: "#f9fafb" },
  sendOtpBtn:    { backgroundColor: BLUE, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, justifyContent: "center" },
  sendOtpText:   { color: "#fff", fontWeight: "600", fontSize: 12 },

  confirmBtn:    { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12 },
  confirmBtnText:{ fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:   { opacity: 0.5 },

  biometricRow:  { alignItems: "center", gap: 5, marginBottom: 14 },
  biometricLabel:{ fontSize: 12, color: "#6b7280" },

  cancelBtn:     { alignItems: "center", paddingVertical: 10 },
  cancelText:    { fontSize: 13, color: "#9ca3af" },

  // Success
  successWrap:   { alignItems: "center", paddingVertical: 16 },
  successIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  successTitle:  { fontSize: 18, fontWeight: "800", color: BRAND, marginBottom: 6 },
  successSub:    { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 24 },
});
