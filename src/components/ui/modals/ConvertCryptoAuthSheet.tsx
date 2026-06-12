import React, { forwardRef, useRef, useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Crypto from "expo-crypto";
import API from "@lib/api";
import { routes } from "@constants/routes";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import { showToast } from "@helpers/toast";
import { formattedBalance } from "@utils/transactionutils";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

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
    // ── All original state + logic — untouched ──────────────────────────────
    const [pin, setPin]                   = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [remaining, setRemaining]       = useState<number>(ttlSeconds);

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
        if (err.response?.status === 403)
          showToast({ variant: "warning", message: "Your account is temporarily blocked. Please contact support." });
        else if (err.response?.status === 400)
          showToast({ variant: "warning", message: "Invalid transaction PIN." });
        else
          showToast({ title: "Conversion Failed", message: err.response?.data?.message ?? "Conversion failed, please try again.", variant: "error" });
      } finally { setIsProcessing(false); }
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
        if (err.response?.status === 403)
          showToast({ variant: "warning", message: "Your account is temporarily blocked." });
        else if (err.response?.status === 401)
          showToast({ variant: "warning", message: "Biometric authentication failed." });
        else
          showToast({ title: "Conversion Failed", message: err.response?.data?.message ?? "Conversion failed, please try again.", variant: "error" });
      } finally { setIsProcessing(false); }
    };

    return (
      <BottomSheetModal
        ref={ref}
        headerTitle="Confirm Conversion"
        initialSnapPoints={["60%"]}
        index={0}
        onDismiss={onClose}>

        <View style={s.wrap}>

          {/* Timer */}
          <View style={s.timerRow}>
            <MaterialCommunityIcons name="clock-outline" size={14} color="#DC2626" />
            <Text style={s.timerText}>Rate expires in {remaining}s</Text>
          </View>

          {/* PIN label */}
          <Text style={s.inputLabel}>Transaction PIN</Text>

          {/* PIN input */}
          <TextInput
            value={pin}
            onChangeText={setPin}
            secureTextEntry
            keyboardType="numeric"
            maxLength={4}
            placeholder="· · · ·"
            placeholderTextColor={SUBLABEL}
            style={s.pinInput}
            autoFocus
          />

          {/* Confirm button */}
          <TouchableOpacity
            onPress={submitWithPin}
            disabled={!pin || isProcessing}
            style={[s.confirmBtn, (!pin || isProcessing) && s.disabledBtn]}
            activeOpacity={0.85}>
            <Text style={s.confirmBtnText}>Confirm Conversion</Text>
          </TouchableOpacity>

          {/* Biometric */}
          <TouchableOpacity
            onPress={submitWithBiometrics}
            style={s.biometricRow}
            activeOpacity={0.7}>
            <View style={s.biometricIconWrap}>
              <MaterialCommunityIcons name="fingerprint" size={28} color={BLUE} />
            </View>
            <Text style={s.biometricLabel}>Use Face ID / Touch ID</Text>
          </TouchableOpacity>

          {/* Security note */}
          <View style={s.secureNote}>
            <MaterialCommunityIcons name="lock-outline" size={13} color={BLUE} />
            <Text style={s.secureText}>Protected by 256-bit encryption</Text>
          </View>

        </View>

        <PleaseWaitModal visible={isProcessing} />
      </BottomSheetModal>
    );
  }
);

const s = StyleSheet.create({
  wrap:             { padding: 20 },

  // Timer
  timerRow:         { flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginBottom: 20, backgroundColor: "#FEF2F2", borderRadius: 10, paddingVertical: 9, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FECACA" },
  timerText:        { fontSize: 13, color: "#DC2626", fontWeight: "600" },

  // PIN
  inputLabel:       { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  pinInput:         { borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14, fontSize: 24, textAlign: "center", letterSpacing: 14, color: LABEL, backgroundColor: BG, marginBottom: 16 },

  // Confirm
  confirmBtn:       { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  confirmBtnText:   { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:      { opacity: 0.5 },

  // Biometric
  biometricRow:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14 },
  biometricIconWrap:{ width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  biometricLabel:   { fontSize: 14, color: BLUE, fontWeight: "600" },

  // Security note
  secureNote:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 4 },
  secureText:       { fontSize: 12, color: SUBLABEL },
});

export default ConvertCryptoAuthSheet;
