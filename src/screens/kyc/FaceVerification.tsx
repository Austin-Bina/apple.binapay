import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSubmitTier2Mutation } from "@store/redux-api/kycApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.FACE_VERIFICATION>;

export default function FaceVerificationScreen({ navigation }: Props) {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const [submitTier2, { isLoading }] = useSubmitTier2Mutation();

  // In production: integrate expo-camera or a face SDK here
  // For now: placeholder with checklist + continue button
  const handleContinue = async () => {
    // When camera is integrated, pass real bvn + selfie base64
    // For now navigate to address verification
    navigation.navigate(SCREENS.ADDRESS_VERIFICATION);
  };

  const checks = [
    "Make sure your face is well lit",
    "Remove glasses or face coverings",
    "Look directly at the camera",
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Face Verification</Text>
          <Text style={s.headerSub}>Verify your face</Text>
        </View>
      </View>

      <View style={s.body}>
        <Text style={s.title}>Let's Verify Your Face</Text>
        <Text style={s.subtitle}>
          This helps us to confirm that you are the real owner of this account.
        </Text>

        {/* Camera circle placeholder */}
        <View style={s.cameraCircle}>
          <MaterialCommunityIcons name="face-recognition" size={72} color={BLUE} />
          <View style={s.cameraRing} />
        </View>

        {/* Checklist */}
        <View style={s.checkList}>
          {checks.map((c) => (
            <View key={c} style={s.checkRow}>
              <MaterialCommunityIcons name="check-circle-outline" size={18} color="#16a34a" />
              <Text style={s.checkText}>{c}</Text>
            </View>
          ))}
        </View>

        <Text style={s.poweredBy}>Powered by our verification partner 🔒</Text>
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.btn} onPress={handleContinue} disabled={isLoading}>
          <Text style={s.btnText}>{isLoading ? "Processing..." : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#fff" },
  header:      { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:     { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:   { fontSize: 12, color: "#6b7280" },
  body:        { flex: 1, padding: 24, alignItems: "center" },
  title:       { fontSize: 20, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8, marginTop: 12 },
  subtitle:    { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 32 },
  cameraCircle:{ width: 160, height: 160, borderRadius: 80, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginBottom: 32, position: "relative" },
  cameraRing:  { position: "absolute", width: 170, height: 170, borderRadius: 85, borderWidth: 3, borderColor: BLUE, borderStyle: "dashed" },
  checkList:   { width: "100%", gap: 12, marginBottom: 24 },
  checkRow:    { flexDirection: "row", alignItems: "center", gap: 10 },
  checkText:   { fontSize: 14, color: "#374151" },
  poweredBy:   { fontSize: 12, color: "#9ca3af" },
  footer:      { paddingHorizontal: 16, paddingTop: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  btn:         { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  btnText:     { fontSize: 16, fontWeight: "700", color: "#fff" },
});
