import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { P2PStackScreenProps } from "@navigators/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = P2PStackScreenProps<"P2P Choose Exchange">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

const EXCHANGES = [
  {
    id: "bybit",
    name: "Bybit",
    subtitle: "Connect your Bybit P2P account",
    available: true,
  },
  // Enable later:
  // { id: "bitget", name: "Bitget", subtitle: "Connect your Bitget P2P account", available: false },
  // { id: "gate", name: "Gate.io", subtitle: "Connect your Gate.io P2P account", available: false },
];

export default function P2PChooseExchangeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

      {/* Header */}
      <View style={styles.headerBlock}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="swap-horizontal" size={28} color={BRAND} />
        </View>
        <Text style={styles.heading}>Choose your exchange</Text>
        <Text style={styles.subheading}>
          Select the P2P platform you'd like to connect to BinaPay
        </Text>
      </View>

      {/* Exchange list */}
      <View style={styles.list}>
        {EXCHANGES.map((exchange) => (
          <TouchableRipple
            key={exchange.id}
            style={[styles.item, !exchange.available && styles.itemDisabled]}
            onPress={() => {
              if (exchange.available) {
                navigation.navigate(SCREENS.P2P_WHITELIST_IP, { exchange: exchange.id });
              }
            }}>
            <View style={styles.itemInner}>
              {/* Logo circle */}
              <View style={styles.logoBox}>
                <Text style={styles.logoText}>BYBIT</Text>
              </View>

              {/* Text */}
              <View style={styles.itemText}>
                <Text style={styles.itemTitle}>{exchange.name}</Text>
                <Text style={styles.itemSubtitle}>{exchange.subtitle}</Text>
              </View>

              {/* Arrow */}
              <View style={styles.arrowBox}>
                <MaterialCommunityIcons name="chevron-right" size={20} color={BRAND} />
              </View>
            </View>
          </TouchableRipple>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
  },

  headerBlock: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF3FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  list: { gap: 12 },

  item: {
    borderWidth: 1.5,
    borderColor: "#D0D9EE",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FAFCFF",
  },
  itemDisabled: {
    opacity: 0.45,
  },
  itemInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  logoBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#0A0F1E",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  itemText: { flex: 1 },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  itemSubtitle: { fontSize: 13, color: "#888" },
  arrowBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EEF3FF",
    justifyContent: "center",
    alignItems: "center",
  },
});
