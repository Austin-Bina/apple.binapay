import React from "react";
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import { route } from "@helpers/route";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { useGetReferralRewardsQuery } from "@store/redux-api/referralQueryApi";
import { formatToNaira } from "@utils/money";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

type Props = AccountStackScreenProps<"BinaPay Rewards">;

export default function BinaRewardsScreen({ navigation }: Props) {
  const user   = useTypedSelector(selectUser);
  const insets = useSafeAreaInsets();
  const { data, isFetching } = useGetReferralRewardsQuery({ page: 1, per_page: 1 });

  const referrerBonus = data?.meta?.referrer_bonus ?? 0;
  const refereeBonus  = data?.meta?.referee_bonus ?? 0;
  const steps = data?.meta?.how_it_works ?? [];

  return (
                <View style={[s.root]}>

        <ScreenHeader
       title="BinaPay Rewards"
       subtitle="Earn by inviting friends"
       onBack={() => navigation.goBack()}
       rightIcon="shield-check-outline"
        />

      <ScrollableView contentContainerStyle={s.scroll}>
        <View style={s.heroCard}>
          <MaterialCommunityIcons name="gift-open-outline" size={36} color="#fff" style={{ marginBottom: 10 }} />
          <Text style={s.heroTitle}>Invite Friends, Earn Rewards</Text>
          {isFetching ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginTop: 8 }} />
          ) : (
            <Text style={s.heroSub}>
              When they complete the requirements, both of you receive rewards.
            </Text>
          )}
        </View>

        {!isFetching && (
          <>
            <Text style={s.sectionTitle}>Your Rewards</Text>
            <View style={s.card}>
              <View style={s.exampleRow}>
                <Text style={s.exampleTrade}>You receive</Text>
                <View style={s.exampleBadge}>
                  <Text style={s.exampleBadgeText}>{formatToNaira(referrerBonus)}</Text>
                </View>
              </View>
              <View style={s.rowDivider} />
              <View style={s.exampleRow}>
                <Text style={s.exampleTrade}>Friend receives</Text>
                <View style={s.exampleBadge}>
                  <Text style={s.exampleBadgeText}>{formatToNaira(refereeBonus)}</Text>
                </View>
              </View>
            </View>
          </>
        )}

        <Text style={s.sectionTitle}>How It Works</Text>
        <View style={s.card}>
          {steps.map((step, i) => (
            <View key={i}>
              <View style={s.stepRow}>
                <View style={s.stepIconWrap}>
                  <MaterialCommunityIcons name={step.icon as any} size={18} color={BLUE} />
                </View>
                <Text style={s.stepText}>{step.text}</Text>
              </View>
              {i < steps.length - 1 && <View style={s.rowDivider} />}
            </View>
          ))}
        </View>

        {user?.affiliate_id && (
          <>
            <Text style={s.sectionTitle}>Your Referral</Text>
            <View style={s.referralWrap}>
              <CopyReferralCode
                referralCode={`${route("auth.register", { type: "web" })}?ref=${user.affiliate_id}`}
                labelText="Copy Referral Link"
              />
              <CopyReferralCode referralCode={user.affiliate_id} labelText="Copy Code Only" />
            </View>
          </>
        )}

        <TouchableOpacity
          style={s.viewEarningsBtn}
          onPress={() => navigation.navigate("Earning Summary")}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="chart-bar" size={18} color="#fff" />
          <Text style={s.viewEarningsBtnText}>View Earnings</Text>
        </TouchableOpacity>
      </ScrollableView>
    </View>
  );
}

const s = StyleSheet.create({
  root:               { flex: 1, backgroundColor: "#f8f9fb" },
  header:             { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:            { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:        { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:          { fontSize: 11, color: "#6b7280", marginTop: 1 },
  scroll:             { padding: 16, paddingBottom: 40 },
  heroCard:           { backgroundColor: BRAND, borderRadius: 18, padding: 24, alignItems: "center", marginBottom: 20 },
  heroTitle:          { fontSize: 20, fontWeight: "800", color: "#fff", textAlign: "center", marginBottom: 8 },
  heroSub:            { fontSize: 14, color: "rgba(255,255,255,0.85)", textAlign: "center", lineHeight: 20 },
  sectionTitle:       { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  card:               { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden", marginBottom: 16 },
  rowDivider:         { height: 1, backgroundColor: "#f3f4f6", marginLeft: 14 },
  exampleRow:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  exampleTrade:       { fontSize: 13, fontWeight: "600", color: "#111827" },
  exampleBadge:       { backgroundColor: "#dcfce7", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  exampleBadgeText:   { fontSize: 13, fontWeight: "700", color: "#16a34a" },
  stepRow:            { flexDirection: "row", alignItems: "flex-start", gap: 10, padding: 14 },
  stepIconWrap:       { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  stepText:           { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18, paddingTop: 6 },
  referralWrap:       { gap: 8, marginBottom: 16 },
  viewEarningsBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, borderRadius: 12, paddingVertical: 15 },
  viewEarningsBtnText:{ color: "#fff", fontSize: 15, fontWeight: "700" },
});
