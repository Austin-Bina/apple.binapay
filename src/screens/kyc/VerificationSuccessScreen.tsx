import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import { CommonActions } from "@react-navigation/native";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_SUCCESS>;

export default function VerificationSuccessScreen({ navigation, route }: Props) {
  const { tier } = route.params;
  const insets   = useSafeAreaInsets();

  const perks = tier === 1
    ? ["Send and receive money", "Buy and sell crypto", "Pay bills and buy airtime", "Enjoy basic account limits"]
    : ["Higher transfer limits", "Larger wallet balance limit", "Increased crypto limits", "Access all features"];

    
  return (
    <View style={[s.root]}>
      
     <ScreenHeader
  title={`Tier ${tier} Completed!`}
  onBack={() => navigation.navigate(SCREENS.VERIFICATION_HUB)}
  rightIcon="shield-check-outline"
/>

      <View style={s.body}>
        {/* Badge */}
        <View style={s.badgeWrap}>
          <View style={s.badge}>
            <MaterialCommunityIcons name="medal" size={60} color={BLUE} />
          </View>
          <View style={s.confettiDot1} />
          <View style={s.confettiDot2} />
          <View style={s.confettiDot3} />
        </View>

        <Text style={s.congrats}>Congratulations! 🎉</Text>
        <Text style={s.subtitle}>
          You have successfully completed Tier {tier} verification.
        </Text>

        <View style={s.perksCard}>
          <Text style={s.perksTitle}>What you can do now</Text>
          {perks.map((perk) => (
            <View key={perk} style={s.perkRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#16a34a" />
              <Text style={s.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {tier === 1 && (
          <TouchableOpacity
            style={s.upgradeBtn}
            onPress={() => navigation.navigate(SCREENS.UPGRADE_TIER2)}
          >
            <Text style={s.upgradeBtnText}>Upgrade to Tier 2</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[s.dashBtn, tier === 1 && { marginTop: 12 }]}
          onPress={() => navigation.dispatch(
     CommonActions.reset({
    index: 0,
    routes: [{ name: SCREENS.MAIN }],
  })
)}
        >
          <Text style={s.dashBtnText}>Continue to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: "#fff" },
  header:       { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:  { fontSize: 17, fontWeight: "700", color: BRAND },
  body:         { flex: 1, padding: 24, alignItems: "center" },
  badgeWrap:    { position: "relative", marginTop: 20, marginBottom: 24 },
  badge:        { width: 120, height: 120, borderRadius: 60, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  confettiDot1: { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#fbbf24", top: 8, right: -4 },
  confettiDot2: { position: "absolute", width: 8, height: 8, borderRadius: 4, backgroundColor: "#34d399", bottom: 10, left: -8 },
  confettiDot3: { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: "#f87171", top: 20, left: -12 },
  congrats:     { fontSize: 24, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8 },
  subtitle:     { fontSize: 14, color: "#6b7280", textAlign: "center", marginBottom: 24 },
  perksCard:    { width: "100%", backgroundColor: "#f8f9fb", borderRadius: 16, padding: 16, marginBottom: 24 },
  perksTitle:   { fontSize: 14, fontWeight: "700", color: BRAND, marginBottom: 12 },
  perkRow:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  perkText:     { fontSize: 14, color: "#374151" },
  upgradeBtn:   { width: "100%", backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  upgradeBtnText:{ fontSize: 16, fontWeight: "700", color: "#fff" },
  dashBtn:      { width: "100%", borderWidth: 1.5, borderColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center", marginTop: 24 },
  dashBtnText:  { fontSize: 16, fontWeight: "700", color: BLUE },
});
