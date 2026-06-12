// ─── P2PConnectSuccessScreen ─────────────────────────────────────────────────
import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { SCREENS } from "@constants/screens";

type Props = P2PStackScreenProps<"P2P Connect Success">;

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

export default function P2PConnectSuccessScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const exchange      = (route.params as any)?.exchange ?? "bybit";
  const exchangeLabel = exchange === "bybit" ? "Bybit" : exchange;

  const NEXT_STEPS = [
    { icon: "sync",               title: "Orders sync automatically",    sub: "New P2P orders appear in your dashboard instantly" },
    { icon: "bell-ring-outline",  title: "Get notified",                 sub: "We'll alert you when a new order needs attention" },
    { icon: "shield-check-outline", title: "Stay in control",            sub: "Approve or reject orders directly from BinaPay" },
  ];

  return (
    <View style={[s.root, { paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="dark-content" />

      <View style={s.center}>
        {/* Overlapping logo pair */}
        <View style={s.logoRow}>
          <View style={s.logoBlue}>
            <MaterialCommunityIcons name="lightning-bolt" size={28} color={SURFACE} />
          </View>
          <View style={s.logoDark}>
            <Text style={s.logoText}>{exchangeLabel.toUpperCase().slice(0, 5)}</Text>
          </View>
          <View style={s.tickBadge}>
            <MaterialCommunityIcons name="check" size={13} color={SURFACE} />
          </View>
        </View>

        <Text style={s.heading}>You're all set!</Text>
        <Text style={s.subheading}>
          Your {exchangeLabel} account is connected.{"\n"}Orders will sync automatically.
        </Text>

        {/* What happens next */}
        <View style={[s.nextCard, IOS_SHADOW]}>
          <Text style={s.nextTitle}>What happens next</Text>
          {NEXT_STEPS.map((step, i) => (
            <React.Fragment key={step.title}>
              {i > 0 && <View style={s.hairline} />}
              <View style={s.nextRow}>
                <View style={s.nextIconBox}>
                  <MaterialCommunityIcons name={step.icon as any} size={18} color={BRAND} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.nextItemTitle}>{step.title}</Text>
                  <Text style={s.nextItemSub}>{step.sub}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      </View>

      <TouchableOpacity style={s.ctaBtn} onPress={() => navigation.navigate(SCREENS.P2P_DASHBOARD)} activeOpacity={0.85}>
        <MaterialCommunityIcons name="view-dashboard-outline" size={20} color={SURFACE} />
        <Text style={s.ctaText}>View Orders</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: SURFACE, paddingHorizontal: 24 },
  center:       { flex: 1, justifyContent: "center", alignItems: "center" },
  logoRow:      { flexDirection: "row", alignItems: "center", marginBottom: 28, position: "relative" },
  logoBlue:     { width: 68, height: 68, borderRadius: 34, backgroundColor: BRAND, justifyContent: "center", alignItems: "center", zIndex: 2, borderWidth: 3, borderColor: SURFACE },
  logoDark:     { width: 68, height: 68, borderRadius: 34, backgroundColor: "#0A0F1E", justifyContent: "center", alignItems: "center", marginLeft: -18, zIndex: 1, borderWidth: 3, borderColor: SURFACE },
  logoText:     { color: SURFACE, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  tickBadge:    { position: "absolute", right: -4, bottom: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: "#16A34A", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: SURFACE, zIndex: 3 },
  heading:      { fontSize: 26, fontWeight: "800", color: BRAND_DARK, textAlign: "center", marginBottom: 10, letterSpacing: -0.5 },
  subheading:   { fontSize: 15, color: SUBLABEL, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  nextCard:     { width: "100%", backgroundColor: SURFACE, borderRadius: 16, padding: 0, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, overflow: "hidden" },
  nextTitle:    { fontSize: 12, fontWeight: "700", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  hairline:     { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 66 },
  nextRow:      { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  nextIconBox:  { width: 38, height: 38, borderRadius: 10, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  nextItemTitle:{ fontSize: 14, fontWeight: "700", color: LABEL, marginBottom: 2 },
  nextItemSub:  { fontSize: 12, color: SUBLABEL, lineHeight: 17 },
  ctaBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 16 },
  ctaText:      { fontSize: 16, fontWeight: "700", color: SURFACE },
});
