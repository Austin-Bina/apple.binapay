import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import { CommonActions } from "@react-navigation/native";

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

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_SUCCESS>;

export default function VerificationSuccessScreen({ navigation, route }: Props) {
  const { tier } = route.params;
  const insets   = useSafeAreaInsets();

  // ── All original logic — untouched ────────────────────────────────────────
  const perks = tier === 1
    ? ["Send and receive money", "Buy and sell crypto", "Pay bills and buy airtime", "Enjoy basic account limits"]
    : ["Higher transfer limits", "Larger wallet balance limit", "Increased crypto limits", "Access all features"];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn}
          onPress={() => navigation.navigate(SCREENS.VERIFICATION_HUB)}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Tier {tier} Complete!</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={s.body}>
        {/* Medal + confetti dots */}
        <View style={s.badgeWrap}>
          <View style={s.badge}>
            <MaterialCommunityIcons name="medal" size={64} color={BLUE} />
          </View>
          <View style={s.dot1} />
          <View style={s.dot2} />
          <View style={s.dot3} />
        </View>

        <Text style={s.congrats}>Congratulations! 🎉</Text>
        <Text style={s.subtitle}>
          You have successfully completed Tier {tier} verification.
        </Text>

        {/* Perks card */}
        <View style={[s.perksCard, IOS_SHADOW]}>
          <Text style={s.perksTitle}>What you can do now</Text>
          {perks.map((perk) => (
            <View key={perk} style={s.perkRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
              <Text style={s.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {/* Tier 1 → upgrade CTA */}
        {tier === 1 && (
          <TouchableOpacity
            style={s.upgradeBtn}
            onPress={() => navigation.navigate(SCREENS.UPGRADE_TIER2)}
            activeOpacity={0.85}>
            <Text style={s.upgradeBtnText}>Upgrade to Tier 2</Text>
          </TouchableOpacity>
        )}

        {/* Dashboard */}
        <TouchableOpacity
          style={[s.dashBtn, tier === 1 && { marginTop: 12 }]}
          onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: SCREENS.MAIN }] }))}
          activeOpacity={0.85}>
          <Text style={s.dashBtnText}>Continue to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: SURFACE },
  navBar:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:       { fontSize: 17, fontWeight: "700", color: BRAND },
  body:           { flex: 1, paddingHorizontal: 24, alignItems: "center", paddingTop: 32 },
  // Medal
  badgeWrap:      { position: "relative", marginBottom: 24 },
  badge:          { width: 120, height: 120, borderRadius: 60, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  dot1:           { position: "absolute", width: 12, height: 12, borderRadius: 6,  backgroundColor: "#FBBF24", top: 8,   right: -4  },
  dot2:           { position: "absolute", width: 8,  height: 8,  borderRadius: 4,  backgroundColor: "#34D399", bottom: 10, left: -8 },
  dot3:           { position: "absolute", width: 10, height: 10, borderRadius: 5,  backgroundColor: "#F87171", top: 20,  left: -12  },
  // Text
  congrats:       { fontSize: 26, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8, letterSpacing: -0.5 },
  subtitle:       { fontSize: 14, color: SUBLABEL, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  // Perks
  perksCard:      { width: "100%", backgroundColor: BG, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  perksTitle:     { fontSize: 14, fontWeight: "700", color: BRAND, marginBottom: 12 },
  perkRow:        { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  perkText:       { fontSize: 14, color: LABEL },
  // CTAs
  upgradeBtn:     { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  upgradeBtnText: { fontSize: 16, fontWeight: "700", color: SURFACE },
  dashBtn:        { width: "100%", borderWidth: 1.5, borderColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 24 },
  dashBtnText:    { fontSize: 16, fontWeight: "700", color: BLUE },
});
