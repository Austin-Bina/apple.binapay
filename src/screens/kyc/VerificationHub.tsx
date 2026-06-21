import React, { useMemo } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Animated,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { useGetLimitsQuery } from "@store/redux-api/kycApi";
import { SCREENS } from "@constants/screens";
import { KYCStackScreenProps } from "@navigators/types";
import { CommonActions } from "@react-navigation/native";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Props = KYCStackScreenProps<typeof SCREENS.VERIFICATION_HUB>;

export default function VerificationHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const user   = useSelector(selectUser);
  const { data: limitsData } = useGetLimitsQuery();
  const limits = limitsData?.data;

  const isEmailVerified = !!user?.email_verified_at;
  const isPhoneVerified = !!user?.phone_verified_at || !!limits?.is_phone_verified;
  const isBvnOrNin      = !!user?.is_bvn_verified || !!user?.is_nin_verified || !!limits?.is_bvn_verified || !!limits?.is_nin_verified;
  const kycTier         = limits?.kyc_tier ?? user?.kyc_tier ?? 0;

  // Tier 1: email + phone + bvn/nin
  const tier1Steps = [
  { label: "Email Verified", subtitle: user?.email ?? "", done: isEmailVerified, icon: "email-check-outline" },
  { label: "Phone Number", subtitle: isPhoneVerified ? user?.phone ?? "Verified" : "Not verified", done: isPhoneVerified, icon: "phone-check-outline",
    onPress: isPhoneVerified ? undefined : () => navigation.navigate(SCREENS.PHONE_VERIFICATION) },
  { label: "BVN or NIN", subtitle: isBvnOrNin ? "Verified" : "Not verified", done: isBvnOrNin, icon: "card-account-details-outline",
    onPress: isBvnOrNin ? undefined : () => navigation.navigate(SCREENS.BVN_NIN_CHOICE) },
];
  
    //{ label: "BVN or NIN", subtitle: isBvnOrNin ? "Verified" : "Not verified", done: isBvnOrNin, icon: "card-account-details-outline",
   //onPress: isBvnOrNin ? undefined : () => {
 // navigation.dispatch(CommonActions.navigate(SCREENS.PREMBLY_VERIFICATION));
//}  }

//];

  const tier2Steps = [
  
    { label: "Address Verification", subtitle: "Verify your residential address",  
      done: kycTier >= 2, 
      icon: "home-outline",
       onPress: undefined,
        locked: true,
        comingSoon: true,
    },
  ];

  // Progress: email(1) + phone(1) + bvnNin(1) + face(1) + address(1) = 5 total
  const completedCount = [isEmailVerified, isPhoneVerified, isBvnOrNin, kycTier >= 2, kycTier >= 2].filter(Boolean).length;
  const progressPct    = Math.round((completedCount / 5) * 100);

  return (
    <View style={[s.root ]}>
      <ScreenHeader
      title="Verification"
      onBack={() => navigation.goBack()}
  rightIcon="shield-check-outline"
  onRightPress={() => {}}
/>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* Progress card */}
        <View style={s.progressCard}>
          <Text style={s.progressLabel}>Verification Progress</Text>
          <Text style={s.progressPct}>{progressPct}% Complete</Text>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progressPct}%` as any }]} />
          </View>
          <Text style={s.progressSub}>
            Complete verification to unlock higher limits and secure your account.
          </Text>
        </View>

        {/* Tier 1 */}
        <Text style={s.tierLabel}>Tier 1 – Basic Verification</Text>
        <View style={s.tierCard}>
          {tier1Steps.map((step, i) => (
            <TierRow
              key={step.label}
              {...step}
              isLast={i === tier1Steps.length - 1}
            />
          ))}
        </View>

        {/* Tier 2 */}
        <Text style={[s.tierLabel, { marginTop: 20 }]}>Tier 2 – Advanced Verification</Text>
        <View style={s.tierCard}>
          {tier2Steps.map((step, i) => (
            <TierRow
              key={step.label}
              {...step}
              isLast={i === tier2Steps.length - 1}
            />
          ))}
        </View>

        {/* View limits */}
        <TouchableOpacity
          style={s.limitsBtn}
          onPress={() => navigation.navigate(SCREENS.VERIFICATION_LIMITS)}
        >
          <MaterialCommunityIcons name="chart-bar" size={18} color={BLUE} />
          <Text style={s.limitsBtnText}>View Verification & Limits</Text>
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
    <TouchableOpacity
      style={[s.tierRow, isLast && { borderBottomWidth: 0 }]}
      onPress={onPress}
      disabled={!onPress || locked}
      activeOpacity={0.7}
    >
      <View style={[s.tierIcon, done && s.tierIconDone, locked && s.tierIconLocked]}>
        <MaterialCommunityIcons
          name={locked ? "lock-outline" : icon as any}
          size={20}
          color={done ? "#16a34a" : locked ? "#9ca3af" : BLUE}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[s.tierRowTitle, done && { color: "#6b7280" }]}>{label}</Text>
        <Text style={s.tierRowSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      {done ? (
        <MaterialCommunityIcons name="check-circle" size={22} color="#16a34a" />
      ) : locked ? (
        <MaterialCommunityIcons name="lock" size={18} color="#d1d5db" />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={20} color="#9ca3af" />
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#f8f9fb" },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:        { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  shieldBtn:      { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:    { fontSize: 17, fontWeight: "700", color: BRAND },

  progressCard:   { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: "#f0f0f0" },
  progressLabel:  { fontSize: 12, color: "#9ca3af", marginBottom: 4 },
  progressPct:    { fontSize: 22, fontWeight: "800", color: BLUE, marginBottom: 10 },
  progressBar:    { height: 8, backgroundColor: "#e5e7eb", borderRadius: 4, overflow: "hidden", marginBottom: 10 },
  progressFill:   { height: 8, backgroundColor: BLUE, borderRadius: 4 },
  progressSub:    { fontSize: 12, color: "#6b7280" },

  tierLabel:      { fontSize: 13, fontWeight: "700", color: BRAND, marginBottom: 10 },
  tierCard:       { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  tierRow:        { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  tierIcon:       { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  tierIconDone:   { backgroundColor: "#dcfce7" },
  tierIconLocked: { backgroundColor: "#f3f4f6" },
  tierRowTitle:   { fontSize: 14, fontWeight: "600", color: "#111827" },
  tierRowSub:     { fontSize: 12, color: "#9ca3af", marginTop: 2 },

  limitsBtn:      { flexDirection: "row", alignItems: "center", gap: 8, justifyContent: "center", marginTop: 20, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14 },
  limitsBtnText:  { fontSize: 14, fontWeight: "600", color: BLUE, flex: 1 },
});
