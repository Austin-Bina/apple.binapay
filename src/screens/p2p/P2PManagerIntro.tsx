import React from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { P2PStackScreenProps } from "@navigators/types";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

type Props = P2PStackScreenProps<typeof SCREENS.P2P_MANAGER>;

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const FEATURES = [
  { icon: <MaterialCommunityIcons name="lightning-bolt" size={22} color={BRAND} />,       title: "Instant Payments",   subtitle: "Pay sellers instantly from your BinaPay balance" },
  { icon: <Ionicons name="sync-circle-outline" size={22} color={BRAND} />,                title: "Auto-Sync Orders",   subtitle: "Your Bybit orders appear here automatically" },
  { icon: <MaterialCommunityIcons name="shield-check-outline" size={22} color={BRAND} />, title: "Secure & Protected", subtitle: "All transactions are encrypted and verified" },
];

export default function P2PManagerIntroScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Hero icon */}
        <View style={s.heroWrap}>
          <View style={s.heroCircle}>
            <MaterialCommunityIcons name="swap-horizontal" size={36} color={BRAND} />
          </View>
        </View>

        <Text style={s.heading}>P2P Manager</Text>
        <Text style={s.subheading}>
          Monitor and pay for your P2P trades directly from your BinaPay account
        </Text>

        {/* Feature list */}
        <View style={s.featureCard}>
          {FEATURES.map((f, i) => (
            <React.Fragment key={f.title}>
              {i > 0 && <View style={s.hairline} />}
              <View style={s.featureRow}>
                <View style={s.featureIconBox}>{f.icon}</View>
                <View style={{ flex: 1 }}>
                  <Text style={s.featureTitle}>{f.title}</Text>
                  <Text style={s.featureSub}>{f.subtitle}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={s.ctaBtn}
        onPress={() => navigation.navigate(SCREENS.P2P_CHOOSE_EXCHANGE)}
        activeOpacity={0.85}>
        <Text style={s.ctaText}>Get Started</Text>
        <MaterialCommunityIcons name="arrow-right" size={20} color={SURFACE} />
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:          { flex: 1, backgroundColor: SURFACE },
  scroll:        { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 24 },
  heroWrap:      { alignItems: "center", marginBottom: 24 },
  heroCircle:    { width: 88, height: 88, borderRadius: 44, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  heading:       { fontSize: 26, fontWeight: "800", color: BRAND_DARK, textAlign: "center", marginBottom: 10, letterSpacing: -0.5 },
  subheading:    { fontSize: 15, color: SUBLABEL, textAlign: "center", lineHeight: 22, marginBottom: 36 },
  featureCard:   { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, ...Platform.select({ ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 } }) },
  hairline:      { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 66 },
  featureRow:    { flexDirection: "row", alignItems: "flex-start", gap: 14, paddingHorizontal: 16, paddingVertical: 16 },
  featureIconBox:{ width: 44, height: 44, borderRadius: 12, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  featureTitle:  { fontSize: 15, fontWeight: "700", color: LABEL, marginBottom: 3 },
  featureSub:    { fontSize: 13, color: SUBLABEL, lineHeight: 19 },
  ctaBtn:        { marginHorizontal: 24, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 16 },
  ctaText:       { fontSize: 16, fontWeight: "700", color: SURFACE },
});
