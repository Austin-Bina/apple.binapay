import React from "react";
import { View, ScrollView, StyleSheet } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SCREENS } from "@constants/screens";
import { P2PStackScreenProps } from "@navigators/types";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

type Props = P2PStackScreenProps<typeof SCREENS.P2P_MANAGER>;

// BinaPay brand blue
const BRAND = "hsl(221, 65%, 51%)";
const BRAND_LIGHT = "#EEF3FF";

const FEATURES = [
  {
    icon: <MaterialCommunityIcons name="lightning-bolt" size={22} color={BRAND} />,
    title: "Instant Payments",
    subtitle: "Pay sellers instantly from your BinaPay balance",
  },
  {
    icon: <Ionicons name="sync-circle-outline" size={22} color={BRAND} />,
    title: "Auto-Sync Orders",
    subtitle: "Your Bybit orders appear here automatically",
  },
  {
    icon: <MaterialCommunityIcons name="shield-check-outline" size={22} color={BRAND} />,
    title: "Secure & Protected",
    subtitle: "All transactions are encrypted and verified",
  },
];

export default function P2PManagerIntroScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>

       

        {/* Heading */}
        <Text style={styles.heading}>Introducing P2P Manager</Text>
        <Text style={styles.subheading}>
          Monitor and pay for your P2P trades directly from your BinaPay account
        </Text>

        {/* Features */}
        {FEATURES.map(({ icon, title, subtitle }) => (
          <View key={title} style={styles.featureRow}>
            <View style={styles.featureIconBox}>
              {icon}
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{title}</Text>
              <Text style={styles.featureSubtitle}>{subtitle}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* CTA */}
      <TouchableRipple
        style={styles.proceedBtn}
        onPress={() => navigation.navigate(SCREENS.P2P_CHOOSE_EXCHANGE)}>
        <View style={styles.proceedInner}>
          <Text style={styles.proceedText}>Proceed</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
        </View>
      </TouchableRipple>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },

  // Mock card
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 28,
    borderWidth: 1,
    borderColor: "#E8EEF9",
    shadowColor: BRAND,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardBuy: { fontSize: 14, color: "#555" },
  cardAmount: { fontWeight: "800", color: "#111" },
  pendingBadge: {
    backgroundColor: "#EEF3FF",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  pendingText: { color: BRAND, fontSize: 12, fontWeight: "600" },
  cardUser: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BRAND_LIGHT,
    justifyContent: "center", alignItems: "center",
  },
  avatarText: { fontWeight: "700", color: BRAND, fontSize: 13 },
  skeletonWrap: { flex: 1 },
  skeleton: { height: 10, backgroundColor: "#F0F0F0", borderRadius: 6 },
  cardActions: { flexDirection: "row", gap: 10 },
  rejectBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "#D0D9EE",
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: "center",
  },
  rejectText: { color: "#555", fontWeight: "600", fontSize: 13 },
  approveBtn: {
    flex: 1.8,
    backgroundColor: BRAND,
    borderRadius: 30,
    paddingVertical: 10,
    alignItems: "center",
  },
  approveText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  // Heading
  heading: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111",
    textAlign: "center",
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    color: "#777",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 32,
  },

  // Features
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 22,
    gap: 14,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND_LIGHT,
    justifyContent: "center",
    alignItems: "center",
  },
  featureText: { flex: 1 },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111",
    marginBottom: 3,
  },
  featureSubtitle: { fontSize: 13, color: "#888", lineHeight: 19 },

  // CTA
  proceedBtn: {
    marginHorizontal: 20,
    backgroundColor: BRAND,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  proceedInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proceedText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
