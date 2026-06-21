import Banner from "@components/ui/banner";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { selectIsAccountVerified } from "@store/selectors/auth";
import { useEffect, useMemo, useState } from "react";
import { ImageBackground, View, StyleSheet, TouchableOpacity } from "react-native";
import { ActivityIndicator, Button, IconButton, Text } from "react-native-paper";
import * as Clipboard from "expo-clipboard";
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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

export default function BankTransferScreen() {
  const isVerified = useTypedSelector(selectIsAccountVerified);
  const navigation = useNavigation<any>();

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
  const minAmount = bankSettings?.min_transaction_amount;

  const prefetchSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  useEffect(() => {
    prefetchSettings();
  }, []);

  const userAccounts = useMemo(() => accountsQuery?.accounts ?? [], [accountsQuery]);

  const handleBeginVerification = async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.MAIN, {
      screen: SCREENS.MENU,
      params: {
        screen: SCREENS.VERIFY_ACCOUNT,
        params: {
          screen: SCREENS.VERIFICATION_HUB,
        },
      },
    });
  };

  return (
    <View style={s.root}>
      <ScreenHeader
        title="Fund via Bank Transfer"
        subtitle="Transfer directly to your wallet"
        onBack={() => navigation.goBack()}
        rightIcon="bank-outline"
      />

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* Info banner 
        <View style={s.infoBanner}>
          <MaterialCommunityIcons name="information-outline" size={18} color={BLUE} />
          <Text style={s.infoText}>
            Transfer to the account below and your BinaPay wallet will be credited automatically.
            {minAmount ? ` Minimum transfer: ${formatToNaira(minAmount)}.` : ""}
          </Text>
        </View>
*/}
        {/* Loading */}
        {isLoading && (
          <View style={s.loadingWrap}>
            <ActivityIndicator size="large" color={BLUE} />
            <Text style={s.loadingText}>Loading your accounts...</Text>
          </View>
        )}

        {/* Not verified */}
        {!isVerified && (
          <View style={s.verifyCard}>
            <View style={s.verifyIconWrap}>
              <MaterialCommunityIcons name="shield-alert-outline" size={28} color="#F5A623" />
            </View>
            <Text style={s.verifyTitle}>Verification Required</Text>
            <Text style={s.verifySub}>
              This feature is only available for verified users with dedicated accounts.
            </Text>
            <TouchableOpacity style={s.verifyBtn} onPress={handleBeginVerification}>
              <Text style={s.verifyBtnText}>Begin Verification</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Account cards */}
        {userAccounts.length > 0 && (
          <View style={s.accountsSection}>
            <Text style={s.sectionLabel}>Your Funding Accounts</Text>
            {userAccounts.map((account) => (
              <View key={account.id} style={s.accountCardWrap}>
                <ImageBackground
                  source={require("@assets/images/card-background-waves.png")}
                  style={s.accountCard}
                  imageStyle={{ borderRadius: 16 }}
                >
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
          </View>
        )}

        {/* No accounts yet */}
        {userAccounts.length === 0 && isVerified && !isLoading && (
          <View style={s.emptyCard}>
            <View style={s.emptyIconWrap}>
              <MaterialCommunityIcons name="bank-plus" size={32} color={BLUE} />
            </View>
            <Text style={s.emptyTitle}>No Funding Account Yet</Text>
            <Text style={s.emptySub}>
              Create a dedicated account to start funding your wallet via bank transfer.
            </Text>
            <TouchableOpacity style={s.createBtn} onPress={() => createDedicatedAccount(undefined)}>
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={s.createBtnText}>Create Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Create more accounts */}
        {canCreateMoreAccounts && userAccounts.length > 0 && (
          <TouchableOpacity style={s.addMoreBtn} onPress={() => createDedicatedAccount(undefined)}>
            <MaterialCommunityIcons name="plus-circle-outline" size={18} color={BLUE} />
            <Text style={s.addMoreText}>Add Another Funding Account</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={BLUE} />
          </TouchableOpacity>
        )}

        {/* How it works */}
        <Text style={s.sectionLabel}>How It Works</Text>
        <View style={s.stepsCard}>
          {[
            { icon: "content-copy", text: "Copy your dedicated account number above" },
            { icon: "bank-transfer-out", text: "Transfer any amount from your bank app" },
            { icon: "wallet-plus-outline", text: "Your BinaPay wallet is credited instantly" },
          ].map((step, i) => (
            <View key={i} style={[s.stepRow, i < 2 && s.stepRowBorder]}>
              <View style={s.stepNum}>
                <Text style={s.stepNumText}>{i + 1}</Text>
              </View>
              <View style={s.stepIconWrap}>
                <MaterialCommunityIcons name={step.icon as any} size={18} color={BLUE} />
              </View>
              <Text style={s.stepText}>{step.text}</Text>
            </View>
          ))}
        </View>

      </ScrollableView>

      <PleaseWaitModal visible={isCreatingAccount} />
    </View>
  );
}

interface BankCardProps {
  accountName: string;
  bankName: string;
  accountNumber: string;
  feeType: "percentage" | "flat";
  chargePercentage?: number;
  flatFee?: number;
}

export const BankCard: React.FC<BankCardProps> = ({
  accountName,
  bankName,
  accountNumber,
  feeType,
  chargePercentage,
  flatFee,
}) => {
  const formattedFee = formatToNaira(flatFee);

  return (
    <View style={s.cardInner}>
      {/* Bank name badge */}
      <View style={s.bankBadge}>
        <MaterialCommunityIcons name="bank-outline" size={14} color="rgba(255,255,255,0.8)" />
        <Text style={s.bankBadgeText}>{bankName}</Text>
      </View>

      <DetailRow label="Account Name" value={accountName} />
      <DetailRow label="Account Number" value={accountNumber} copyable />

      <View style={s.feeDivider} />
      <View style={s.feeRow}>
        <MaterialCommunityIcons name="information-outline" size={13} color="rgba(255,255,255,0.7)" />
        <Text style={s.feeText}>
          Service Fee:{" "}
          <Text style={s.feeValue}>
            {feeType === "percentage" ? `${chargePercentage}%` : formattedFee}
          </Text>
        </Text>
      </View>
    </View>
  );
};

interface DetailRowProps {
  label: string;
  value: string;
  copyable?: boolean;
}

const DetailRow = ({ label, value, copyable = false }: DetailRowProps) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={s.detailRow}>
      <Text style={s.detailLabel}>{label}</Text>
      {copyable ? (
        <TouchableOpacity style={s.copyRow} onPress={copyToClipboard} activeOpacity={0.7}>
          <Text style={s.detailValue}>{value}</Text>
          <View style={[s.copyBadge, copied && s.copyBadgeDone]}>
            <MaterialCommunityIcons
              name={copied ? "check" : "content-copy"}
              size={12}
              color={copied ? "#16a34a" : "rgba(255,255,255,0.8)"}
            />
            <Text style={[s.copyBadgeText, copied && { color: "#16a34a" }]}>
              {copied ? "Copied!" : "Copy"}
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        <Text style={s.detailValue}>{value}</Text>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#f8f9fb" },
  scroll:         { padding: 16, paddingBottom: 40 },

  infoBanner:     { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "#BFDBFE" },
  infoText:       { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },

  loadingWrap:    { alignItems: "center", paddingVertical: 32, gap: 10 },
  loadingText:    { fontSize: 13, color: "#6b7280" },

  sectionLabel:   { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },

  // Account card
  accountsSection:{ marginBottom: 20 },
  accountCardWrap:{ marginBottom: 12 },
  accountCard:    { backgroundColor: BRAND, borderRadius: 16, padding: 20 },

  cardInner:      {},
  bankBadge:      { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 16 },
  bankBadgeText:  { fontSize: 12, fontWeight: "600", color: "rgba(255,255,255,0.8)" },

  detailRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  detailLabel:    { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  detailValue:    { fontSize: 14, fontWeight: "700", color: "#fff" },
  copyRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
  copyBadge:      { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 },
  copyBadgeDone:  { backgroundColor: "#dcfce7" },
  copyBadgeText:  { fontSize: 11, fontWeight: "600", color: "rgba(255,255,255,0.9)" },

  feeDivider:     { height: 1, backgroundColor: "rgba(255,255,255,0.2)", marginBottom: 12 },
  feeRow:         { flexDirection: "row", alignItems: "center", gap: 6 },
  feeText:        { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  feeValue:       { fontWeight: "700", color: "#fff" },

  // No account / verify states
  verifyCard:     { backgroundColor: "#fff", borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#FEF3C7" },
  verifyIconWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FFF8E7", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  verifyTitle:    { fontSize: 15, fontWeight: "700", color: BRAND, marginBottom: 6 },
  verifySub:      { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19, marginBottom: 16 },
  verifyBtn:      { backgroundColor: BLUE, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  verifyBtnText:  { fontSize: 14, fontWeight: "700", color: "#fff" },

  emptyCard:      { backgroundColor: "#fff", borderRadius: 16, padding: 24, alignItems: "center", marginBottom: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  emptyIconWrap:  { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  emptyTitle:     { fontSize: 15, fontWeight: "700", color: BRAND, marginBottom: 6 },
  emptySub:       { fontSize: 13, color: "#6b7280", textAlign: "center", lineHeight: 19, marginBottom: 16 },
  createBtn:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BLUE, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24 },
  createBtnText:  { fontSize: 14, fontWeight: "700", color: "#fff" },

  addMoreBtn:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14, marginBottom: 20 },
  addMoreText:    { flex: 1, fontSize: 14, fontWeight: "600", color: BLUE },

  // How it works
  stepsCard:      { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
  stepRow:        { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  stepRowBorder:  { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  stepNum:        { width: 22, height: 22, borderRadius: 11, backgroundColor: BLUE, justifyContent: "center", alignItems: "center" },
  stepNumText:    { fontSize: 11, fontWeight: "800", color: "#fff" },
  stepIconWrap:   { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  stepText:       { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
});
