import React from "react";
import { View, StyleSheet } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { P2PStackScreenProps } from "@navigators/types";
import { SCREENS } from "@constants/screens";

type Props = P2PStackScreenProps<"P2P Connect Success">;

const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

export default function P2PConnectSuccessScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const exchange = (route.params as any)?.exchange ?? "bybit";
  const exchangeLabel = exchange === "bybit" ? "Bybit" : exchange;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>

      {/* Center content */}
      <View style={styles.center}>

        {/* Logo pair — BinaPay + Exchange */}
        <View style={styles.logoRow}>
          {/* BinaPay circle */}
          <View style={styles.logoCircleBlue}>
            <MaterialCommunityIcons name="lightning-bolt" size={28} color="#fff" />
          </View>

          {/* Overlap exchange circle */}
          <View style={styles.logoCircleDark}>
            <Text style={styles.exchangeLogoText}>
              {exchangeLabel.toUpperCase().slice(0, 5)}
            </Text>
          </View>

          {/* Green tick badge */}
          <View style={styles.tickBadge}>
            <MaterialCommunityIcons name="check" size={14} color="#fff" />
          </View>
        </View>

        <Text style={styles.heading}>You're all set!</Text>
        <Text style={styles.subheading}>
          Your {exchangeLabel} account is connected.{"\n"}Orders will sync automatically.
        </Text>

        {/* What happens next */}
        <View style={styles.nextCard}>
          <Text style={styles.nextTitle}>What happens next</Text>

          <View style={styles.nextRow}>
            <View style={styles.nextIconBox}>
              <MaterialCommunityIcons name="sync" size={18} color={BRAND} />
            </View>
            <View style={styles.nextText}>
              <Text style={styles.nextItemTitle}>Orders sync automatically</Text>
              <Text style={styles.nextItemSub}>New P2P orders appear in your dashboard instantly</Text>
            </View>
          </View>

          <View style={styles.nextRow}>
            <View style={styles.nextIconBox}>
              <MaterialCommunityIcons name="bell-ring-outline" size={18} color={BRAND} />
            </View>
            <View style={styles.nextText}>
              <Text style={styles.nextItemTitle}>Get notified</Text>
              <Text style={styles.nextItemSub}>We'll alert you when a new order needs attention</Text>
            </View>
          </View>

          <View style={styles.nextRow}>
            <View style={styles.nextIconBox}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={BRAND} />
            </View>
            <View style={styles.nextText}>
              <Text style={styles.nextItemTitle}>Stay in control</Text>
              <Text style={styles.nextItemSub}>Approve or reject orders directly from BinaPay</Text>
            </View>
          </View>
        </View>
      </View>

      {/* CTA */}
      <TouchableRipple
        style={styles.ctaBtn}
        onPress={() => navigation.navigate(SCREENS.P2P_DASHBOARD)}>
        <View style={styles.ctaInner}>
          <MaterialCommunityIcons name="view-dashboard-outline" size={20} color="#fff" />
          <Text style={styles.ctaText}>View Orders</Text>
        </View>
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  // Logo pair
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 28,
    position: "relative",
  },
  logoCircleBlue: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 3,
    borderColor: "#fff",
  },
  logoCircleDark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0A0F1E",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: -16,
    zIndex: 1,
    borderWidth: 3,
    borderColor: "#fff",
  },
  exchangeLogoText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  tickBadge: {
    position: "absolute",
    right: -4,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    zIndex: 3,
  },

  heading: {
    fontSize: 26,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginBottom: 10,
  },
  subheading: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },

  // What happens next card
  nextCard: {
    width: "100%",
    backgroundColor: "#FAFCFF",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: "#D0D9EE",
    gap: 16,
  },
  nextTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#888",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  nextRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  nextIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EEF3FF",
    justifyContent: "center",
    alignItems: "center",
  },
  nextText: { flex: 1 },
  nextItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111",
    marginBottom: 2,
  },
  nextItemSub: {
    fontSize: 12,
    color: "#888",
    lineHeight: 17,
  },

  // CTA
  ctaBtn: {
    backgroundColor: BRAND,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});
