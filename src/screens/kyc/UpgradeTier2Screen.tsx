import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.UPGRADE_TIER2>;

export default function UpgradeTier2Screen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Upgrade to Tier 2</Text>
      </View>

      <View style={s.body}>
        {/* Banner */}
        <View style={s.banner}>
          <MaterialCommunityIcons name="shield-crown-outline" size={48} color={BLUE} />
          <Text style={s.bannerTitle}>Unlock Higher Limits</Text>
          <Text style={s.bannerSub}>
            Complete Tier 2 verification to enjoy higher transaction and crypto limits.
          </Text>
        </View>

        <Text style={s.requireTitle}>Tier 2 Requirements</Text>

        <TouchableOpacity
          style={s.reqRow}
          onPress={() => navigation.navigate(SCREENS.FACE_VERIFICATION)}
          activeOpacity={0.8}
        >
          <View style={s.reqIcon}>
            <MaterialCommunityIcons name="face-recognition" size={24} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.reqTitle}>Face Verification</Text>
            <Text style={s.reqSub}>Verify your face to confirm you are the real owner of this account.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.reqRow}
          onPress={() => navigation.navigate(SCREENS.ADDRESS_VERIFICATION)}
          activeOpacity={0.8}
        >
          <View style={s.reqIcon}>
            <MaterialCommunityIcons name="home-city-outline" size={24} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.reqTitle}>Address Verification</Text>
            <Text style={s.reqSub}>Verify your residential address.</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.startBtn}
          onPress={() => navigation.navigate(SCREENS.FACE_VERIFICATION)}
        >
          <Text style={s.startBtnText}>Start Tier 2 Verification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "#f8f9fb" },
  header:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:  { fontSize: 17, fontWeight: "700", color: BRAND },
  body:         { flex: 1, padding: 20 },
  banner:       { backgroundColor: "#EEF3FF", borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 24 },
  bannerTitle:  { fontSize: 18, fontWeight: "800", color: BRAND, marginTop: 12, marginBottom: 6 },
  bannerSub:    { fontSize: 13, color: "#6b7280", textAlign: "center" },
  requireTitle: { fontSize: 15, fontWeight: "700", color: BRAND, marginBottom: 14 },
  reqRow:       { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  reqIcon:      { width: 46, height: 46, borderRadius: 23, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  reqTitle:     { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 3 },
  reqSub:       { fontSize: 12, color: "#6b7280" },
  startBtn:     { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  startBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
