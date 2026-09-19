import React, { useState } from "react";
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
const GREEN = "#16a34a";

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_LIMITS>;

const TIER_NAMES: Record<number, string> = {
  0: "Tier 0 — Unverified",
  1: "Tier 1 — Basic Verification",
  2: "Tier 2 — Full Verification",
};

const LIMIT_ROWS: { key: "daily_transfer_limit" | "wallet_balance_limit" | "per_txn_limit"; label: string; icon: string }[] = [
  { key: "daily_transfer_limit", label: "Daily Transfer Limit",  icon: "bank-transfer" },
  { key: "wallet_balance_limit", label: "Wallet Balance Limit",  icon: "wallet-outline" },
  { key: "per_txn_limit",        label: "Per Transaction Limit", icon: "swap-horizontal" },
];

export default function VerificationLimitsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { data: limitsData } = useGetLimitsQuery();
  const limits = limitsData?.data;
  const tier   = limits?.kyc_tier ?? 0;

  const [showAllTiers, setShowAllTiers] = useState(false);

  // Full KycService::LIMITS map (0, 1, 2, and p2p — p2p intentionally not shown).
  const tierLimits = limits?.tier_limits;
  const tierMaxes  = tierLimits?.[Math.min(tier, 2)];

  const formatLimit = (v: number) =>
    v >= 1000000 ? `₦${(v / 1000000).toFixed(1)}M` : `₦${(v / 1000).toFixed(0)}k`;

  const limitRows = tierMaxes
    ? [
        { label: "Daily Transfer Limit",  current: limits?.daily_transfer_spent ?? 0, max: tierMaxes.daily_transfer_limit, icon: "bank-transfer" },
        { label: "Wallet Balance Limit",  current: limits?.wallet_balance ?? 0,        max: tierMaxes.wallet_balance_limit, icon: "wallet-outline" },
        { label: "Per Transaction Limit", current: limits?.per_txn_limit ?? 0,         max: tierMaxes.per_txn_limit,        icon: "swap-horizontal" },
      ]
    : [];

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
            <Text style={s.sectionTitle}>
              {showAllTiers ? "All Tier Limits" : "Account Limits"}
            </Text>
            <TouchableOpacity onPress={() => setShowAllTiers((v) => !v)}>
              <Text style={s.viewAll}>{showAllTiers ? "Current tier" : "View all"}</Text>
            </TouchableOpacity>
          </View>

          {!showAllTiers ? (
            // ── Current tier only, with usage bars ──────────────────────────
            limitRows.map((row) => {
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
            })
          ) : (
            // ── All three tiers side by side ────────────────────────────────
            <>
              <Text style={s.allTiersIntro}>
                Here's what each tier unlocks. Complete more verification steps to move up.
              </Text>
              {[0, 1, 2].map((tierNum) => {
                const tierData  = tierLimits?.[tierNum];
                if (!tierData) return null;

                const isCurrent  = tierNum === tier;
                const isUnlocked = tierNum <= tier;

                return (
                  <View key={tierNum} style={[s.tierCard, isCurrent && s.tierCardCurrent]}>
                    <View style={s.tierCardHeader}>
                      <View style={s.tierNameRow}>
                        <MaterialCommunityIcons
                          name={isUnlocked ? "shield-check" : "lock-outline"}
                          size={16}
                          color={isCurrent ? "#fff" : isUnlocked ? GREEN : "#9ca3af"}
                        />
                        <Text style={[s.tierName, isCurrent && s.tierNameCurrent]}>
                          {TIER_NAMES[tierNum]}
                        </Text>
                      </View>
                      {isCurrent && (
                        <View style={s.currentPill}>
                          <Text style={s.currentPillText}>Your Tier</Text>
                        </View>
                      )}
                    </View>

                    {LIMIT_ROWS.map((row) => (
                      <View key={row.key} style={s.tierLimitRow}>
                        <MaterialCommunityIcons
                          name={row.icon as any}
                          size={14}
                          color={isCurrent ? "rgba(255,255,255,0.8)" : "#6b7280"}
                        />
                        <Text style={[s.tierLimitLabel, isCurrent && s.tierLimitLabelCurrent]}>{row.label}</Text>
                        <Text style={[s.tierLimitValue, isCurrent && s.tierLimitValueCurrent]}>
                          {formatLimit(tierData[row.key])}
                        </Text>
                      </View>
                    ))}
                  </View>
                );
              })}
            </>
          )}
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
  sectionHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
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

  // All-tiers view
  allTiersIntro:      { fontSize: 12, color: "#6b7280", marginBottom: 14, lineHeight: 18 },
  tierCard:           { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  tierCardCurrent:    { backgroundColor: BRAND, borderColor: BRAND },
  tierCardHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  tierNameRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
  tierName:           { fontSize: 13, fontWeight: "700", color: "#111827" },
  tierNameCurrent:    { color: "#fff" },
  currentPill:        { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  currentPillText:    { fontSize: 10, fontWeight: "700", color: "#fff" },
  tierLimitRow:       { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 5 },
  tierLimitLabel:     { flex: 1, fontSize: 12, color: "#374151" },
  tierLimitLabelCurrent: { color: "rgba(255,255,255,0.85)" },
  tierLimitValue:     { fontSize: 12, fontWeight: "700", color: "#111827" },
  tierLimitValueCurrent: { color: "#fff" },
});
