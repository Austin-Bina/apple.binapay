import { AvatarImage } from "@components/avatar";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { useGetReferralRewardsQuery, useWithdrawRewardBalanceMutation } from "@store/redux-api/referralQueryApi";
import { selectUser } from "@store/selectors/auth";
import { authSliceActions } from "@store/slice/auth";
import { showToast } from "@helpers/toast";
import { formatToNaira } from "@utils/money";
import React, { useMemo, useState } from "react";
import { RefreshControl, View, StyleSheet, TouchableOpacity, Modal } from "react-native";
import { Text } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

type Props = AccountStackScreenProps<"Earning Summary">;

export default function EarningSummaryScreen({}: Props) {
  const user       = useTypedSelector(selectUser);
  const dispatch   = useTypedDispatch();
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<Props["navigation"]>();

  const { data: queryData, error, isFetching, refetch } = useGetReferralRewardsQuery({ page: 1, per_page: 10 });
  const [withdrawReward, { isLoading: isWithdrawing }] = useWithdrawRewardBalanceMutation();
  const [showConfirmModal, setShowConfirmModal] = React.useState(false);
  const summary = useMemo(() => {
    if (!queryData) {
      return {
        data: [],
        meta: { has_more: false, total_earnings: 0, total_referrals: 0, minimum_reward_withdrawal: 0 },
      };
    }
    return queryData;
  }, [queryData]);

  // Reward Wallet — what's actually available to withdraw right now.
  // Deliberately distinct from "Total Earnings" above: that's a lifetime
  // record and doesn't shrink after a withdrawal, this does.
  const rewardBalance     = Number((user?.wallet_balances as any)?.reward?.balance ?? 0);
  const minimumWithdrawal = summary.meta.minimum_reward_withdrawal ?? 0;
//const canWithdraw       = minimumWithdrawal > 0 && rewardBalance >= minimumWithdrawal;

const handleWithdrawPress = () => {
  if (isWithdrawing) return;
  setShowConfirmModal(true);
};

const confirmWithdraw = async () => {
  setShowConfirmModal(false);
  try {
    const result = await withdrawReward().unwrap();
    showToast({
      variant: "success",
      message: result?.message ?? "Reward balance withdrawn to your Naira wallet.",
    });
    dispatch(authSliceActions.fetchUserProfileSilent());
  } catch (err: any) {
    showToast({
      variant: "error",
      message: err?.data?.message ?? "Withdrawal failed. Please try again.",
    });
  }
};

  return (
    


        <View style={[s.root]}>

        <ScreenHeader
       title="Earnings Overview"
       subtitle="Your referral earnings at a glance"
       onBack={() => navigation.goBack()}
       rightIcon="shield-check-outline"
        />

      <ScrollableView
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        <View style={s.statsRow}>
          <View style={[s.statCard, { flex: 1 }]}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color={BLUE} style={{ marginBottom: 6 }} />
            <Text style={s.statValue}>{formatToNaira(summary.meta.total_earnings)}</Text>
            <Text style={s.statLabel}>Total Earnings</Text>
          </View>
          <View style={[s.statCard, { flex: 1 }]}>
            <MaterialCommunityIcons name="account-multiple-outline" size={20} color="#7c3aed" style={{ marginBottom: 6 }} />
            <Text style={[s.statValue, { color: "#7c3aed" }]}>{summary.meta.total_referrals}</Text>
            <Text style={s.statLabel}>Total Referrals</Text>
          </View>
        </View>

        {/* Reward Wallet — available balance + withdraw */}
        <View style={s.rewardCard}>
          <View style={s.rewardHeader}>
            <View style={s.rewardIconWrap}>
              <MaterialCommunityIcons name="wallet-outline" size={18} color="#16a34a" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.rewardLabel}>Reward Wallet</Text>
              <Text style={s.rewardSub}>Available Balance</Text>
            </View>
          </View>
          <Text style={s.rewardBalance}>{formatToNaira(rewardBalance)}</Text>

       {rewardBalance > 0 && minimumWithdrawal > 0 && (
  <Text style={s.minWithdrawText}>
    Minimum withdrawal: {formatToNaira(minimumWithdrawal)}
  </Text>
)}

<TouchableOpacity
  style={[
    s.withdrawBtn,
    isWithdrawing && s.withdrawBtnDisabled,
  ]}
  disabled={isWithdrawing}
  onPress={handleWithdrawPress}
  activeOpacity={0.85}
>
  <Text style={s.withdrawBtnText}>
    {isWithdrawing ? "Withdrawing..." : "Withdraw to Naira Wallet"}
  </Text>
</TouchableOpacity>

{rewardBalance > 0 && rewardBalance < minimumWithdrawal && (
  <Text style={s.rewardHint}>
    You need at least {formatToNaira(minimumWithdrawal)} in your reward wallet
    to withdraw. Earn a little more through referrals to reach the minimum.
  </Text>
)}
 </View>

        <TouchableOpacity
          style={s.leaderboardBtn}
          onPress={() => navigation.navigate("Leaderboard", { filter: "weekly" })}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="trophy-outline" size={18} color="#fff" />
          <Text style={s.leaderboardBtnText}>View Leaderboard</Text>
        </TouchableOpacity>

        {user?.affiliate_id && (
          <View style={{ marginBottom: 20 }}>
            <CopyReferralCode referralCode={user.affiliate_id} />
          </View>
        )}

        {!!error && !isFetching && (
          <View style={s.errorCard}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#DC2626" />
            <Text style={s.errorText}>Couldn't fetch earnings. Pull down to refresh.</Text>
          </View>
        )}

        <Text style={s.sectionTitle}>Earnings Summary</Text>

        {summary.data.length === 0 && !isFetching && (
          <View style={s.emptyWrap}>
            <MaterialCommunityIcons name="account-group-outline" size={48} color="#d1d5db" />
            <Text style={s.emptyTitle}>No earnings yet</Text>
            <Text style={s.emptySub}>Invite friends to start earning rewards.</Text>
          </View>
        )}

        <View style={s.card}>
          {summary.data.map((item, index) => (
            <View key={item.id}>
              <View style={s.refereeRow}>
                <AvatarImage avatar={item.referee?.avatar ?? undefined} size={40} />
                <View style={s.refereeInfo}>
                  <Text style={s.refereeName} numberOfLines={1}>{item.referee?.name ?? "Unknown User"}</Text>
                  <Text style={s.refereeVolume}>
                 {item.completed && item.rewarded_at
                ? `Rewarded ${new Date(item.rewarded_at).toLocaleDateString()}`
                 : "Pending eligibility"}
                  </Text>
                </View>
                <View style={[s.rewardBadge, !item.completed && { backgroundColor: "#f3f4f6" }]}>
                  <Text style={[s.rewardBadgeText, !item.completed && { color: "#6b7280" }]}>
                    {item.completed ? formatToNaira(item.reward_amount) : "Pending"}
                  </Text>
                </View>
              </View>
              {index < summary.data.length - 1 && <View style={s.rowDivider} />}
            </View>
          ))}
        </View>
      </ScrollableView>

      <Modal
  visible={showConfirmModal}
  transparent
  animationType="fade"
  onRequestClose={() => setShowConfirmModal(false)}
>
  <View style={s.modalOverlay}>
    <View style={s.confirmModal}>
      <View style={s.confirmIconWrap}>
        <MaterialCommunityIcons name="swap-horizontal" size={28} color={BLUE} />
      </View>
      <Text style={s.confirmTitle}>Withdraw Reward Balance</Text>
      <Text style={s.confirmSub}>
        {formatToNaira(rewardBalance)} will move from your Reward Wallet to your Naira Wallet.
      </Text>
      <View style={s.confirmActions}>
        <TouchableOpacity
          style={s.confirmCancelBtn}
          onPress={() => setShowConfirmModal(false)}
        >
          <Text style={s.confirmCancelText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.confirmBtn2} onPress={confirmWithdraw}>
          <Text style={s.confirmBtnText2}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
</Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#f8f9fb" },
  header:           { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:          { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:      { fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:        { fontSize: 11, color: "#6b7280", marginTop: 1 },
  scroll:           { padding: 16, paddingBottom: 40 },
  statsRow:         { flexDirection: "row", gap: 10, marginBottom: 12 },
  statCard:         { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, alignItems: "center" },
  statValue:        { fontSize: 16, fontWeight: "800", color: BRAND, marginBottom: 2 },
  statLabel:        { fontSize: 11, color: "#6b7280", textAlign: "center" },

  rewardCard:       { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 16, marginBottom: 16 },
  rewardHeader:     { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  rewardIconWrap:   { width: 34, height: 34, borderRadius: 10, backgroundColor: "#dcfce7", justifyContent: "center", alignItems: "center" },
  rewardLabel:      { fontSize: 13, fontWeight: "700", color: "#111827" },
  rewardSub:        { fontSize: 11, color: "#6b7280", marginTop: 1 },
  rewardBalance:    { fontSize: 26, fontWeight: "800", color: BRAND, marginBottom: 6 },
  minWithdrawText:  { fontSize: 11, color: "#9ca3af", marginBottom: 12 },
  withdrawBtn:      { backgroundColor: BLUE, borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  withdrawBtnDisabled: { backgroundColor: "#e5e7eb" },
  withdrawBtnText:  { fontSize: 14, fontWeight: "700", color: "#fff" },
  rewardHint:       { fontSize: 11, color: "#9ca3af", marginTop: 10, lineHeight: 16 },

  leaderboardBtn:   { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BRAND, borderRadius: 12, paddingVertical: 13, marginBottom: 16 },
  leaderboardBtnText:{ color: "#fff", fontSize: 14, fontWeight: "700" },
  errorCard:        { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF2F2", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#fecaca" },
  errorText:        { fontSize: 13, color: "#DC2626", flex: 1 },
  sectionTitle:     { fontSize: 13, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  emptyWrap:        { alignItems: "center", paddingVertical: 32, gap: 6 },
  emptyTitle:       { fontSize: 15, fontWeight: "700", color: "#374151" },
  emptySub:         { fontSize: 13, color: "#9ca3af", textAlign: "center" },
  card:             { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  refereeRow:       { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  refereeInfo:      { flex: 1 },
  refereeName:      { fontSize: 13, fontWeight: "600", color: "#111827" },
  refereeVolume:    { fontSize: 11, color: "#6b7280", marginTop: 1 },
  rewardBadge:      { backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  rewardBadgeText:  { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  rowDivider:       { height: 1, backgroundColor: "#f3f4f6", marginLeft: 62 },

  modalOverlay:     { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 24 },
  confirmModal:     { width: "100%", backgroundColor: "#fff", borderRadius: 18, padding: 22, alignItems: "center" },
  confirmIconWrap:  { width: 52, height: 52, borderRadius: 26, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  confirmTitle:     { fontSize: 16, fontWeight: "800", color: BRAND, marginBottom: 6, textAlign: "center" },
  confirmSub:       { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19, marginBottom: 20 },
  confirmActions:   { flexDirection: "row", gap: 10, width: "100%" },
  confirmCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" },
  confirmCancelText:{ fontSize: 14, fontWeight: "600", color: "#374151" },
  confirmBtn2:      { flex: 1, paddingVertical: 13, borderRadius: 12, backgroundColor: BLUE, alignItems: "center" },
  confirmBtnText2:  { fontSize: 14, fontWeight: "700", color: "#fff" },
});
