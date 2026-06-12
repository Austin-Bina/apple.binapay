import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
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

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

type Props = KYCStackScreenProps<typeof SCREENS.BVN_NIN_CHOICE>;

export default function BvnNinChoiceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>BVN or NIN Verification</Text>
          <Text style={s.navSub}>Tier 1 – Basic Verification</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Progress bar */}
      <View style={s.progressStrip}>
        <Text style={s.progressText}>2 of 3 completed</Text>
        <View style={s.progressBar}>
          <View style={[s.progressFill, { width: "66%" }]} />
        </View>
      </View>

      <View style={s.body}>
        <Text style={s.title}>Choose Verification Method</Text>
        <Text style={s.subtitle}>Select the option that applies to you</Text>

        {/* BVN option */}
        <TouchableOpacity
          style={[s.optionCard, s.optionCardSelected, IOS_SHADOW]}
          onPress={() => navigation.navigate(SCREENS.BVN_VERIFICATION)}
          activeOpacity={0.8}>
          <View style={[s.optionIcon, { backgroundColor: "#DCFCE7" }]}>
            <MaterialCommunityIcons name="bank-outline" size={26} color="#16A34A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>BVN Verification</Text>
            <Text style={s.optionSub}>Use your Bank Verification Number</Text>
          </View>
          <View style={s.radioSelected}>
            <View style={s.radioSelectedDot} />
          </View>
        </TouchableOpacity>

        {/* NIN option */}
        <TouchableOpacity
          style={[s.optionCard, IOS_SHADOW]}
          onPress={() => navigation.navigate(SCREENS.NIN_VERIFICATION)}
          activeOpacity={0.8}>
          <View style={[s.optionIcon, { backgroundColor: BLUE_LIGHT }]}>
            <MaterialCommunityIcons name="card-account-details-outline" size={26} color={BLUE} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.optionTitle}>NIN Verification</Text>
            <Text style={s.optionSub}>Use your National Identification Number</Text>
          </View>
          <View style={s.radioEmpty} />
        </TouchableOpacity>

        <TouchableOpacity
          style={s.continueBtn}
          onPress={() => navigation.navigate(SCREENS.BVN_VERIFICATION)}
          activeOpacity={0.85}>
          <Text style={s.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: BG },
  navBar:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:           { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:         { flex: 1, alignItems: "center" },
  navTitle:          { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:            { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  progressStrip:     { backgroundColor: SURFACE, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  progressText:      { fontSize: 12, color: SUBLABEL, marginBottom: 6 },
  progressBar:       { height: 6, backgroundColor: SEPARATOR, borderRadius: 3, overflow: "hidden" },
  progressFill:      { height: 6, backgroundColor: BLUE, borderRadius: 3 },
  body:              { flex: 1, padding: 20 },
  title:             { fontSize: 20, fontWeight: "800", color: BRAND, letterSpacing: -0.4, marginBottom: 6 },
  subtitle:          { fontSize: 14, color: SUBLABEL, marginBottom: 24 },
  optionCard:        { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1.5, borderColor: SEPARATOR },
  optionCardSelected:{ borderColor: BLUE, backgroundColor: "#F0F7FF" },
  optionIcon:        { width: 52, height: 52, borderRadius: 26, justifyContent: "center", alignItems: "center" },
  optionTitle:       { fontSize: 15, fontWeight: "600", color: LABEL, marginBottom: 3 },
  optionSub:         { fontSize: 12, color: SUBLABEL },
  radioSelected:     { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: BLUE, justifyContent: "center", alignItems: "center" },
  radioSelectedDot:  { width: 12, height: 12, borderRadius: 6, backgroundColor: BLUE },
  radioEmpty:        { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: "#D1D5DB" },
  continueBtn:       { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 8 },
  continueBtnText:   { fontSize: 16, fontWeight: "700", color: SURFACE },
});
