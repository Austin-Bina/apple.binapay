import React, { useState } from "react";
import { View, StyleSheet, Clipboard, Platform, ScrollView, Linking, TouchableOpacity } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { showToast } from "@helpers/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { useGetP2PWhitelistIpsQuery } from "@store/redux-api/p2p";

type Props = P2PStackScreenProps<"P2P Whitelist IP">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";


function copyToClipboard(text: string) {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    Clipboard.setString(text);
  }
}

export default function P2PWhitelistIPScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const exchange = (route.params as any)?.exchange ?? "bybit";
  const exchangeLabel = exchange === "bybit" ? "Bybit" : exchange;

  const { data, isLoading } = useGetP2PWhitelistIpsQuery();
  const BINAPAY_IPS: string[] = data?.whitelist_ips ?? [];
  const tutorialUrl = data?.tutorial_url ?? null;

  const handleCopyOne = (ip: string) => {
    copyToClipboard(ip);
    showToast({ message: `${ip} copied!`, duration: 1500 });
  };

  const handleCopyAll = () => {
    copyToClipboard(BINAPAY_IPS.join("\n"));
    showToast({ message: "All IP addresses copied!", duration: 1500 });
  };

   const handleTutorial = async () => {
    if (!tutorialUrl) {
      showToast({ message: "Tutorial not available yet.", duration: 1500 });
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(tutorialUrl);
      if (canOpen) {
        await Linking.openURL(tutorialUrl);
      } else {
        showToast({ message: "Could not open the tutorial link.", duration: 1500 });
      }
    } catch {
      showToast({ message: "Could not open the tutorial link.", duration: 1500 });
    }
  }
  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.stepBadge}>
          <Text style={styles.stepText}>Step 1 of 2</Text>
        </View>

        <Text style={styles.heading}>Whitelist BinaPay IP</Text>
        <Text style={styles.subheading}>
          Add these IP addresses to your {exchangeLabel} API settings to allow BinaPay access
        </Text>

        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={BRAND} />
          <View style={styles.infoText}>
            <Text style={styles.infoTitle}>Why whitelist?</Text>
            <Text style={styles.infoBody}>
              {exchangeLabel} requires IP whitelisting for API security. This allows BinaPay to securely connect to your account.
            </Text>
          </View>
        </View>

        <View style={styles.ipCard}>
  {isLoading ? (
    <View style={styles.ipRow}>
      <Text style={[styles.ipText, { color: "#9ca3af" }]}>
        Loading...
      </Text>
    </View>
  ) : (
    BINAPAY_IPS.map((ip, index) => (
      <View
        key={ip}
        style={[styles.ipRow, index < BINAPAY_IPS.length - 1 && styles.ipRowBorder]}
      >
        <View style={styles.ipDot} />
        <Text style={styles.ipText}>{ip}</Text>
        <TouchableRipple onPress={() => handleCopyOne(ip)} style={styles.copyBtn} borderless>
          <MaterialCommunityIcons name="content-copy" size={18} color={BRAND} />
        </TouchableRipple>
      </View>
    ))
  )}
