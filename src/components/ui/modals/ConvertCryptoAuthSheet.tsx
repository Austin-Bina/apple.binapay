import React, { forwardRef, useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheetModal from "./BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import API from "@lib/api";
import { routes } from "@constants/routes";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import { showToast } from "@helpers/toast";
import { formattedBalance } from "@utils/transactionutils";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = {
  payload: {
    from: string;
    to: string;
    amount: number;
    livePrices: any;
    liveNgnUsdt: any;
  };
  ttlSeconds: number;
  onExpired: () => void;
  onClose: () => void;
   onSuccess: (message: string) => void;
};

const ConvertCryptoAuthSheet = forwardRef<BottomSheetModalMethods, Props>(
  ({ payload, onClose, ttlSeconds, onExpired, onSuccess }, ref) => {
    const [pin, setPin]               = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [showSuccess, setShowSuccess]   = useState(false);
    const [successMessage, setSuccessMessage] = useState("");
    const [remaining, setRemaining]   = useState<number>(ttlSeconds);

    const idempotencyKeyRef = useRef(Crypto.randomUUID());
    const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

    useEffect(() => {
      if (remaining <= 0) { onExpired(); return; }
      const timer = setTimeout(() => setRemaining(p => p - 1), 1000);
      return () => clearTimeout(timer);
    }, [remaining]);

    const submitWithPin = async () => {
      if (!pin) return;
      setIsProcessing(true);
      try {
        API.defaults.baseURL = BASE_URL;
        const res = await API.post(
          routes.api.v1.auth.covertcrypto,
          { ...payload, pin },
          { headers: { "Idempotency-Key": idempotencyKeyRef.current } }
        );
       if (res.data.success) {
  const received = res.data.conversion?.to_amount;
  (ref as any).current?.dismiss();
  onSuccess(`You received ${formattedBalance(received, payload.to)}`);
} else {
          showToast({ title: "Conversion Failed", message: res.data?.error || "Conversion failed", variant: "error" });
        }
      } catch (err: any) {
        if (err.response?.status === 403) {
          showToast({ variant: "warning", message: "Your account is temporarily blocked. Please contact support." });
        } else if (err.response?.status === 400) {
          showToast({ variant: "warning", message: "Invalid transaction PIN." });
        } else {
          showToast({ title: "Conversion Failed", message: err.response?.data?.message ?? "Conversion failed, please try again.", variant: "error" });
        }
      } finally {
        setIsProcessing(false);
      }
    };

    const submitWithBiometrics = async () => {
      try {
        setIsProcessing(true);
        await authenticateWithBiometrics();
        API.defaults.baseURL = BASE_URL;
        const res = await API.post(
          routes.api.v1.auth.covertcrypto,
          { ...payload, biometric: true },
          { headers: { "Idempotency-Key": idempotencyKeyRef.current } }
        );
        if (res.data.success) {
  const received = res.data.conversion?.to_amount;
  (ref as any).current?.dismiss();
  onSuccess(`You received ${formattedBalance(received, payload.to)}`);
}
      } catch (err: any) {
        if (err.response?.status === 403) {
          showToast({ variant: "warning", message: "Your account is temporarily blocked. Please contact support." });
        } else if (err.response?.status === 401) {
          showToast({ variant: "warning", message: "Biometric authentication failed." });
        } else {
          showToast({ title: "Conversion Failed", message: err.response?.data?.message ?? "Conversion failed, please try again.", variant: "error" });
        }
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <BottomSheetModal
        ref={ref}
        headerTitle="Confirm Conversion"
        initialSnapPoints={["60%"]}
        index={0}
        onDismiss={onClose}
      >
        <View style={s.wrap}>
          {!showSuccess ? (
            <>
              {/* Timer */}
              <View style={s.timerRow}>
                <MaterialCommunityIcons name="clock-outline" size={14} color="#dc2626" />
                <Text style={s.timerText}>Rate expires in {remaining}s</Text>
              </View>

              {/* PIN input */}
              <Text style={s.inputLabel}>Transaction PIN</Text>
              <TextInput
                value={pin}
                onChangeText={setPin}
                secureTextEntry
                keyboardType="numeric"
                maxLength={4}
                placeholder="• • • •"
                placeholderTextColor="#d1d5db"
                style={s.pinInput}
              />

              {/* Confirm button */}
              <TouchableOpacity
                onPress={submitWithPin}
                disabled={!pin || isProcessing}
                style={[s.confirmBtn, (!pin || isProcessing) && s.disabledBtn]}
              >
                <Text style={s.confirmBtnText}>Confirm Conversion</Text>
              </TouchableOpacity>

              {/* Biometric */}
              <TouchableOpacity onPress={submitWithBiometrics} style={s.biometricRow}>
                <MaterialCommunityIcons name="fingerprint" size={40} color={BLUE} />
                <Text style={s.biometricLabel}>Use Biometric Instead</Text>
              </TouchableOpacity>
            </>
          ) : (
            /* ── Success state ── */
            <View style={s.successWrap}>
              <View style={s.successIcon}>
                <MaterialCommunityIcons name="check" size={36} color="#fff" />
              </View>
              <Text style={s.successTitle}>Conversion Successful</Text>
              <Text style={s.successSub}>{successMessage}</Text>
              <TouchableOpacity style={s.doneBtn} onPress={onClose}>
                <Text style={s.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <PleaseWaitModal visible={isProcessing} />
      </BottomSheetModal>
    );
  }
);

export default ConvertCryptoAuthSheet;

const s = StyleSheet.create({
  wrap:          { padding: 20 },

  timerRow:      { flexDirection: "row", alignItems: "center", gap: 5, justifyContent: "center", marginBottom: 16, backgroundColor: "#fee2e2", borderRadius: 8, paddingVertical: 6 },
  timerText:     { fontSize: 12, color: "#dc2626", fontWeight: "600" },

  inputLabel:    { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  pinInput:      { borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, fontSize: 22, textAlign: "center", letterSpacing: 12, color: "#111827", backgroundColor: "#f9fafb", marginBottom: 16 },

  confirmBtn:    { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 16 },
  confirmBtnText:{ fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:   { opacity: 0.5 },

  biometricRow:  { alignItems: "center", gap: 6 },
  biometricLabel:{ fontSize: 12, color: "#6b7280" },

  // Success
  successWrap:   { alignItems: "center", paddingVertical: 10 },
  successIcon:   { width: 64, height: 64, borderRadius: 32, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginBottom: 14 },
  successTitle:  { fontSize: 18, fontWeight: "800", color: BRAND, marginBottom: 6 },
  successSub:    { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 24 },
  doneBtn:       { width: "100%", backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  doneBtnText:   { fontSize: 15, fontWeight: "700", color: "#fff" },
});
