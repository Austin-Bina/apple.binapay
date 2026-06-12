import React, { useMemo } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { useGetReferralRewardsQuery } from "@store/redux-api/referralQueryApi";
import { formatToNaira } from "@utils/money";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { route } from "@helpers/route";
import { SCREENS } from "@constants/screens";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";

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

type Props = AccountStackScreenProps<"BinaPay Rewards">;

export default function BinaRewardsScreen({ navigation }: Props) {
  const user   = useTypedSelector(selectUser);
  const insets = useSafeAreaInsets();

  // ── All original logic — untouched ────────────────────────────────────────
  const { data, isFetching } = useGetReferralRewardsQuery({ page: 1, per_page: 1 });
  const reward           = data?.data?.[0];
  const rewardPercentage = data?.meta?.reward_percentage ?? reward?.reward_percentage ?? 0;
  const nairaConversion  = 1500;

  const rewardExamples = useMemo(() => [100, 2500, 10000].map(usd => ({
    tradeUSD: usd, tradeNaira: usd * nairaConversion, reward: usd * nairaConversion * rewardPercentage,
  })), [rewardPercentage]);

  const steps = [
    { icon: "share-variant-outline",  text: "Share your referral link with friends." },
    { icon: "account-plus-outline",   text: "They sign up and start trading on BinaPay." },
    { icon: "cash-multiple",          text: `You earn ${(rewardPercentage * 100).toFixed(2)}% of every sell trade they make.` },
    { icon: "chart-timeline-variant", text: "Track your progress on the Earnings page anytime." },
  ];

  return (
    <View style={[br.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* Nav */}
      <View style={br.navBar}>
        <TouchableOpacity style={br.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={br.navCenter}>
          <Text style={br.navTitle}>BinaPay Rewards</Text>
          <Text style={br.navSub}>Earn by inviting friends</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollableView contentContainerStyle={br.scroll}>
        {/* Hero */}
        <View style={br.heroCard}>
          <MaterialCommunityIcons name="gift-open-outline" size={36} color="#fff" style={{ marginBottom: 10 }} />
          <Text style={br.heroTitle}>Earn Rewards on BinaPay</Text>
          {isFetching ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginTop: 8 }} />
          ) : (
            <Text style={br.heroSub}>
              Invite friends and earn{" "}
              <Text style={br.heroHighlight}>{(rewardPercentage * 100).toFixed(2)}%</Text>
              {" "}of every trade they make!
            </Text>
          )}
        </View>

        {/* Reward examples */}
        {!isFetching && (
          <>
            <Text style={br.sectionLabel}>How Much Can You Earn?</Text>
            <View style={[br.card, IOS_SHADOW]}>
              {rewardExamples.map((ex, i) => (
                <View key={ex.tradeUSD}>
                  <View style={br.exampleRow}>
                    <View>
                      <Text style={br.exampleTrade}>Friend trades ${ex.tradeUSD.toLocaleString()}</Text>
                      <Text style={br.exampleNaira}>≈ ₦{ex.tradeNaira.toLocaleString()}</Text>
                    </View>
                    <View style={br.earnBadge}>
                      <Text style={br.earnBadgeText}>+{formatToNaira(ex.reward)}</Text>
                    </View>
                  </View>
                  {i < rewardExamples.length - 1 && <View style={br.hairline} />}
                </View>
              ))}
            </View>
          </>
        )}

        {/* How it works */}
        <Text style={br.sectionLabel}>How It Works</Text>
        <View style={[br.card, IOS_SHADOW]}>
          {steps.map((step, i) => (
            <View key={i}>
              <View style={br.stepRow}>
                <View style={br.stepIconBox}>
                  <MaterialCommunityIcons name={step.icon as any} size={18} color={BLUE} />
                </View>
                <Text style={br.stepText}>{step.text}</Text>
              </View>
              {i < steps.length - 1 && <View style={br.hairline} />}
            </View>
          ))}
        </View>

        {/* Referral */}
        {user?.affiliate_id && (
          <>
            <Text style={br.sectionLabel}>Your Referral</Text>
            <View style={br.referralWrap}>
              <CopyReferralCode
                referralCode={`${route("auth.register", { type: "web" })}?ref=${user.affiliate_id}`}
                labelText="Copy Referral Link"
              />
              <CopyReferralCode referralCode={user.affiliate_id} labelText="Copy Code Only" />
            </View>
          </>
        )}

        <TouchableOpacity style={br.ctaBtn} onPress={() => navigation.navigate("Earning Summary")} activeOpacity={0.85}>
          <MaterialCommunityIcons name="chart-bar" size={18} color="#fff" />
          <Text style={br.ctaBtnText}>View Earnings</Text>
        </TouchableOpacity>
      </ScrollableView>
    </View>
  );
}

const br = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  navBar:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:     { flex: 1, alignItems: "center" },
  navTitle:      { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:        { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:        { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  heroCard:      { backgroundColor: BRAND, borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 20 },
  heroTitle:     { fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 },
  heroSub:       { fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 20 },
  heroHighlight: { color: "#FDE68A", fontWeight: "800" },
  sectionLabel:  { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, marginLeft: 4, marginTop: 4 },
  card:          { backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 16 },
  hairline:      { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 50 },
  exampleRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14 },
  exampleTrade:  { fontSize: 13, fontWeight: "600", color: LABEL },
  exampleNaira:  { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  earnBadge:     { backgroundColor: "#DCFCE7", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  earnBadgeText: { fontSize: 13, fontWeight: "700", color: "#16A34A" },
  stepRow:       { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  stepIconBox:   { width: 34, height: 34, borderRadius: 10, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  stepText:      { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19, paddingTop: 5 },
  referralWrap:  { gap: 8, marginBottom: 16 },
  ctaBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 15 },
  ctaBtnText:    { color: SURFACE, fontSize: 15, fontWeight: "700" },
});
