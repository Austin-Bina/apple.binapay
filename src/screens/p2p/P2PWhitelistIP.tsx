import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Platform, StatusBar, Clipboard, Linking } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { showToast } from "@helpers/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { useGetP2PWhitelistIpsQuery } from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Whitelist IP">;

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_CARD = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

function copyToClipboard(text: string) {
  if (Platform.OS === "ios" || Platform.OS === "android") Clipboard.setString(text);
}

export default function P2PWhitelistIPScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const exchange      = (route.params as any)?.exchange ?? "bybit";
  const exchangeLabel = exchange === "bybit" ? "Bybit" : exchange;

  // ── All original hooks + handlers — untouched ─────────────────────────────
  const { data, isLoading } = useGetP2PWhitelistIpsQuery();
  const BINAPAY_IPS: string[] = data?.whitelist_ips ?? [];
  const tutorialUrl = data?.tutorial_url ?? null;

  const handleCopyOne = (ip: string) => { copyToClipboard(ip); showToast({ message: `${ip} copied!`, duration: 1500 }); };
  const handleCopyAll = () => { copyToClipboard(BINAPAY_IPS.join("\n")); showToast({ message: "All IP addresses copied!", duration: 1500 }); };
  const handleTutorial = async () => {
    if (!tutorialUrl) { showToast({ message: "Tutorial not available yet.", duration: 1500 }); return; }
    try {
      const canOpen = await Linking.canOpenURL(tutorialUrl);
      if (canOpen) await Linking.openURL(tutorialUrl);
      else showToast({ message: "Could not open the tutorial link.", duration: 1500 });
    } catch { showToast({ message: "Could not open the tutorial link.", duration: 1500 }); }
  };

  return (
    <View style={[ws.root, { paddingBottom: insets.bottom + 16 }]}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={ws.scroll} showsVerticalScrollIndicator={false}>

        {/* Step badge */}
        <View style={ws.stepBadge}>
          <Text style={ws.stepText}>Step 1 of 2</Text>
        </View>

        <Text style={ws.heading}>Whitelist BinaPay IP</Text>
        <Text style={ws.subheading}>
          Add these IPs to your {exchangeLabel} API settings to allow BinaPay access
        </Text>

        {/* Info box */}
        <View style={[ws.infoBox, IOS_CARD]}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={BRAND} />
          <View style={{ flex: 1 }}>
            <Text style={ws.infoTitle}>Why whitelist?</Text>
            <Text style={ws.infoBody}>{exchangeLabel} requires IP whitelisting for API security.</Text>
          </View>
        </View>

        {/* IP list */}
        <View style={[ws.ipCard, IOS_CARD]}>
          {isLoading ? (
            <View style={ws.ipRow}><Text style={[ws.ipText, { color: PLACEHOLDER }]}>Loading…</Text></View>
          ) : (
            BINAPAY_IPS.map((ip, i) => (
              <View key={ip} style={[ws.ipRow, i < BINAPAY_IPS.length - 1 && ws.ipRowBorder]}>
                <View style={ws.ipDot} />
                <Text style={ws.ipText}>{ip}</Text>
                <TouchableOpacity onPress={() => handleCopyOne(ip)} style={ws.copyBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} activeOpacity={0.7}>
                  <MaterialCommunityIcons name="content-copy" size={18} color={BRAND} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Copy all */}
        <TouchableOpacity style={[ws.copyAllBtn, IOS_CARD]} onPress={handleCopyAll} activeOpacity={0.8}>
          <MaterialCommunityIcons name="content-copy" size={16} color={BRAND} />
          <Text style={ws.copyAllText}>Copy all IP addresses</Text>
        </TouchableOpacity>

        {/* Quick steps accordion */}
        <QuickSteps exchangeLabel={exchangeLabel} />

        {/* Tutorial */}
        <TouchableOpacity style={[ws.helpRow, !tutorialUrl && { opacity: 0.5 }]} onPress={handleTutorial} activeOpacity={0.8}>
          <View style={ws.helpIconBox}>
            <MaterialCommunityIcons name="youtube" size={20} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={ws.helpTitle}>Need help?</Text>
            <Text style={ws.helpSub}>{tutorialUrl ? "Watch our step-by-step guide" : "Tutorial coming soon"}</Text>
          </View>
          {tutorialUrl && <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />}
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={ws.ctaBtn}
        onPress={() => navigation.navigate(SCREENS.P2P_CONNECT_API, { exchange })}
        activeOpacity={0.85}>
        <MaterialCommunityIcons name="check-circle-outline" size={20} color={SURFACE} />
        <Text style={ws.ctaText}>I have whitelisted the IP</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuickSteps({ exchangeLabel }: { exchangeLabel: string }) {
  const [open, setOpen] = useState(false);
  const steps = [
    `Log in to your ${exchangeLabel} account`,
    "Go to Account → API Management",
    'Click "Create New Key"',
    "Under IP restriction, paste each IP above",
    "Enable Read and Trade permissions",
    "Save your API Key and Secret",
  ];
  return (
    <View style={[ws.accordion, IOS_CARD]}>
      <TouchableOpacity onPress={() => setOpen(v => !v)} style={ws.accordionHeader} activeOpacity={0.7}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <MaterialCommunityIcons name="format-list-numbered" size={18} color={BRAND} />
          <Text style={ws.accordionTitle}>Quick steps</Text>
        </View>
        <MaterialCommunityIcons name={open ? "chevron-up" : "chevron-down"} size={20} color={SUBLABEL} />
      </TouchableOpacity>
      {open && (
        <View style={ws.accordionBody}>
          {steps.map((step, i) => (
            <View key={i} style={ws.stepRow}>
              <View style={ws.stepNumber}><Text style={ws.stepNumText}>{i + 1}</Text></View>
              <Text style={ws.stepItem}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const SURFACE = "#FFFFFF";

const ws = StyleSheet.create({
  root:          { flex: 1, backgroundColor: SURFACE },
  scroll:        { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  stepBadge:     { alignSelf: "center", backgroundColor: BLUE_LIGHT, paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20, marginBottom: 16 },
  stepText:      { fontSize: 13, fontWeight: "600", color: BRAND },
  heading:       { fontSize: 24, fontWeight: "800", color: BRAND_DARK, textAlign: "center", marginBottom: 8, letterSpacing: -0.4 },
  subheading:    { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 21, marginBottom: 20 },
  infoBox:       { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 14, marginBottom: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  infoTitle:     { fontSize: 13, fontWeight: "700", color: LABEL, marginBottom: 3 },
  infoBody:      { fontSize: 12, color: SUBLABEL, lineHeight: 18 },
  ipCard:        { backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 12 },
  ipRow:         { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14, gap: 10 },
  ipRowBorder:   { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  ipDot:         { width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND },
  ipText:        { flex: 1, fontSize: 15, color: LABEL, fontVariant: ["tabular-nums"] },
  copyBtn:       { padding: 6 },
  copyAllBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: SEPARATOR, borderRadius: 14, paddingVertical: 13, marginBottom: 16, backgroundColor: BG },
  copyAllText:   { fontSize: 14, fontWeight: "600", color: BRAND },
  accordion:     { backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 14 },
  accordionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, paddingHorizontal: 14 },
  accordionTitle:{ fontSize: 14, fontWeight: "700", color: LABEL },
  accordionBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  stepRow:       { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNumber:    { width: 24, height: 24, borderRadius: 12, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginTop: 1 },
  stepNumText:   { fontSize: 11, fontWeight: "700", color: BRAND },
  stepItem:      { flex: 1, fontSize: 13, color: SUBLABEL, lineHeight: 20 },
  helpRow:       { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFF5F5", borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#FECACA" },
  helpIconBox:   { width: 36, height: 36, borderRadius: 10, backgroundColor: "#FEE2E2", justifyContent: "center", alignItems: "center" },
  helpTitle:     { fontSize: 14, fontWeight: "700", color: LABEL },
  helpSub:       { fontSize: 12, color: SUBLABEL },
  ctaBtn:        { marginHorizontal: 20, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 14, paddingVertical: 16 },
  ctaText:       { fontSize: 16, fontWeight: "700", color: SURFACE },
});
