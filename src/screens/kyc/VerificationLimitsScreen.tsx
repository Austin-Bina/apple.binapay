import React from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useGetLimitsQuery } from "@store/redux-api/kycApi";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_LIMITS>;

export default function VerificationLimitsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // ── All original logic — untouched ────────────────────────────────────────
  const { data: limitsData } = useGetLimitsQuery();
  const limits = limitsData?.data;
  const tier   = limits?.kyc_tier ?? 0;

  const formatLimit = (v: number) =>
    v >= 1_000_000 ? `₦${(v / 1_000_000).toFixed(1)}M` : `₦${(v / 1000).toFixed(0)}k`;

  const limitRows = [
    { label: "Daily Transfer Limit",  current: limits?.daily_transfer_limit ?? 0, max: tier >= 2 ? 5_000_000 : 2_500_000, icon: "bank-transfer"    },
    { label: "Wallet Balance Limit",  current: limits?.wallet_balance_limit  ?? 0, max: tier >= 2 ? 10_000_000 : 5_000_000, icon: "wallet-outline"   },
    { label: "Per Transaction Limit", current: limits?.per_txn_limit         ?? 0, max: 2_000_000,                          icon: "swap-horizontal"  },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={s.navTitle}>Verification &amp; Limits</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Tier badge (gradient dark card) ── */}
        <View style={[s.tierBadge, IOS_SHADOW]}>
          <View style={{ flex: 1 }}>
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

        {/* ── Limits card ── */}
        <View style={[s.limitsCard, IOS_SHADOW]}>
          <View style={s.limitsCardHeader}>
            <Text style={s.limitsCardTitle}>Account Limits</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={s.viewAll}>View all</Text>
            </TouchableOpacity>
          </View>

          {limitRows.map((row, i) => {
            const pct = Math.min((row.current / row.max) * 100, 100);
            return (
              <React.Fragment key={row.label}>
                {i > 0 && <View style={s.hairline} />}
                <View style={s.limitRow}>
                  <View style={s.limitIconWrap}>
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
              </React.Fragment>
            );
          })}
        </View>

        {/* ── Upgrade nudge ── */}
        {tier < 2 && (
          <TouchableOpacity
            style={[s.upgradeBtn, IOS_SHADOW]}
            onPress={() => navigation.navigate(SCREENS.UPGRADE_TIER2)}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="shield-crown-outline" size={18} color={BLUE} />
            <Text style={s.upgradeBtnText}>
              Need higher limits? Complete Tier 2 to unlock more.
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  navBar:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:         { fontSize: 16, fontWeight: "700", color: BRAND, flex: 1, textAlign: "center" },
  scroll:           { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  // Tier badge — keeps the dark gradient look
  tierBadge:        { flexDirection: "row", alignItems: "center", backgroundColor: BRAND, borderRadius: 18, padding: 20, marginBottom: 16 },
  tierBadgeLabel:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  tierBadgeRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  tierBadgeTitle:   { fontSize: 28, fontWeight: "800", color: "#fff" },
  verifiedPill:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#16A34A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  verifiedPillText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  tierBadgeSub:     { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  // Limits card
  limitsCard:       { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 14 },
  limitsCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  limitsCardTitle:  { fontSize: 15, fontWeight: "700", color: LABEL },
  viewAll:          { fontSize: 13, color: BLUE, fontWeight: "600" },
  hairline:         { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 56 },
  limitRow:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  limitIconWrap:    { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  limitTop:         { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  limitLabel:       { fontSize: 13, color: "#374151", fontWeight: "500" },
  limitValues:      { fontSize: 12, color: SUBLABEL },
  limitBar:         { height: 6, backgroundColor: SEPARATOR, borderRadius: 3, overflow: "hidden" },
  limitFill:        { height: 6, backgroundColor: BLUE, borderRadius: 3 },
  // Upgrade nudge
  upgradeBtn:       { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  upgradeBtnText:   { flex: 1, fontSize: 13, color: BRAND, fontWeight: "500" },
});
