import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetLimitsQuery } from "@store/redux-api/kycApi";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import { CommonActions } from "@react-navigation/native";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_LIMITS>;

export default function VerificationLimitsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: limitsData } = useGetLimitsQuery();
  const limits = limitsData?.data;
  const tier   = limits?.kyc_tier ?? 0;

  const formatLimit = (v: number) =>
    v >= 1000000 ? `₦${(v / 1000000).toFixed(1)}M` : `₦${(v / 1000).toFixed(0)}k`;

  const limitRows = [
    { label: "Daily Transfer Limit",    current: limits?.daily_transfer_limit ?? 0,            max: tier >= 2 ? 5000000 : 2500000,    icon: "bank-transfer" },
    { label: "Wallet Balance Limit",    current: limits?.wallet_balance_limit ?? 0,   max: tier >= 2 ? 10000000 : 5000000,   icon: "wallet-outline" },
  { label: "Per Transaction Limit", current: limits?.per_txn_limit        ?? 0, max: 2_000_000,  icon: "swap-horizontal"},
  ];

  return (
    <View style={[s.root]}>
      <ScreenHeader
  title="Verification & Limits"
  onBack={() => navigation.goBack()}
   />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {/* Tier badge */}
        <View style={s.tierBadge}>
          <View style={s.tierBadgeLeft}>
            <Text style={s.tierBadgeLabel}>Your Verification Level</Text>
            <View style={s.tierBadgeRow}>
              <Text style={s.tierBadgeTitle}>Tier {tier}</Text>
              <View style={s.verifiedPill}>
                <MaterialCommunityIcons name="shield-check" size={12} color="#fff" />
                <Text style={s.verifiedPillText}>Verified</Text>
              </View>
            </View>
            <Text style={s.tierBadgeSub}>
              {tier >= 2 ? "Fully verified account" : "Basic verified account"}
            </Text>
          </View>
          <MaterialCommunityIcons name="shield-check-outline" size={40} color="rgba(255,255,255,0.4)" />
        </View>

        {/* Limits */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Account Limits</Text>
            <TouchableOpacity>
              <Text style={s.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {limitRows.map((row) => {
            const pct = Math.min((row.current / row.max) * 100, 100);
            return (
              <View key={row.label} style={s.limitRow}>
                <View style={s.limitIcon}>
                  <MaterialCommunityIcons name={row.icon as any} size={20} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={s.limitTop}>
                    <Text style={s.limitLabel}>{row.label}</Text>
                    <Text style={s.limitValues}>
                      {formatLimit(row.current)} / {formatLimit(row.max)}
                    </Text>
                  </View>
                  <View style={s.limitBar}>
                    <View style={[s.limitFill, { width: `${pct}%` as any }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {tier < 2 && (
          <TouchableOpacity
            style={s.upgradeBtn}
            onPress={() => navigation.dispatch( CommonActions.navigate(SCREENS.SUPPORT_STACK))}
          >
            <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
            <Text style={s.upgradeBtnText}>Need Higher Limits? Contact support to increase your limits further.</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#f8f9fb" },
  header:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:        { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:    { fontSize: 17, fontWeight: "700", color: BRAND },
  tierBadge:      { flexDirection: "row", alignItems: "center", backgroundColor: BRAND, borderRadius: 16, padding: 20, marginBottom: 20 },
  tierBadgeLeft:  { flex: 1 },
  tierBadgeLabel: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  tierBadgeRow:   { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  tierBadgeTitle: { fontSize: 26, fontWeight: "800", color: "#fff" },
  verifiedPill:   { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#16a34a", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  verifiedPillText:{ fontSize: 11, color: "#fff", fontWeight: "600" },
  tierBadgeSub:   { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  section:        { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  sectionHeader:  { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  sectionTitle:   { fontSize: 15, fontWeight: "700", color: "#111827" },
  viewAll:        { fontSize: 13, color: BLUE, fontWeight: "600" },
  limitRow:       { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  limitIcon:      { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  limitTop:       { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  limitLabel:     { fontSize: 13, color: "#374151", fontWeight: "500" },
  limitValues:    { fontSize: 12, color: "#6b7280" },
  limitBar:       { height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  limitFill:      { height: 6, backgroundColor: BLUE, borderRadius: 3 },
  upgradeBtn:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14, marginTop: 16 },
  upgradeBtnText: { flex: 1, fontSize: 13, color: BRAND, fontWeight: "500" },
});
