import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.BVN_NIN_CHOICE>;

export default function BvnNinChoiceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>BVN or NIN Verification</Text>
          <Text style={s.headerSub}>Tier 1 – Basic Verification</Text>
        </View>
      </View>

      {/* Progress indicator */}
      <View style={s.progressWrap}>
        <Text style={s.progressText}>2 of 3 completed</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: "66%" }]} />
        </View>
      </View>

      <View style={s.body}>
        <Text style={s.title}>Choose Verification Method</Text>
        <Text style={s.subtitle}>Select the option you want to use</Text>

        <TouchableOpacity
          style={s.optionCard}
          onPress={() => navigation.navigate(SCREENS.BVN_VERIFICATION)}
          activeOpacity={0.8}
        >
          <View style={[s.optionIcon, { backgroundColor: "#dcfce7" }]}>
            <MaterialCommunityIcons name="bank-outline" size={28} color="#16a34a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>BVN Verification</Text>
            <Text style={s.optionSub}>Use your BVN to verify your identity</Text>
          </View>
          <View style={s.optionRadio}>
            <View style={s.optionRadioInner} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.optionCard, s.optionCardUnselected]}
          onPress={() => navigation.navigate(SCREENS.NIN_VERIFICATION)}
          activeOpacity={0.8}
        >
          <View style={[s.optionIcon, { backgroundColor: "#EEF3FF" }]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={28} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>NIN Verification</Text>
            <Text style={s.optionSub}>Use your National Identification Number</Text>
          </View>
          <View style={[s.optionRadio, s.optionRadioEmpty]} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.continueBtn}
          onPress={() => navigation.navigate(SCREENS.VERIFICATION_HUB)}
        >
          <Text style={s.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#f8f9fb" },
  header:            { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:           { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:       { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:         { fontSize: 12, color: "#6b7280" },
  progressWrap:      { backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  progressText:      { fontSize: 12, color: "#6b7280", marginBottom: 6 },
  progressBar:       { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  progressFill:      { height: 6, backgroundColor: BLUE, borderRadius: 3 },
  body:              { flex: 1, padding: 20 },
  title:             { fontSize: 18, fontWeight: "700", color: BRAND, marginBottom: 6 },
  subtitle:          { fontSize: 13, color: "#6b7280", marginBottom: 24 },
  optionCard:        { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 2, borderColor: BLUE },
  optionCardUnselected: { borderColor: "#e5e7eb" },
  optionIcon:        { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  optionTitle:       { fontSize: 15, fontWeight: "600", color: "#111827", marginBottom: 3 },
  optionSub:         { fontSize: 12, color: "#6b7280" },
  optionRadio:       { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: BLUE, justifyContent: "center", alignItems: "center" },
  optionRadioInner:  { width: 12, height: 12, borderRadius: 6, backgroundColor: BLUE },
  optionRadioEmpty:  { borderColor: "#d1d5db" },
  continueBtn:       { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
  continueBtnText:   { fontSize: 16, fontWeight: "700", color: "#fff" },
});
