// ═══════════════════════════════════════════════════════════════════════════
// UpgradeTier2Screen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, StatusBar } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { useGetLimitsQuery } from "@store/redux-api/kycApi";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import { CommonActions } from "@react-navigation/native";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

// ─────────────────────────────────────────────────────────────────────────────
type Tier2Props = KYCStackScreenProps<typeof SCREENS.UPGRADE_TIER2>;

export function UpgradeTier2Screen({ navigation }: Tier2Props) {
  const insets = useSafeAreaInsets();

  const requirements = [
    { icon: "face-recognition",  title: "Face Verification",    sub: "Verify your face to confirm account ownership.", screen: SCREENS.FACE_VERIFICATION },
    { icon: "home-city-outline", title: "Address Verification", sub: "Verify your current residential address.",        screen: SCREENS.ADDRESS_VERIFICATION },
  ];

  return (
    <View style={[t2.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={t2.navBar}>
        <TouchableOpacity style={t2.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={t2.navCenter}>
          <Text style={t2.navTitle}>Upgrade to Tier 2</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={t2.body}>
        {/* Banner */}
        <View style={[t2.banner, IOS_SHADOW]}>
          <View style={t2.bannerIconWrap}>
            <MaterialCommunityIcons name="shield-crown-outline" size={40} color={BLUE} />
          </View>
          <Text style={t2.bannerTitle}>Unlock Higher Limits</Text>
          <Text style={t2.bannerSub}>Complete Tier 2 to enjoy higher transaction and crypto limits.</Text>
        </View>

        <Text style={t2.sectionLabel}>Requirements</Text>
        <View style={[t2.reqCard, IOS_SHADOW]}>
          {requirements.map((req, i) => (
            <React.Fragment key={req.title}>
              {i > 0 && <View style={t2.hairline} />}
              <TouchableOpacity style={t2.reqRow} onPress={() => navigation.navigate(req.screen as any)} activeOpacity={0.8}>
                <View style={t2.reqIconWrap}>
                  <MaterialCommunityIcons name={req.icon as any} size={22} color={BLUE} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={t2.reqTitle}>{req.title}</Text>
                  <Text style={t2.reqSub}>{req.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={PLACEHOLDER} />
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <TouchableOpacity style={t2.startBtn} onPress={() => navigation.navigate(SCREENS.FACE_VERIFICATION as any)} activeOpacity={0.85}>
          <Text style={t2.startBtnText}>Start Tier 2 Verification</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const t2 = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG },
  navBar:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:       { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:     { flex: 1, alignItems: "center" },
  navTitle:      { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  body:          { flex: 1, padding: 20 },
  banner:        { backgroundColor: BLUE_LIGHT, borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  bannerIconWrap:{ width: 72, height: 72, borderRadius: 36, backgroundColor: SURFACE, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  bannerTitle:   { fontSize: 18, fontWeight: "800", color: BRAND, marginBottom: 6, letterSpacing: -0.3 },
  bannerSub:     { fontSize: 13, color: SUBLABEL, textAlign: "center", lineHeight: 19 },
  sectionLabel:  { fontSize: 12, fontWeight: "600", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 10, marginLeft: 4 },
  reqCard:       { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 20 },
  hairline:      { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 62 },
  reqRow:        { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 15, minHeight: 64 },
  reqIconWrap:   { width: 44, height: 44, borderRadius: 22, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  reqTitle:      { fontSize: 14, fontWeight: "600", color: LABEL, marginBottom: 2 },
  reqSub:        { fontSize: 12, color: SUBLABEL },
  startBtn:      { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  startBtnText:  { fontSize: 16, fontWeight: "700", color: SURFACE },
});

// ═══════════════════════════════════════════════════════════════════════════
// VerificationHubScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
type HubProps = KYCStackScreenProps<typeof SCREENS.VERIFICATION_HUB>;

export function VerificationHubScreen({ navigation }: HubProps) {
  const insets = useSafeAreaInsets();
  const user   = useSelector(selectUser);
  const { data: limitsData } = useGetLimitsQuery();
  const limits = limitsData?.data;

  // ── All original logic — untouched ────────────────────────────────────────
  const isEmailVerified = !!user?.email_verified_at;
  const isPhoneVerified = !!user?.phone_verified_at || !!limits?.is_phone_verified;
  const isBvnOrNin      = !!user?.is_bvn_verified || !!user?.is_nin_verified || !!limits?.is_bvn_verified || !!limits?.is_nin_verified;
  const kycTier         = limits?.kyc_tier ?? user?.kyc_tier ?? 0;

  const tier1Steps = [
    { label: "Email Verified",  subtitle: user?.email ?? "",                                 done: isEmailVerified, icon: "email-check-outline", onPress: undefined },
    { label: "Phone Number",    subtitle: isPhoneVerified ? user?.phone ?? "Verified" : "Not verified", done: isPhoneVerified, icon: "phone-check-outline",
      onPress: isPhoneVerified ? undefined : () => navigation.navigate(SCREENS.PHONE_VERIFICATION) },
    { label: "BVN or NIN",      subtitle: isBvnOrNin ? "Verified" : "Not verified",          done: isBvnOrNin, icon: "card-account-details-outline",
      onPress: isBvnOrNin ? undefined : () => navigation.navigate(SCREENS.BVN_NIN_CHOICE) },
  ];
  const tier2Steps = [
    { label: "Face Verification",    subtitle: "Verify your face to confirm your identity", done: kycTier >= 2, icon: "face-recognition",
      onPress: () => navigation.navigate(SCREENS.UPGRADE_TIER2), locked: kycTier < 1 },
    { label: "Address Verification", subtitle: "Verify your residential address",           done: kycTier >= 2, icon: "home-outline",
      onPress: () => navigation.navigate(SCREENS.UPGRADE_TIER2), locked: kycTier < 1 },
  ];
  const completedCount = [isEmailVerified, isPhoneVerified, isBvnOrNin, kycTier >= 2, kycTier >= 2].filter(Boolean).length;
  const progressPct    = Math.round((completedCount / 5) * 100);

  return (
    <View style={[vh.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={vh.navBar}>
        <TouchableOpacity style={vh.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={vh.navTitle}>Verification</Text>
        <View style={vh.shieldBtn}>
          <MaterialCommunityIcons name="shield-check-outline" size={20} color={BLUE} />
        </View>
      </View>

      <ScrollView contentContainerStyle={vh.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress card */}
        <View style={[vh.progressCard, IOS_SHADOW]}>
          <Text style={vh.progressLabel}>Verification Progress</Text>
          <Text style={vh.progressPct}>{progressPct}% Complete</Text>
          <View style={vh.progressBar}>
            <View style={[vh.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <Text style={vh.progressSub}>Complete verification to unlock higher limits and secure your account.</Text>
        </View>

        <Text style={vh.tierLabel}>Tier 1 – Basic Verification</Text>
        <View style={[vh.tierCard, IOS_SHADOW]}>
          {tier1Steps.map((step, i) => (
            <TierRow key={step.label} {...step} isLast={i === tier1Steps.length - 1} />
          ))}
        </View>

        <Text style={[vh.tierLabel, { marginTop: 20 }]}>Tier 2 – Advanced Verification</Text>
        <View style={[vh.tierCard, IOS_SHADOW]}>
          {tier2Steps.map((step, i) => (
            <TierRow key={step.label} {...step} isLast={i === tier2Steps.length - 1} />
          ))}
        </View>

        <TouchableOpacity style={[vh.limitsBtn, IOS_SHADOW]} onPress={() => navigation.navigate(SCREENS.VERIFICATION_LIMITS)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="chart-bar" size={18} color={BLUE} />
          <Text style={vh.limitsBtnText}>View Verification &amp; Limits</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function TierRow({ label, subtitle, done, icon, onPress, locked, isLast }: {
  label: string; subtitle: string; done: boolean; icon: string;
  onPress?: () => void; locked?: boolean; isLast: boolean;
}) {
  return (
    <TouchableOpacity style={[vh.tierRow, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress} disabled={!onPress || locked} activeOpacity={0.7}>
      <View style={[vh.tierIcon, done && vh.tierIconDone, locked && vh.tierIconLocked]}>
        <MaterialCommunityIcons name={locked ? "lock-outline" : icon as any} size={20}
          color={done ? "#16A34A" : locked ? PLACEHOLDER : BLUE} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[vh.tierRowTitle, done && { color: SUBLABEL }]}>{label}</Text>
        <Text style={vh.tierRowSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      {done ? <MaterialCommunityIcons name="check-circle" size={22} color="#16A34A" />
             : locked ? <MaterialCommunityIcons name="lock" size={18} color="#D1D5DB" />
             : <MaterialCommunityIcons name="chevron-right" size={20} color={PLACEHOLDER} />}
    </TouchableOpacity>
  );
}

const vh = StyleSheet.create({
  root:         { flex: 1, backgroundColor: BG },
  navBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  shieldBtn:    { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:     { fontSize: 17, fontWeight: "700", color: BRAND },
  scroll:       { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  progressCard: { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  progressLabel:{ fontSize: 12, color: PLACEHOLDER, marginBottom: 4 },
  progressPct:  { fontSize: 22, fontWeight: "800", color: BLUE, marginBottom: 10 },
  progressBar:  { height: 8, backgroundColor: SEPARATOR, borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  progressFill: { height: 8, backgroundColor: BLUE, borderRadius: 4 },
  progressSub:  { fontSize: 12, color: SUBLABEL },
  tierLabel:    { fontSize: 12, fontWeight: "700", color: BRAND, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5, marginLeft: 4 },
  tierCard:     { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  tierRow:      { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  tierIcon:     { width: 42, height: 42, borderRadius: 21, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  tierIconDone: { backgroundColor: "#DCFCE7" },
  tierIconLocked:{ backgroundColor: BG },
  tierRowTitle: { fontSize: 14, fontWeight: "600", color: LABEL },
  tierRowSub:   { fontSize: 12, color: PLACEHOLDER, marginTop: 2 },
  limitsBtn:    { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 16, backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  limitsBtnText:{ fontSize: 14, fontWeight: "600", color: BLUE, flex: 1 },
});

// ═══════════════════════════════════════════════════════════════════════════
// VerificationLimitsScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
type LimitsProps = KYCStackScreenProps<typeof SCREENS.VERIFICATION_LIMITS>;

export function VerificationLimitsScreen({ navigation }: LimitsProps) {
  const insets = useSafeAreaInsets();
  const { data: limitsData } = useGetLimitsQuery();
  const limits = limitsData?.data;
  const tier   = limits?.kyc_tier ?? 0;

  const formatLimit = (v: number) =>
    v >= 1_000_000 ? `₦${(v / 1_000_000).toFixed(1)}M` : `₦${(v / 1000).toFixed(0)}k`;

  const limitRows = [
    { label: "Daily Transfer Limit",  current: limits?.daily_transfer_limit ?? 0, max: tier >= 2 ? 5_000_000 : 2_500_000, icon: "bank-transfer" },
    { label: "Wallet Balance Limit",  current: limits?.wallet_balance_limit  ?? 0, max: tier >= 2 ? 10_000_000 : 5_000_000, icon: "wallet-outline" },
    { label: "Per Transaction Limit", current: limits?.per_txn_limit         ?? 0, max: 2_000_000, icon: "swap-horizontal" },
  ];

  return (
    <View style={[vl.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={vl.navBar}>
        <TouchableOpacity style={vl.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={vl.navTitle}>Verification &amp; Limits</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={vl.scroll} showsVerticalScrollIndicator={false}>
        {/* Tier badge */}
        <View style={[vl.tierBadge, IOS_SHADOW]}>
          <View style={{ flex: 1 }}>
            <Text style={vl.tierBadgeLabel}>Your Verification Level</Text>
            <View style={vl.tierBadgeRow}>
              <Text style={vl.tierBadgeTitle}>Tier {tier}</Text>
              <View style={vl.verifiedPill}>
                <MaterialCommunityIcons name="shield-check" size={12} color="#fff" />
                <Text style={vl.verifiedPillText}>Verified</Text>
              </View>
            </View>
            <Text style={vl.tierBadgeSub}>{tier >= 2 ? "Fully verified account" : "Basic verified account"}</Text>
          </View>
          <MaterialCommunityIcons name="shield-check-outline" size={40} color="rgba(255,255,255,0.4)" />
        </View>

        {/* Limits card */}
        <View style={[vl.limitsCard, IOS_SHADOW]}>
          <View style={vl.limitsCardHeader}>
            <Text style={vl.limitsCardTitle}>Account Limits</Text>
          </View>
          {limitRows.map((row, i) => {
            const pct = Math.min((row.current / row.max) * 100, 100);
            return (
              <React.Fragment key={row.label}>
                {i > 0 && <View style={vl.hairline} />}
                <View style={vl.limitRow}>
                  <View style={vl.limitIcon}>
                    <MaterialCommunityIcons name={row.icon as any} size={20} color={BLUE} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={vl.limitTop}>
                      <Text style={vl.limitLabel}>{row.label}</Text>
                      <Text style={vl.limitValues}>{formatLimit(row.current)} / {formatLimit(row.max)}</Text>
                    </View>
                    <View style={vl.limitBar}>
                      <View style={[vl.limitFill, { width: `${pct}%` as any }]} />
                    </View>
                  </View>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        {tier < 2 && (
          <TouchableOpacity style={[vl.upgradeBtn, IOS_SHADOW]} onPress={() => navigation.navigate(SCREENS.UPGRADE_TIER2)} activeOpacity={0.8}>
            <MaterialCommunityIcons name="shield-crown-outline" size={18} color={BLUE} />
            <Text style={vl.upgradeBtnText}>Need higher limits? Contact support to upgrade further.</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const vl = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  navBar:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:         { fontSize: 16, fontWeight: "700", color: BRAND, flex: 1, textAlign: "center" },
  scroll:           { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  tierBadge:        { flexDirection: "row", alignItems: "center", backgroundColor: BRAND, borderRadius: 18, padding: 20, marginBottom: 16 },
  tierBadgeLabel:   { fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  tierBadgeRow:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  tierBadgeTitle:   { fontSize: 28, fontWeight: "800", color: "#fff" },
  verifiedPill:     { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#16A34A", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  verifiedPillText: { fontSize: 11, color: "#fff", fontWeight: "600" },
  tierBadgeSub:     { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  limitsCard:       { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 14 },
  limitsCardHeader: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  limitsCardTitle:  { fontSize: 15, fontWeight: "700", color: LABEL },
  hairline:         { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 56 },
  limitRow:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  limitIcon:        { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  limitTop:         { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  limitLabel:       { fontSize: 13, color: "#374151", fontWeight: "500" },
  limitValues:      { fontSize: 12, color: SUBLABEL },
  limitBar:         { height: 6, backgroundColor: SEPARATOR, borderRadius: 3, overflow: "hidden" },
  limitFill:        { height: 6, backgroundColor: BLUE, borderRadius: 3 },
  upgradeBtn:       { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  upgradeBtnText:   { flex: 1, fontSize: 13, color: BRAND, fontWeight: "500" },
});

// ═══════════════════════════════════════════════════════════════════════════
// VerificationSuccessScreen — iOS UI
// ═══════════════════════════════════════════════════════════════════════════
type SuccessProps = KYCStackScreenProps<typeof SCREENS.VERIFICATION_SUCCESS>;

export function VerificationSuccessScreen({ navigation, route }: SuccessProps) {
  const { tier } = route.params;
  const insets   = useSafeAreaInsets();

  const perks = tier === 1
    ? ["Send and receive money", "Buy and sell crypto", "Pay bills and buy airtime", "Enjoy basic account limits"]
    : ["Higher transfer limits", "Larger wallet balance limit", "Increased crypto limits", "Access all features"];

  return (
    <View style={[vs.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      <View style={vs.navBar}>
        <TouchableOpacity style={vs.backBtn} onPress={() => navigation.navigate(SCREENS.VERIFICATION_HUB)} activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <Text style={vs.navTitle}>Tier {tier} Complete!</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={vs.body}>
        {/* Badge with confetti dots */}
        <View style={vs.badgeWrap}>
          <View style={vs.badge}>
            <MaterialCommunityIcons name="medal" size={64} color={BLUE} />
          </View>
          <View style={vs.dot1} /><View style={vs.dot2} /><View style={vs.dot3} />
        </View>

        <Text style={vs.congrats}>Congratulations! 🎉</Text>
        <Text style={vs.subtitle}>You have successfully completed Tier {tier} verification.</Text>

        <View style={[vs.perksCard, IOS_SHADOW]}>
          <Text style={vs.perksTitle}>What you can do now</Text>
          {perks.map(perk => (
            <View key={perk} style={vs.perkRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
              <Text style={vs.perkText}>{perk}</Text>
            </View>
          ))}
        </View>

        {tier === 1 && (
          <TouchableOpacity style={vs.upgradeBtn} onPress={() => navigation.navigate(SCREENS.UPGRADE_TIER2)} activeOpacity={0.85}>
            <Text style={vs.upgradeBtnText}>Upgrade to Tier 2</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[vs.dashBtn, tier === 1 && { marginTop: 12 }]}
          onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: SCREENS.MAIN }] }))}
          activeOpacity={0.85}>
          <Text style={vs.dashBtnText}>Continue to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const vs = StyleSheet.create({
  root:         { flex: 1, backgroundColor: SURFACE },
  navBar:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navTitle:     { fontSize: 17, fontWeight: "700", color: BRAND },
  body:         { flex: 1, paddingHorizontal: 24, alignItems: "center", paddingTop: 32 },
  badgeWrap:    { position: "relative", marginBottom: 24 },
  badge:        { width: 120, height: 120, borderRadius: 60, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  dot1:         { position: "absolute", width: 12, height: 12, borderRadius: 6, backgroundColor: "#FBBF24", top: 8, right: -4 },
  dot2:         { position: "absolute", width: 8,  height: 8,  borderRadius: 4, backgroundColor: "#34D399", bottom: 10, left: -8 },
  dot3:         { position: "absolute", width: 10, height: 10, borderRadius: 5, backgroundColor: "#F87171", top: 20, left: -12 },
  congrats:     { fontSize: 26, fontWeight: "800", color: BRAND, textAlign: "center", marginBottom: 8, letterSpacing: -0.5 },
  subtitle:     { fontSize: 14, color: SUBLABEL, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  perksCard:    { width: "100%", backgroundColor: BG, borderRadius: 16, padding: 16, marginBottom: 24, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  perksTitle:   { fontSize: 14, fontWeight: "700", color: BRAND, marginBottom: 12 },
  perkRow:      { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  perkText:     { fontSize: 14, color: LABEL },
  upgradeBtn:   { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  upgradeBtnText: { fontSize: 16, fontWeight: "700", color: SURFACE },
  dashBtn:      { width: "100%", borderWidth: 1.5, borderColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center", marginTop: 24 },
  dashBtnText:  { fontSize: 16, fontWeight: "700", color: BLUE },
});

export default VerificationHubScreen;
