import React, { useEffect, useMemo, useState } from "react";
import {
  View, StyleSheet, TouchableOpacity, ImageBackground,
  useWindowDimensions, Platform, StatusBar,
} from "react-native";
import { ActivityIndicator, Button, IconButton, Text } from "react-native-paper";
import * as Clipboard from "expo-clipboard";
import { useTypedSelector } from "@store/common";
import { selectIsAccountVerified } from "@store/selectors/auth";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";
import { CopyFill } from "@components/icons/svg";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { useCreateAccountMutation, useListAccountsQuery } from "@store/redux-api/accountsApi";
import { selectCanCreateMoreAccounts } from "@store/selectors/accounts";
import { formatToNaira } from "@utils/money";
import { Colors } from "@constants/theme/colors";
import { useGetSystemSettingsQuery } from "@store/redux-api/systemSettingsApi";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Banner from "@components/ui/banner";
import ScrollableView from "@components/ui/shared/ScrollableView";

// ─── Tokens ──────────────────────────────────────────────────────────────────
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
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

// =============================================================================
export default function BankTransferScreen() {
  const insets = useSafeAreaInsets();

  // ── All original logic — untouched ────────────────────────────────────────
  const isVerified = useTypedSelector(selectIsAccountVerified);

  const { data: accountsQuery, isLoading } = useListAccountsQuery(undefined, {
    pollingInterval: 15000,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  const { data: systemSettings } = useGetSystemSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const [createDedicatedAccount, { isLoading: isCreatingAccount }] = useCreateAccountMutation();
  const canCreateMoreAccounts = useTypedSelector(selectCanCreateMoreAccounts());
  const bankSettings = systemSettings?.bank;
  const minAmount    = bankSettings?.min_transaction_amount;

  const prefetchSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });
  useEffect(() => { prefetchSettings(); }, []);

  const userAccounts = useMemo(() => accountsQuery?.accounts ?? [], [accountsQuery]);

  const handleBeginVerification = async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.MAIN, {
      screen: SCREENS.MENU,
      params: {
        screen: SCREENS.VERIFY_ACCOUNT,
        params: { screen: SCREENS.ACCOUNT_VERIFICATION_OPTIONS },
      },
    });
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar (no back btn — this is a tab/push destination) ── */}
      <View style={s.navBar}>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Fund via Bank Transfer</Text>
          <Text style={s.navSub}>Transfer to your dedicated account</Text>
        </View>
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* Subtitle */}
        <Text style={s.pageDesc}>
          Transfer the desired amount to the account below. Your BinaPay wallet will be credited once the transfer is confirmed.
        </Text>

        {/* Minimum amount pill */}
        {minAmount != null && (
          <View style={[s.minAmountPill, IOS_SHADOW]}>
            <MaterialCommunityIcons name="information-outline" size={14} color={BLUE} />
            <Text style={s.minAmountText}>
              Minimum transfer: <Text style={s.minAmountValue}>{formatToNaira(minAmount)}</Text>
            </Text>
          </View>
        )}

        {/* Loading */}
        {isLoading && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={BLUE} />
          </View>
        )}

        {/* Unverified banner */}
        {!isVerified && (
          <Banner
            title="Please verify your account to use this feature"
            content="This feature is only available for verified users with dedicated accounts."
          />
        )}

        {/* Account cards */}
        {userAccounts.map((account) => (
          <View key={account.id} style={[s.cardWrap, IOS_SHADOW]}>
            <ImageBackground
              source={require("@assets/images/card-background-waves.png")}
              style={s.cardBg}
              imageStyle={s.cardBgImage}>
              <BankCard
                accountName={account.account_name}
                bankName={account.bank_name}
                accountNumber={account.account_number}
                feeType={account.fee_type}
                chargePercentage={account.charge_percentage}
                flatFee={account.flat_fee}
              />
            </ImageBackground>
          </View>
        ))}

        {/* No accounts — verified */}
        {userAccounts.length === 0 && isVerified && (
          <View style={[s.emptyCard, IOS_SHADOW]}>
            <View style={s.emptyIconWrap}>
              <MaterialCommunityIcons name="bank-plus" size={28} color={BLUE} />
            </View>
            <Text style={s.emptyTitle}>No dedicated account yet</Text>
            <Text style={s.emptySub}>
              Create a dedicated account to start funding your BinaPay wallet via bank transfer.
            </Text>
            <Button
              style={s.createBtn}
              contentStyle={s.createBtnContent}
              mode="contained"
              onPress={createDedicatedAccount}>
              Create Account
            </Button>
          </View>
        )}

        {/* Can create more */}
        {canCreateMoreAccounts && userAccounts.length > 0 && (
          <View style={[s.moreCard, IOS_SHADOW]}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={BLUE} />
            <Text style={s.moreText}>
              You can add more accounts for additional funding options.
            </Text>
            <Button
              style={s.moreBtn}
              contentStyle={s.moreBtnContent}
              mode="outlined"
              onPress={createDedicatedAccount}>
              Add Another
            </Button>
          </View>
        )}

        {/* Verification CTA */}
        {!isVerified && (
          <View style={s.verifyCta}>
            <Button
              style={s.verifyBtn}
              contentStyle={s.verifyBtnContent}
              mode="contained"
              onPress={handleBeginVerification}>
              Begin Verification
            </Button>
          </View>
        )}

      </ScrollableView>

      <PleaseWaitModal visible={isCreatingAccount} />
    </View>
  );
}

