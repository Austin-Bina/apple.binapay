import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVerifyPhoneOtpMutation, useSendPhoneOtpMutation } from "@store/redux-api/kycApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_OTP>;

export default function OtpEntryScreen({ navigation, route }: Props) {
  const { phone } = route.params;
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const [otp, setOtp]         = useState("");
  const [cooldown, setCooldown] = useState(25);
  const [verifyOtp, { isLoading }] = useVerifyPhoneOtpMutation();
  const [sendOtp, { isLoading: resending }] = useSendPhoneOtpMutation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handlePress = (key: string) => {
    if (key === "⌫") {
      setOtp(o => o.slice(0, -1));
    } else if (otp.length < 6) {
      const next = otp + key;
      setOtp(next);
      if (next.length === 6) handleVerify(next);
    }
  };

  const handleVerify = async (code: string) => {
  try {
    const result = await verifyOtp({ otp: code }).unwrap();
    // result is full UserResource — update ALL user fields at once
    dispatch(authSliceActions.updateUser(result));
    showToast({ variant: "success", message: "Phone verified successfully!" });
    navigation.navigate(SCREENS.BVN_NIN_CHOICE);
  } catch (e: any) {
    showToast({ variant: "error", message: e?.data?.message ?? "Invalid OTP." });
    setOtp("");
  }
};

  const handleResend = async () => {
    try {
      await sendOtp({ phone }).unwrap();
      setCooldown(30);
      showToast({ variant: "success", message: "OTP resent." });
    } catch {
      showToast({ variant: "error", message: "Failed to resend." });
    }
  };

  const KEYS = [
    ["1","2","3"],
    ["4","5","6"],
    ["7","8","9"],
    ["","0","⌫"],
  ];

  return (
    <View style={[s.root]}>
      <ScreenHeader
  title="Enter OTP"
  onBack={() => navigation.goBack()}
/>
      <View style={s.body}>
        <Text style={s.title}>Enter the 6-digit code sent to</Text>
        <Text style={s.phone}>{phone}</Text>

        {/* OTP dots */}
        <View style={s.dotsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[s.dot, i < otp.length && s.dotFilled]}>
              {i < otp.length && <View style={s.dotInner} />}
            </View>
          ))}
        </View>

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={cooldown > 0 || resending}
          style={s.resendRow}
        >
          <Text style={[s.resendText, cooldown > 0 && { color: "#9ca3af" }]}>
            {cooldown > 0 ? `Resend code in 0:${cooldown.toString().padStart(2, "0")}` : "Resend code"}
          </Text>
        </TouchableOpacity>

        {/* Numpad */}
        <View style={s.numpad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={s.numpadRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[s.numKey, !key && s.numKeyEmpty]}
                  onPress={() => key && handlePress(key)}
                  disabled={!key || isLoading}
                >
                  <Text style={s.numKeyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Verify button */}
        <TouchableOpacity
          style={[s.btn, (otp.length < 6 || isLoading) && s.btnDisabled]}
          onPress={() => handleVerify(otp)}
          disabled={otp.length < 6 || isLoading}
        >
          <Text style={s.btnText}>{isLoading ? "Verifying..." : "Verify Phone Number"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#fff" },
  header:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", color: BRAND },
  body:        { flex: 1, padding: 24, alignItems: "center" },
  title:       { fontSize: 15, color: "#6b7280", textAlign: "center", marginTop: 20 },
  phone:       { fontSize: 18, fontWeight: "700", color: BRAND, marginTop: 4, marginBottom: 32 },
  dotsRow:     { flexDirection: "row", gap: 14, marginBottom: 16 },
  dot:         { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: "#e5e7eb", backgroundColor: "#f9fafb", justifyContent: "center", alignItems: "center" },
  dotFilled:   { borderColor: BLUE, backgroundColor: "#EEF3FF" },
  dotInner:    { width: 14, height: 14, borderRadius: 7, backgroundColor: BLUE },
  resendRow:   { marginBottom: 32 },
  resendText:  { fontSize: 14, color: BLUE, fontWeight: "600" },
  numpad:      { width: "100%", gap: 12, marginBottom: 24 },
  numpadRow:   { flexDirection: "row", justifyContent: "center", gap: 16 },
  numKey:      { width: 76, height: 56, borderRadius: 14, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  numKeyEmpty: { backgroundColor: "transparent" },
  numKeyText:  { fontSize: 22, fontWeight: "600", color: "#111827" },
  btn:         { width: "100%", backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: "700", color: "#fff" },
});
