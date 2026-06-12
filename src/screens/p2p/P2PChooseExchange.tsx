import React from "react";
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { P2PStackScreenProps } from "@navigators/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = P2PStackScreenProps<"P2P Choose Exchange">;

const BRAND      = "#2563EB";
const BRAND_DARK = "#1E3A8A";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8 },
  android: { elevation: 2 },
});

const EXCHANGES = [
  { id: "bybit", name: "Bybit", subtitle: "Connect your Bybit P2P account", available: true },
];

export default function P2PChooseExchangeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[s.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="dark-content" />

      {/* Header block */}
      <View style={s.headerBlock}>
        <View style={s.iconCircle}>
          <MaterialCommunityIcons name="swap-horizontal" size={30} color={BRAND} />
        </View>
        <Text style={s.heading}>Choose Exchange</Text>
        <Text style={s.subheading}>Select the P2P platform to connect with BinaPay</Text>
      </View>

      {/* Exchange list */}
      <View style={s.list}>
        {EXCHANGES.map((exchange) => (
          <TouchableOpacity
            key={exchange.id}
            style={[s.item, !exchange.available && s.itemDisabled, IOS_SHADOW]}
            onPress={() => {
              if (exchange.available) {
                navigation.navigate(SCREENS.P2P_WHITELIST_IP, { exchange: exchange.id });
              }
            }}
            activeOpacity={0.8}>
            <View style={s.logoBox}>
              <Text style={s.logoText}>BYBIT</Text>
            </View>
            <View style={s.itemText}>
              <Text style={s.itemTitle}>{exchange.name}</Text>
              <Text style={s.itemSubtitle}>{exchange.subtitle}</Text>
            </View>
            <View style={s.arrowBox}>
              <MaterialCommunityIcons name="chevron-right" size={20} color={BRAND} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: SURFACE, paddingHorizontal: 20 },
  headerBlock:  { alignItems: "center", marginBottom: 36 },
  iconCircle:   { width: 72, height: 72, borderRadius: 36, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 18 },
  heading:      { fontSize: 24, fontWeight: "800", color: BRAND_DARK, textAlign: "center", marginBottom: 8, letterSpacing: -0.4 },
  subheading:   { fontSize: 14, color: SUBLABEL, textAlign: "center", lineHeight: 21 },
  list:         { gap: 12 },
  item:         { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: SURFACE, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  itemDisabled: { opacity: 0.45 },
  logoBox:      { width: 48, height: 48, borderRadius: 24, backgroundColor: "#0A0F1E", justifyContent: "center", alignItems: "center" },
  logoText:     { color: SURFACE, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  itemText:     { flex: 1 },
  itemTitle:    { fontSize: 16, fontWeight: "700", color: LABEL, marginBottom: 3 },
  itemSubtitle: { fontSize: 13, color: SUBLABEL },
  arrowBox:     { width: 32, height: 32, borderRadius: 16, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
});