// =============================================================================
// BankCard — all logic untouched, iOS card styling applied
// =============================================================================
interface BankCardProps {
  accountName: string;
  bankName: string;
  accountNumber: string;
  feeType: "percentage" | "flat";
  chargePercentage?: number;
  flatFee?: number;
}

export const BankCard: React.FC<BankCardProps> = ({
  accountName, bankName, accountNumber, feeType, chargePercentage, flatFee,
}) => {
  const formattedFee = formatToNaira(flatFee);

  return (
    <View style={s.bankCardInner}>
      <DetailRow label="Account Name"   value={accountName}   />
      <View style={s.cardRowDivider} />
      <DetailRow label="Bank Name"      value={bankName}      />
      <View style={s.cardRowDivider} />
      <DetailRow label="Account Number" value={accountNumber} copyable />
      <View style={s.cardFeeRow}>
        <Text style={s.cardFeeLabel}>Service Fee</Text>
        <Text style={s.cardFeeValue}>
          {feeType === "percentage" ? `${chargePercentage}%` : formattedFee}
        </Text>
      </View>
    </View>
  );
};

// =============================================================================
// DetailRow — all logic untouched, iOS row styling applied
// =============================================================================
interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
}

const DetailRow = ({ label, value, copyable = false }: DetailRowProps) => {
  const { width } = useWindowDimensions();
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const halfWidth = width - width / 2;

  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel} numberOfLines={1}>{label}</Text>
      {copyable ? (
        <View style={s.detailCopyRow}>
          <Text style={s.detailValueBold}>{value}</Text>
          <IconButton
            onPress={copyToClipboard}
            icon={copied ? "sticker-check" : (props) => <CopyFill {...props} />}
            iconColor="rgba(255,255,255,0.9)"
            size={18}
            style={{ margin: 0 }}
          />
        </View>
      ) : (
        <Text style={[s.detailValue, { maxWidth: halfWidth }]} numberOfLines={1}>{value}</Text>
      )}
    </View>
  );
};

// =============================================================================
const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: BG },

  // ── Nav bar ──────────────────────────────────────────────────────────────
  navBar:          { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  navCenter:       { alignItems: "center" },
  navTitle:        { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:          { fontSize: 11, color: SUBLABEL, marginTop: 1 },

  // ── Scroll content ────────────────────────────────────────────────────────
  scroll:          { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 48 },

  pageDesc:        { fontSize: 14, color: SUBLABEL, lineHeight: 20, marginBottom: 14 },

  // ── Minimum amount pill ───────────────────────────────────────────────────
  minAmountPill:   { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: BLUE_LIGHT, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginBottom: 16, alignSelf: "flex-start", borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  minAmountText:   { fontSize: 13, color: BLUE },
  minAmountValue:  { fontWeight: "700" },

  // ── Loading ───────────────────────────────────────────────────────────────
  loadingWrap:     { paddingVertical: 24, alignItems: "center" },

  // ── Account card ─────────────────────────────────────────────────────────
  cardWrap:        { borderRadius: 18, overflow: "hidden", marginBottom: 14 },
  cardBg:          { backgroundColor: BRAND, padding: 20 },
  cardBgImage:     { borderRadius: 18 },
  bankCardInner:   {},

  // Rows inside the gradient card
  detailRow:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  detailLabel:     { fontSize: 13, color: "rgba(255,255,255,0.7)", flex: 1 },
  detailValue:     { fontSize: 15, fontWeight: "600", color: "#fff", textAlign: "right" },
  detailValueBold: { fontSize: 16, fontWeight: "800", color: "#fff" },
  detailCopyRow:   { flexDirection: "row", alignItems: "center", gap: 2 },
  cardRowDivider:  { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.15)" },
  cardFeeRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.25)" },
  cardFeeLabel:    { fontSize: 13, color: "rgba(255,255,255,0.7)" },
  cardFeeValue:    { fontSize: 15, fontWeight: "800", color: "#fff" },

  // ── Empty state card ──────────────────────────────────────────────────────
  emptyCard:       { backgroundColor: SURFACE, borderRadius: 16, padding: 24, alignItems: "center", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 14, gap: 8 },
  emptyIconWrap:   { width: 60, height: 60, borderRadius: 30, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  emptyTitle:      { fontSize: 16, fontWeight: "700", color: LABEL },
  emptySub:        { fontSize: 13, color: SUBLABEL, textAlign: "center", lineHeight: 19 },
  createBtn:       { borderRadius: 14, marginTop: 8, width: "100%" },
  createBtnContent:{ paddingVertical: 6 },

  // ── Create more card ──────────────────────────────────────────────────────
  moreCard:        { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: SURFACE, borderRadius: 14, padding: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 14 },
  moreText:        { flex: 1, fontSize: 13, color: SUBLABEL, lineHeight: 18 },
  moreBtn:         { borderRadius: 10 },
  moreBtnContent:  { paddingVertical: 4 },

  // ── Verification CTA ──────────────────────────────────────────────────────
  verifyCta:       { marginTop: 8 },
  verifyBtn:       { borderRadius: 14 },
  verifyBtnContent:{ paddingVertical: 7 },
});
