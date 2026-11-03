import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Vibration, Alert } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import API from "@lib/api";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";

const BLUE = "#2563EB", BLUE_LIGHT = "#EEF3FF", BG = "#F8F9FB", SURFACE = "#FFFFFF";
const LABEL = "#111827", SUBLABEL = "#6B7280", SEPARATOR = "#E5E7EB", ERROR = "#DC2626";
const MAX_LENGTH = 4;

type Props = { onUnlock: () => void };

export default function AppLockScreen({ onUnlock }: Props) {
  const insets     = useSafeAreaInsets();
  const dispatch   = useTypedDispatch();
  const navigation = useNavigation();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => { tryBiometrics(); }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const tryBiometrics = async () => {
    try {
      await authenticateWithBiometrics();
      onUnlock();
    } catch {
      // Declined or unavailable — stay on PIN entry silently
    }
  };

  const triggerError = (message: string) => {
    const next = failCount + 1;
    setFailCount(next);
    setError(message);
    setShake(true);
    Vibration.vibrate(200);
    if (next >= 2) setCooldown(60);
    setTimeout(() => { setShake(false); setPin(""); }, 500);
  };

  const verifyPin = useCallback(async (enteredPin: string) => {
    try {
      setFetching(true);
      await API.post("/api/v1/auth/verify-pin", { pin: enteredPin });
      onUnlock();
    } catch (err: any) {
      triggerError(err?.response?.data?.errors?.pin?.[0] ?? "Incorrect PIN");
    } finally {
      setFetching(false);
    }
  }, [onUnlock]);

  const handlePress = (digit: string) => {
    if (pin.length >= MAX_LENGTH || cooldown > 0) return;
    setError("");
    const next = pin + digit;
    setPin(next);
    if (next.length === MAX_LENGTH) verifyPin(next);
  };

  const handleDelete = () => { setError(""); setPin((p) => p.slice(0, -1)); };

  const handleLogout = () => {
  Alert.alert(
    "Log Out",
    "Are you sure you want to log out?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          await dispatch(authSliceActions.logout());
        },
      },
    ],
    { cancelable: true }
  );
};

  const handleHelp = () => {
    navigation.navigate("Help" as never);
  };

  const handleForgotPin = () => {
    navigation.navigate("ForgotPin" as never);
  };

  const numpad = [["1","2","3"],["4","5","6"],["7","8","9"],["bio","0","del"]];
  const hints  = ["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.topBar}>
        <TouchableOpacity onPress={handleLogout} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={s.topBarText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.helpBtn} onPress={handleHelp} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <MaterialCommunityIcons name="headset" size={16} color={SUBLABEL} />
          <Text style={s.topBarText}>Help</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        <View style={s.lockWrap}>
          <MaterialCommunityIcons name="shield-lock-outline" size={48} color={BLUE} />
        </View>
        <Text style={s.title}>Welcome Back</Text>
        <Text style={s.subtitle}>Enter your 4-digit PIN{"\n"}to continue</Text>
        <View style={[s.dotsRow, shake && s.dotsShake]}>
          {Array.from({ length: MAX_LENGTH }).map((_, i) => (
            <View key={i} style={[s.dot, i < pin.length && s.dotFilled, error && s.dotError]} />
          ))}
        </View>
        {!!error && <Text style={s.errorText}>{error}</Text>}
        {cooldown > 0 && (
          <Text style={s.cooldownText}>Too many failed attempts. Please wait {cooldown}s before retrying.</Text>
        )}
        <TouchableOpacity style={s.forgotBtn} activeOpacity={0.7} onPress={handleForgotPin}>
          <Text style={s.forgotText}>Forgot PIN?</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.numpad, { paddingBottom: insets.bottom + 16 }]}>
        {numpad.map((row, ri) => (
          <View key={ri} style={s.numpadRow}>
            {row.map((key, ki) => {
              if (key === "bio") return (
                <TouchableOpacity key={ki} style={s.numpadKey} onPress={tryBiometrics} activeOpacity={0.6} disabled={fetching || cooldown > 0}>
                  <MaterialCommunityIcons name="fingerprint" size={28} color={BLUE} />
                </TouchableOpacity>
              );
              if (key === "del") return (
                <TouchableOpacity key={ki} style={s.numpadKey} onPress={handleDelete} activeOpacity={0.6} disabled={fetching || cooldown > 0}>
                  <MaterialCommunityIcons name="backspace-outline" size={24} color={LABEL} />
                </TouchableOpacity>
              );
              return (
                <TouchableOpacity key={ki} style={s.numpadKey} onPress={() => handlePress(key)} activeOpacity={0.6} disabled={fetching || cooldown > 0}>
                  <Text style={s.numpadDigit}>{key}</Text>
                  <Text style={s.numpadHint}>{hints[parseInt(key)] ?? ""}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 8 },
  topBarText: { fontSize: 14, color: LABEL, fontWeight: "500" },
  helpBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  body: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  lockWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: LABEL, marginBottom: 8, letterSpacing: -0.4 },
  subtitle: { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 20, marginBottom: 32 },
  dotsRow: { flexDirection: "row", gap: 16, marginBottom: 12 },
  dotsShake: { transform: [{ translateX: 6 }] },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: SEPARATOR, backgroundColor: "transparent" },
  dotFilled: { backgroundColor: BLUE, borderColor: BLUE },
  dotError: { borderColor: ERROR, backgroundColor: ERROR },
  errorText: { fontSize: 13, color: ERROR, fontWeight: "500", marginBottom: 8 },
  cooldownText: { fontSize: 12, color: SUBLABEL, textAlign: "center", marginTop: 4 },
  forgotBtn: { marginTop: 4 },
  forgotText: { fontSize: 14, color: BLUE, fontWeight: "600" },
  numpad: { backgroundColor: SURFACE, borderTopWidth: 1, borderTopColor: SEPARATOR, paddingTop: 16 },
  numpadRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 4 },
  numpadKey: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center" },
  numpadDigit: { fontSize: 24, fontWeight: "400", color: LABEL },
  numpadHint: { fontSize: 9, color: SUBLABEL, letterSpacing: 1, marginTop: 1 },
});
