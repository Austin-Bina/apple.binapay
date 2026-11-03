import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import { CommonActions } from "@react-navigation/native";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_SUCCESS>;

const CONFIG = {
  bvn: {
    title: "Tier 1 Completed!",
    icon: "medal",
    iconColor: BLUE,
    badgeBg: "#EEF3FF",
    congrats: "Congratulations! 🎉",
    subtitle: "You have successfully completed Tier 1 verification.",
    perksTitle: "What you can do now",
    perks: ["Send and receive money", "Buy and sell crypto", "Pay bills and buy airtime", "Enjoy basic account limits"],
    perkIcon: "check-circle",
    perkIconColor: "#16a34a",
  },
  nin: {
    title: "NIN Verified!",
    icon: "check-decagram",
    iconColor: "#16a34a",
    badgeBg: "#dcfce7",
    congrats: "Verification Successful! 🎉",
    subtitle: "Your NIN has been verified successfully.",
    perksTitle: "What's next",
    perks: ["NIN verification complete", "Complete address verification to finish Tier 2", "Unlock higher transaction limits"],
    perkIcon: "check-circle",
    perkIconColor: "#16a34a",
  },
  address: {
    title: "Document Submitted!",
    icon: "clock-check-outline",
    iconColor: "#f59e0b",
    badgeBg: "#fef3c7",
    congrats: "Under Review 🕐",
    subtitle: "Your address document has been submitted and is currently under review. We'll notify you once it's verified, usually within 24 hours.",
    perksTitle: "What happens next",
    perks: ["Document received and queued for review", "You'll get a notification when verified", "No action needed from you"],
    perkIcon: "clock-outline",
    perkIconColor: "#f59e0b",
  },
} as const;

type SuccessKind = keyof typeof CONFIG;

export default function VerificationSuccessScreen({ navigation, route }: Props) {
  const { kind: kindParam, tier } = route.params as { kind?: SuccessKind; tier?: number };
  // Fallback for any old navigate calls that still only pass tier
  const kind: SuccessKind = kindParam ?? (tier === 2 ? "address" : "bvn");
  const c = CONFIG[kind];

  return (
    <View style={s.root}>
      <ScreenHeader
        title={c.title}
        onBack={() => navigation.navigate(SCREENS.VERIFICATION_HUB)}
        rightIcon="shield-check-outline"
      />

      <View style={s.body}>
        <View style={s.badgeWrap}>
          <View style={[s.badge, { backgroundColor: c.badgeBg }]}>
            <MaterialCommunityIcons name={c.icon as any} size={60} color={c.iconColor} />
          </View>
          <View style={s.confettiDot1} />
          <View style={s.confettiDot2} />
          <View style={s.confettiDot3} />
        </View>

        <Text style={s.congrats}>{c.congrats}</Text>
        <Text style={s.subtitle}>{c.subtitle}</Text>

        <View style={s.perksCard}>
          <Text style={s.perksTitle}>{c.perksTitle}</Text>
          {c.perks.map((perk) => (
            <View key={perk} style={s.perkRow}>
              <MaterialCommunityIcons name={c.perkIcon as any} size={18} color={c.perkIconColor} />
              <Text style={s.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {kind === "bvn" && (
          <TouchableOpacity style={s.upgradeBtn} onPress={() => navigation.navigate(SCREENS.ADDRESS_VERIFICATION)}>
            <Text style={s.upgradeBtnText}>Upgrade to Tier 2</Text>
          </TouchableOpacity>
        )}

        {kind === "nin" && (
          <TouchableOpacity style={s.upgradeBtn} onPress={() => navigation.navigate(SCREENS.VERIFICATION_HUB)}>
            <Text style={s.upgradeBtnText}>Back to Verification</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[s.dashBtn, kind !== "address" && { marginTop: 12 }]}
          onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: SCREENS.MAIN }] }))}
        >
          <Text style={s.dashBtnText}>Continue to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: "#fff" },
  body:          { flex: 1, padding: 24, alignItems: "center" },
  badgeWrap:     { position: "relative", marginTop: 20, marginBottom: 24 },
  badge:         { width: 120, height: 120, borderRadius: 60, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  confettiDot1:  { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#fbbf24", top: 8, right: -4 },
  confettiDot2:  { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#34d399", bottom: 10, left: -8 },
  confettiDot3:  { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: "#f87171", top: 20, left: -12 },
  congrats:      { fontSize: 24, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8 },
  subtitle:      { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 24, lineHeight: 22 },
  perksCard:     { width: "100%", backgroundColor: "#f8f9fb", borderRadius: 16, padding: 16, marginBottom: 24 },
  perksTitle:    { fontSize: 14, fontWeight: "700", color: BRAND, marginBottom: 12 },
  perkRow:       { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  perkText:      { fontSize: 14, color: "#374151" },
  upgradeBtn:    { width: "100%", backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  upgradeBtnText:{ fontSize: 16, fontWeight: "700", color: "#fff" },
  dashBtn:       { width: "100%", borderWidth: 1.5, borderColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 24 },
  dashBtnText:   { fontSize: 16, fontWeight: "700", color: BLUE },
});
