// ═══════════════════════════════════════════════════════════════════════════
// FaceVerificationScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVerifyPhoneOtpMutation, useSendPhoneOtpMutation, useSubmitTier2Mutation } from "@store/redux-api/kycApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

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
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

// ─────────────────────────────────────────────────────────────────────────────
type FaceProps = KYCStackScreenProps<typeof SCREENS.FACE_VERIFICATION>;

export function FaceVerificationScreen({ navigation }: FaceProps) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const [submitTier2, { isLoading }] = useSubmitTier2Mutation();

  // ── All original logic — untouched ────────────────────────────────────────
  const handleContinue = async () => { navigation.navigate(SCREENS.ADDRESS_VERIFICATION); };

  const checks = [
    "Make sure your face is well lit",
    "Remove glasses or face coverings",
    "Look directly at the camera",
  ];

  return (
    <View style={[fv.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={fv.navBar}>
        <TouchableOpacity style={fv.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={fv.navCenter}>
          <Text style={fv.navTitle}>Face Verification</Text>
          <Text style={fv.navSub}>Confirm your identity</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={fv.body}>
        <Text style={fv.title}>Let's Verify Your Face</Text>
        <Text style={fv.subtitle}>This confirms you are the real owner of this account.</Text>

        {/* Camera circle */}
        <View style={fv.cameraWrap}>
          <View style={fv.cameraCircle}>
            <MaterialCommunityIcons name="face-recognition" size={72} color={BLUE} />
          </View>
          <View style={fv.cameraRing} />
        </View>

        {/* Checklist */}
        <View style={[fv.checkCard, IOS_SHADOW]}>
          {checks.map((c, i) => (
            <React.Fragment key={c}>
              {i > 0 && <View style={fv.hairline} />}
              <View style={fv.checkRow}>
                <View style={fv.checkIconWrap}>
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#16A34A" />
                </View>
                <Text style={fv.checkText}>{c}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={fv.poweredBy}>Powered by our verification partner 🔒</Text>
      </View>

      <View style={[fv.footer, { paddingBottom: insets.bottom + 16 }, IOS_SHEET_SHADOW]}>
        <TouchableOpacity style={[fv.btn, isLoading && fv.btnDisabled]} onPress={handleContinue}
          disabled={isLoading} activeOpacity={0.85}>
          <Text style={fv.btnText}>{isLoading ? "Processing…" : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const fv = StyleSheet.create({
  root:          { flex: 1, backgroundColor: SURFACE },
  navBar:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:     { flex: 1, alignItems: "center" },
  navTitle:      { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:        { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  body:          { flex: 1, paddingHorizontal: 24, alignItems: "center", justifyContent: "center" },
  title:         { fontSize: 22, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8, letterSpacing: -0.4 },
  subtitle:      { fontSize: 14, color: SUBLABEL, textAlign: "center", marginBottom: 28, lineHeight: 20 },
  cameraWrap:    { position: "relative", marginBottom: 32 },
  cameraCircle:  { width: 160, height: 160, borderRadius: 80, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  cameraRing:    { position: "absolute", width: 174, height: 174, top: -7, left: -7, borderRadius: 87, borderWidth: 3, borderColor: BLUE, borderStyle: "dashed" },
  checkCard:     { width: "100%", backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 20 },
  hairline:      { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 56 },
  checkRow:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  checkIconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#F0FDF4", justifyContent: "center", alignItems: "center" },
  checkText:     { fontSize: 14, color: LABEL },
  poweredBy:     { fontSize: 12, color: PLACEHOLDER },
  footer:        { paddingHorizontal: 16, paddingTop: 12, backgroundColor: SURFACE, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  btn:           { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  btnDisabled:   { opacity: 0.5 },
  btnText:       { fontSize: 16, fontWeight: "700", color: SURFACE },
});

// ═══════════════════════════════════════════════════════════════════════════
// OtpEntryScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
type OtpProps = KYCStackScreenProps<typeof SCREENS.VERIFICATION_OTP>;

export function OtpEntryScreen({ navigation, route }: OtpProps) {
  const { phone } = route.params;
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();

  // ── All original state + logic — untouched ────────────────────────────────
  const [otp, setOtp]           = useState("");
  const [cooldown, setCooldown] = useState(25);
  const [verifyOtp, { isLoading }]          = useVerifyPhoneOtpMutation();
  const [sendOtp, { isLoading: resending }] = useSendPhoneOtpMutation();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const handlePress = (key: string) => {
    if (key === "⌫") { setOtp(o => o.slice(0, -1)); }
    else if (otp.length < 6) {
      const next = otp + key; setOtp(next);
      if (next.length === 6) handleVerify(next);
    }
  };

  const handleVerify = async (code: string) => {
    try {
      const result = await verifyOtp({ otp: code }).unwrap();
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
    } catch { showToast({ variant: "error", message: "Failed to resend." }); }
  };

  const KEYS = [["1","2","3"],["4","5","6"],["7","8","9"],["","0","⌫"]];

  return (
    <View style={[otp_s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={otp_s.navBar}>
        <TouchableOpacity style={otp_s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={otp_s.navTitle}>Enter OTP</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={otp_s.body}>
        <Text style={otp_s.title}>Enter the 6-digit code sent to</Text>
        <Text style={otp_s.phone}>{phone}</Text>

        {/* OTP boxes */}
        <View style={otp_s.dotsRow}>
          {Array.from({ length: 6 }).map((_, i) => (
            <View key={i} style={[otp_s.dot, i < otp.length && otp_s.dotFilled]}>
              {i < otp.length && <View style={otp_s.dotInner} />}
            </View>
          ))}
        </View>

        {/* Resend */}
        <TouchableOpacity onPress={handleResend} disabled={cooldown > 0 || resending} style={otp_s.resendRow}>
          <Text style={[otp_s.resendText, cooldown > 0 && { color: PLACEHOLDER }]}>
            {cooldown > 0 ? `Resend code in 0:${cooldown.toString().padStart(2, "0")}` : "Resend code"}
          </Text>
        </TouchableOpacity>

        {/* Numpad */}
        <View style={otp_s.numpad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={otp_s.numpadRow}>
              {row.map((key, ki) => (
                <TouchableOpacity key={ki} style={[otp_s.numKey, !key && otp_s.numKeyEmpty]}
                  onPress={() => key && handlePress(key)} disabled={!key || isLoading} activeOpacity={0.7}>
                  <Text style={otp_s.numKeyText}>{key}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={[otp_s.btn, (otp.length < 6 || isLoading) && otp_s.btnDisabled]}
          onPress={() => handleVerify(otp)} disabled={otp.length < 6 || isLoading} activeOpacity={0.85}>
          <Text style={otp_s.btnText}>{isLoading ? "Verifying…" : "Verify Phone Number"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const otp_s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: SURFACE },
  navBar:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:    { fontSize: 17, fontWeight: "700", color: BRAND },
  body:        { flex: 1, paddingHorizontal: 24, alignItems: "center", paddingTop: 32 },
  title:       { fontSize: 15, color: SUBLABEL, textAlign: "center" },
  phone:       { fontSize: 18, fontWeight: "700", color: BRAND, marginTop: 4, marginBottom: 32 },
  dotsRow:     { flexDirection: "row", gap: 12, marginBottom: 16 },
  dot:         { width: 48, height: 56, borderRadius: 12, borderWidth: 2, borderColor: SEPARATOR, backgroundColor: BG, justifyContent: "center", alignItems: "center" },
  dotFilled:   { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  dotInner:    { width: 14, height: 14, borderRadius: 7, backgroundColor: BLUE },
  resendRow:   { marginBottom: 32 },
  resendText:  { fontSize: 14, color: BLUE, fontWeight: "600" },
  numpad:      { width: "100%", gap: 12, marginBottom: 24 },
  numpadRow:   { flexDirection: "row", justifyContent: "center", gap: 14 },
  numKey:      { width: 78, height: 58, borderRadius: 14, backgroundColor: BG, justifyContent: "center", alignItems: "center" },
  numKeyEmpty: { backgroundColor: "transparent" },
  numKeyText:  { fontSize: 22, fontWeight: "600", color: LABEL },
  btn:         { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontSize: 16, fontWeight: "700", color: SURFACE },
});

// ═══════════════════════════════════════════════════════════════════════════
// PhoneVerificationScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
type PhoneProps = KYCStackScreenProps<typeof SCREENS.PHONE_VERIFICATION>;

export function PhoneVerificationScreen({ navigation }: PhoneProps) {
  const insets = useSafeAreaInsets();

  // ── All original state + logic — untouched ────────────────────────────────
  const [phone, setPhone]                   = useState("");
  const [sendOtp, { isLoading }]            = useSendPhoneOtpMutation();

  const handleSend = async () => {
    if (!phone || phone.length < 10) { showToast({ variant: "warning", message: "Enter a valid phone number." }); return; }
    try {
      await sendOtp({ phone }).unwrap();
      navigation.navigate(SCREENS.VERIFICATION_OTP, { phone });
    } catch (e: any) { showToast({ variant: "error", message: e?.data?.message ?? "Failed to send OTP." }); }
  };

  return (
    <View style={[pv.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={pv.navBar}>
        <TouchableOpacity style={pv.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={pv.navTitle}>Verify Phone Number</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={pv.body}>
        <View style={pv.heroCircle}>
          <MaterialCommunityIcons name="cellphone-message" size={72} color={BLUE} />
        </View>
        <Text style={pv.title}>Secure Your Account</Text>
        <Text style={pv.subtitle}>Verify your phone number to start using BinaPay.</Text>

        <Text style={pv.inputLabel}>Phone Number</Text>
        <View style={[pv.inputWrap, IOS_SHADOW]}>
          <View style={pv.flag}><Text style={pv.flagText}>🇳🇬</Text></View>
          <TextInput style={pv.input} placeholder="080 1234 5678" placeholderTextColor={PLACEHOLDER}
            value={phone} onChangeText={setPhone} keyboardType="phone-pad" maxLength={14} />
        </View>
        <Text style={pv.hint}>We will send a 6-digit code to this number.</Text>

        <TouchableOpacity style={[pv.btn, (!phone || isLoading) && pv.btnDisabled]}
          onPress={handleSend} disabled={!phone || isLoading} activeOpacity={0.85}>
          <Text style={pv.btnText}>{isLoading ? "Sending…" : "Send OTP"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pv = StyleSheet.create({
  root:       { flex: 1, backgroundColor: SURFACE },
  navBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:   { fontSize: 17, fontWeight: "700", color: BRAND },
  body:       { flex: 1, paddingHorizontal: 24, alignItems: "center", paddingTop: 32 },
  heroCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  title:      { fontSize: 24, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8, letterSpacing: -0.4 },
  subtitle:   { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 20, marginBottom: 32 },
  inputLabel: { alignSelf: "flex-start", fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap:  { flexDirection: "row", alignItems: "center", width: "100%", borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 14, marginBottom: 8, backgroundColor: BG },
  flag:       { paddingHorizontal: 14, paddingVertical: 14, borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: SEPARATOR },
  flagText:   { fontSize: 20 },
  input:      { flex: 1, fontSize: 16, color: LABEL, paddingHorizontal: 14, paddingVertical: 14 },
  hint:       { alignSelf: "flex-start", fontSize: 12, color: PLACEHOLDER, marginBottom: 32 },
  btn:        { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  btnDisabled:{ opacity: 0.5 },
  btnText:    { fontSize: 16, fontWeight: "700", color: SURFACE },
});

export default FaceVerificationScreen;