</View>

        <TouchableRipple style={styles.copyAllBtn} onPress={handleCopyAll}>
          <View style={styles.copyAllInner}>
            <MaterialCommunityIcons name="content-copy" size={16} color={BRAND} />
            <Text style={styles.copyAllText}>Copy all IP addresses</Text>
          </View>
        </TouchableRipple>

        <QuickSteps exchangeLabel={exchangeLabel} />

        <TouchableOpacity
        style={[styles.helpRow, !tutorialUrl && { opacity: 0.5 }]}
        onPress={handleTutorial}
        activeOpacity={0.8}
           >
        <View style={styles.helpIconBox}>
        <MaterialCommunityIcons name="youtube" size={20} color="#E53935" />
       </View>
       <View style={{ flex: 1 }}>
       <Text style={styles.helpTitle}>Need help?</Text>
       <Text style={styles.helpSub}>
        {tutorialUrl ? "Watch our step-by-step guide" : "Tutorial coming soon"}
        </Text>
       </View>
        {tutorialUrl && (
        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
         )}
      </TouchableOpacity>
      </ScrollView>

      <TouchableRipple
        style={styles.ctaBtn}
        onPress={() => navigation.navigate(SCREENS.P2P_CONNECT_API, { exchange })}>
        <View style={styles.ctaInner}>
          <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
          <Text style={styles.ctaText}>I have whitelisted the IP</Text>
        </View>
      </TouchableRipple>
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
    <View style={styles.accordion}>
      <TouchableRipple onPress={() => setOpen((v) => !v)} style={styles.accordionHeader}>
        <View style={styles.accordionHeaderInner}>
          <View style={styles.accordionLeft}>
            <MaterialCommunityIcons name="format-list-numbered" size={18} color={BRAND} />
            <Text style={styles.accordionTitle}>Quick steps</Text>
          </View>
          <MaterialCommunityIcons name={open ? "chevron-up" : "chevron-down"} size={20} color="#888" />
        </View>
      </TouchableRipple>
      {open && (
        <View style={styles.accordionBody}>
          {steps.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepItem}>{step}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24 },
  stepBadge: {
    alignSelf: "center",
    backgroundColor: BRAND_LIGHT,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  stepText: { fontSize: 13, fontWeight: "600", color: BRAND },
  heading: { fontSize: 22, fontWeight: "800", color: "#111", textAlign: "center", marginBottom: 8 },
  subheading: { fontSize: 14, color: "#777", textAlign: "center", lineHeight: 21, marginBottom: 20 },
  infoBox: {
    flexDirection: "row",
    backgroundColor: BRAND_LIGHT,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: "#D0D9EE",
  },
  infoText: { flex: 1 },
  infoTitle: { fontSize: 13, fontWeight: "700", color: "#2A2A2A", marginBottom: 3 },
  infoBody: { fontSize: 12, color: "#555", lineHeight: 18 },
  ipCard: {
    borderWidth: 1.5,
    borderColor: "#D0D9EE",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
  },
  ipRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 10,
    backgroundColor: "#FAFCFF",
  },
  ipRowBorder: { borderBottomWidth: 1, borderBottomColor: "#E8EEF9" },
  ipDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: BRAND },
  ipText: { flex: 1, fontSize: 15, color: "#222", fontVariant: ["tabular-nums"] },
  copyBtn: { padding: 6, borderRadius: 6 },
  copyAllBtn: {
    borderWidth: 1.5,
    borderColor: "#D0D9EE",
    borderRadius: 30,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#FAFCFF",
  },
  copyAllInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  copyAllText: { fontSize: 14, fontWeight: "600", color: BRAND },
  accordion: {
    borderWidth: 1,
    borderColor: "#E8EEF9",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  accordionHeader: { paddingVertical: 14, paddingHorizontal: 14 },
  accordionHeaderInner: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  accordionLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  accordionTitle: { fontSize: 14, fontWeight: "700", color: "#222" },
  accordionBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  stepNumber: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: BRAND_LIGHT,
    justifyContent: "center", alignItems: "center",
    marginTop: 1,
  },
  stepNumText: { fontSize: 11, fontWeight: "700", color: BRAND },
  stepItem: { flex: 1, fontSize: 13, color: "#555", lineHeight: 20 },
  helpRow: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFF5F5",
  borderRadius: 12,
  padding: 14,
  gap: 12,
  borderWidth: 1,
  borderColor: "#FFD6D6",
},
  helpIconBox: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: "#FFE5E5",
    justifyContent: "center", alignItems: "center",
  },
  helpTitle: { fontSize: 14, fontWeight: "700", color: "#222" },
  helpSub: { fontSize: 12, color: "#888" },
  ctaBtn: {
    marginHorizontal: 20,
    backgroundColor: BRAND,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaInner: { flexDirection: "row", alignItems: "center", gap: 8 },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
