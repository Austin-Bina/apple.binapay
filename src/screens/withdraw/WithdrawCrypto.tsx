import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Platform, KeyboardAvoidingView, StatusBar,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { selectUser } from "@store/selectors/auth";
import { formattedBalance } from "@utils/transactionutils";
import { showToast } from "@helpers/toast";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import { CryptoProvider, useCrypto } from "@screens/home/CryptoContext";
import * as Crypto from "expo-crypto";
import {
  useSendCryptoWithdrawalOtpMutation,
  useSubmitCryptoWithdrawalMutation,
} from "@store/redux-api/fundsApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";

// ─── Brand tokens (matches WithdrawNairaScreen) ───────────────────────────────
const BRAND       = "#1E3A8A";
const BLUE        = "#2563EB";
const BLUE_LIGHT  = "#EEF3FF";
const BLUE_MID    = "#DBEAFE";
const SURFACE     = "#FFFFFF";
const BG          = "#F2F2F7";   // iOS systemGroupedBackground
const LABEL       = "#111827";
const SUBLABEL    = "#6B7280";
const PLACEHOLDER = "#9CA3AF";
const SEPARATOR   = "#E5E7EB";
const SUCCESS     = "#16A34A";

type Network = {
  id: number;
  name: string;
  fee: number;
  min_withdrawal: number;
  network_slug: string;
};

// ─── iOS shadow helpers ───────────────────────────────────────────────────────
const IOS_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  android: { elevation: 2 },
});

const IOS_SHEET_SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
  },
  android: { elevation: 16 },
});

// =============================================================================
function WithdrawCryptoContent() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch   = useTypedDispatch();
  const user       = useSelector(selectUser);
  const { assets } = useCrypto();

  const wallets      = user?.wallet_balances ?? {};
  const cryptoAssets = user?.crypto_assets   ?? [];

  const idempotencyKey = useRef(Crypto.randomUUID());

  // ── All original state — untouched ────────────────────────────────────────
  const [selectedSymbol, setSelectedSymbol]       = useState("USDT");
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [walletAddress, setWalletAddress]         = useState("");
  const [amount, setAmount]                       = useState("");
  const [showAssetPicker, setShowAssetPicker]     = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [networks, setNetworks]                   = useState<Network[]>([]);
  const [showOtpStep, setShowOtpStep]             = useState(false);
  const [otp, setOtp]                             = useState("");
  const [otpSent, setOtpSent]                     = useState(false);
  const [otpCooldown, setOtpCooldown]             = useState(0);
  const [showSuccess, setShowSuccess]             = useState(false);
  const [successMessage, setSuccessMessage]       = useState("");

  // ── All original RTK — untouched ─────────────────────────────────────────
  const [sendOtp, { isLoading: sendingOtp }]          = useSendCryptoWithdrawalOtpMutation();
  const [submitWithdrawal, { isLoading: submitting }] = useSubmitCryptoWithdrawalMutation();

  // ── All original derived values — untouched ───────────────────────────────
  const selectedAsset   = cryptoAssets.find((a) => a.symbol === selectedSymbol);
  const contextAsset    = assets.find((a) => a.symbol === selectedSymbol);
  const balance         = parseFloat(wallets[selectedSymbol?.toLowerCase()]?.balance ?? "0");
  const selectedNetwork = networks.find((n) => n.id === selectedNetworkId);
  const fee             = selectedNetwork?.fee ?? 0;
  const parsedAmount    = parseFloat(amount) || 0;
  const amountToReceive = parsedAmount > fee ? parsedAmount - fee : 0;

  // ── All original effects — untouched ──────────────────────────────────────
  useEffect(() => {
    if (selectedAsset) {
      setNetworks(selectedAsset.networks ?? []);
      setSelectedNetworkId(null);
    } else {
      setNetworks([]);
    }
    setAmount("");
    setShowNetworkPicker(false);
  }, [selectedSymbol]);

  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // ── All original handlers — untouched ────────────────────────────────────
  const formError = (): string | null => {
    if (!selectedSymbol)                    return "Select a crypto asset";
    if (!selectedNetworkId)                 return "Select a withdrawal network";
    if (!walletAddress.trim())              return "Enter a wallet address";
    if (!parsedAmount || parsedAmount <= 0) return "Enter a valid amount";
    if (selectedNetwork && parsedAmount < selectedNetwork.min_withdrawal)
      return `Minimum withdrawal is ${selectedNetwork.min_withdrawal} ${selectedSymbol}`;
    if (parsedAmount > balance)             return "Insufficient balance";
    return null;
  };

  const handleContinue = () => {
    const err = formError();
    if (err) { showToast({ variant: "warning", message: err }); return; }
    setShowOtpStep(true);
  };

  const handleSendOtp = async () => {
    try {
      await sendOtp({
        asset_id:   selectedAsset!.id.toString(),
        network_id: selectedNetworkId!.toString(),
        amount,
      }).unwrap();
      setOtpSent(true);
      setOtpCooldown(30);
      showToast({ variant: "success", message: "OTP sent to your email." });
    } catch {
      showToast({ variant: "error", message: "Failed to send OTP. Try again." });
    }
  };

  const handleSubmit = async (authMethod: "otp" | "biometric") => {
    const payload: any = {
      crypto_type:       selectedSymbol,
      crypto_asset_id:   selectedAsset!.id.toString(),
      crypto_network_id: selectedNetworkId!.toString(),
      wallet_address:    walletAddress,
      network_slug:      selectedNetwork!.network_slug,
      amount,
      idempotency_key:   idempotencyKey.current,
    };
    if (authMethod === "otp") {
      if (!otp) { showToast({ variant: "warning", message: "Enter your OTP." }); return; }
      payload.otp = otp;
    } else {
      try {
        await authenticateWithBiometrics();
        payload.biometric       = true;
        payload.biometric_token = Crypto.randomUUID();
      } catch {
        showToast({ variant: "error", message: "Biometric authentication failed." });
        return;
      }
    }
    try {
      const result = await submitWithdrawal(payload).unwrap();
      if (result.success) {
        setSuccessMessage(
          `You will receive ${formattedBalance(amountToReceive, selectedSymbol)} to the destination address shortly.`
        );
        setShowSuccess(true);
        await dispatch(authSliceActions.fetchUserProfile());
      }
    } catch (e: any) {
      const status = e?.status;
      if (status === 403) {
        showToast({ variant: "warning", message: "Your account is blocked. Contact support." });
      } else if (status === 422) {
        showToast({ variant: "error", message: "Invalid OTP." });
        setOtp("");
      } else {
        showToast({ variant: "error", message: e?.data?.message ?? "Withdrawal failed. Try again." });
      }
    }
  };

  // ── Shared nav bar ────────────────────────────────────────────────────────
  const NavBar = ({
    title, sub, onBack,
  }: { title: string; sub: string; onBack: () => void }) => (
    <View style={s.navBar}>
      <TouchableOpacity
        style={s.backBtn}
        onPress={onBack}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <MaterialCommunityIcons name="chevron-left" size={24} color={BRAND} />
      </TouchableOpacity>
      <View style={s.navCenter}>
        <Text style={s.navTitle}>{title}</Text>
        <Text style={s.navSub}>{sub}</Text>
      </View>
      <View style={{ width: 36 }} />
    </View>
  );

  // =========================================================================
  // SUCCESS SCREEN
  // =========================================================================
  if (showSuccess) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <View style={s.successWrap}>
          {/* Double-ring checkmark */}
          <View style={s.successRing}>
            <View style={s.successIcon}>
              <MaterialCommunityIcons name="check" size={34} color="#fff" />
            </View>
          </View>
          <Text style={s.successTitle}>Withdrawal Submitted</Text>
          <Text style={s.successSub}>{successMessage}</Text>

          {/* Mini receipt */}
          <View style={s.receiptCard}>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Asset</Text>
              <Text style={s.receiptValue}>{selectedSymbol.toUpperCase()}</Text>
            </View>
            <View style={s.receiptDivider} />
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Network</Text>
              <Text style={s.receiptValue}>{selectedNetwork?.name}</Text>
            </View>
            <View style={s.receiptDivider} />
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Address</Text>
              <Text style={s.receiptValue} numberOfLines={1}>
                {walletAddress.slice(0, 10)}…{walletAddress.slice(-6)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={s.doneBtn}
            onPress={() => navigation.navigate("Dashboard")}
            activeOpacity={0.85}
          >
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // OTP / CONFIRM SCREEN
  // =========================================================================
  if (showOtpStep) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <NavBar
          title="Confirm Withdrawal"
          sub="Authorize with OTP or biometric"
          onBack={() => setShowOtpStep(false)}
        />

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 140 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary card */}
          <Text style={s.sectionHeader}>Summary</Text>
          <View style={s.iosCard}>
            <SummaryRow label="Asset"       value={selectedSymbol.toUpperCase()} />
            <View style={s.cardSeparator} />
            <SummaryRow label="Network"     value={selectedNetwork?.name ?? ""} />
            <View style={s.cardSeparator} />
            <SummaryRow label="Amount"      value={formattedBalance(parsedAmount, selectedSymbol)} />
            <View style={s.cardSeparator} />
            <SummaryRow label="Network Fee" value={formattedBalance(fee, selectedSymbol)} />
            <View style={s.cardSeparatorFull} />
            <SummaryRow label="You Receive" value={formattedBalance(amountToReceive, selectedSymbol)} bold />
            <View style={s.cardSeparator} />
            <SummaryRow
              label="To Address"
              value={`${walletAddress.slice(0, 8)}…${walletAddress.slice(-6)}`}
            />
          </View>

          {/* OTP */}
          <Text style={s.sectionHeader}>One-Time Password</Text>
          <Text style={s.otpHint}>We'll send a 6-digit code to your registered email.</Text>

          <View style={s.otpRow}>
            <TextInput
              style={s.otpInput}
              placeholder="· · · · · ·"
              placeholderTextColor={PLACEHOLDER}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <TouchableOpacity
              style={[s.sendOtpBtn, (sendingOtp || otpCooldown > 0) && s.disabledOpacity]}
              onPress={handleSendOtp}
              disabled={sendingOtp || otpCooldown > 0}
              activeOpacity={0.75}
            >
              <Text style={s.sendOtpText}>
                {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Biometric */}
          <TouchableOpacity
            style={s.biometricRow}
            onPress={() => handleSubmit("biometric")}
            activeOpacity={0.7}
          >
            <View style={s.biometricIconWrap}>
              <MaterialCommunityIcons name="fingerprint" size={28} color={BLUE} />
            </View>
            <Text style={s.biometricLabel}>Use Face ID / Touch ID</Text>
          </TouchableOpacity>

          {/* Security note */}
          <View style={s.secureNote}>
            <MaterialCommunityIcons name="lock-outline" size={14} color={BLUE} />
            <Text style={s.secureText}>Protected by bank-grade 256-bit encryption</Text>
          </View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <TouchableOpacity
            style={[s.primaryBtn, (!otp || submitting) && s.disabledOpacity]}
            onPress={() => handleSubmit("otp")}
            disabled={!otp || submitting}
            activeOpacity={0.85}
          >
            <Text style={s.primaryBtnText}>
              {submitting ? "Processing…" : "Confirm Withdrawal"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // =========================================================================
  // MAIN FORM
  // =========================================================================
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />
      <NavBar
        title="Withdraw Crypto"
        sub="Select asset and network"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Asset selector ── */}
          <Text style={s.sectionHeader}>Asset</Text>
          <TouchableOpacity
            style={[s.iosCard, s.assetSelectorCard]}
            onPress={() => setShowAssetPicker((v) => !v)}
            activeOpacity={0.8}
          >
            {/* Icon */}
            {(selectedAsset?.icon_url ?? contextAsset?.icon_url) ? (
              <Image
                source={{ uri: selectedAsset?.icon_url ?? contextAsset?.icon_url }}
                style={s.assetIcon}
              />
            ) : (
              <View style={[s.assetIcon, s.assetIconFallback]}>
                <Text style={s.assetIconText}>
                  {selectedSymbol ? selectedSymbol.slice(0, 2).toUpperCase() : "?"}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={s.assetSelectorName}>
                {selectedAsset
                  ? `${selectedAsset.name} (${selectedSymbol.toUpperCase()})`
                  : "Select asset to withdraw"}
              </Text>
              {selectedSymbol ? (
                <Text style={s.assetSelectorBalance}>
                  Balance: {formattedBalance(balance, selectedSymbol.toUpperCase())}
                </Text>
              ) : null}
            </View>
            <MaterialCommunityIcons
              name={showAssetPicker ? "chevron-up" : "chevron-down"}
              size={18}
              color={PLACEHOLDER}
            />
          </TouchableOpacity>

          {/* Asset picker dropdown */}
          {showAssetPicker && (
            <View style={s.dropdownCard}>
              {cryptoAssets
                .filter((a) => a.withdrawal_enabled)
                .map((asset, i, arr) => (
                  <TouchableOpacity
                    key={asset.id}
                    style={[s.dropdownItem, i < arr.length - 1 && s.dropdownItemBorder]}
                    onPress={() => { setSelectedSymbol(asset.symbol); setShowAssetPicker(false); }}
                    activeOpacity={0.7}
                  >
                    {(asset.icon_url ?? assets.find((x) => x.symbol === asset.symbol)?.icon_url) ? (
                      <Image
                        source={{ uri: asset.icon_url ?? assets.find((x) => x.symbol === asset.symbol)?.icon_url }}
                        style={s.dropdownIcon}
                      />
                    ) : (
                      <View style={[s.dropdownIcon, s.assetIconFallback]}>
                        <Text style={s.assetIconText}>{asset.symbol.slice(0, 2)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.dropdownName}>{asset.name}</Text>
                      <Text style={s.dropdownSub}>
                        {formattedBalance(
                          parseFloat(wallets[asset.symbol.toLowerCase()]?.balance ?? "0"),
                          asset.symbol.toUpperCase()
                        )}
                      </Text>
                    </View>
                    {selectedSymbol === asset.symbol && (
                      <MaterialCommunityIcons name="checkmark-circle" size={18} color={BLUE} />
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* ── Network selector ── */}
          {networks.length > 0 && (
            <>
              <Text style={s.sectionHeader}>Network</Text>
              <TouchableOpacity
                style={[s.iosCard, s.networkSelectorCard, selectedNetworkId !== null && s.networkSelectorActive]}
                onPress={() => setShowNetworkPicker((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[s.networkIconWrap, { backgroundColor: selectedNetworkId !== null ? BLUE_LIGHT : BG }]}>
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={18}
                    color={selectedNetworkId !== null ? BLUE : PLACEHOLDER}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  {selectedNetwork ? (
                    <>
                      <Text style={[s.networkName, { color: BRAND }]}>{selectedNetwork.name}</Text>
                      <Text style={s.networkFee}>
                        Fee: {formattedBalance(selectedNetwork.fee, selectedSymbol.toUpperCase())}
                      </Text>
                    </>
                  ) : (
                    <Text style={s.networkNamePlaceholder}>Select network</Text>
                  )}
                </View>
                <MaterialCommunityIcons
                  name={showNetworkPicker ? "chevron-up" : "chevron-down"}
                  size={18}
                  color={PLACEHOLDER}
                />
              </TouchableOpacity>

              {showNetworkPicker && (
                <View style={s.dropdownCard}>
                  {networks.map((network, i, arr) => (
                    <TouchableOpacity
                      key={network.id}
                      style={[s.dropdownItem, i < arr.length - 1 && s.dropdownItemBorder]}
                      onPress={() => { setSelectedNetworkId(network.id); setShowNetworkPicker(false); }}
                      activeOpacity={0.7}
                    >
                      <View style={[s.networkIconWrap, { backgroundColor: BG }]}>
                        <MaterialCommunityIcons name="swap-horizontal" size={16} color={SUBLABEL} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.dropdownName}>{network.name}</Text>
                        <Text style={s.dropdownSub}>
                          Fee: {formattedBalance(network.fee, selectedSymbol.toUpperCase())} · Min: {network.min_withdrawal}
                        </Text>
                      </View>
                      {selectedNetworkId === network.id && (
                        <MaterialCommunityIcons name="checkmark-circle" size={18} color={BLUE} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* ── Wallet address ── */}
          <Text style={s.sectionHeader}>Wallet Address</Text>
          <View style={s.iosCard}>
            <View style={s.addressRow}>
              <TextInput
                style={s.addressInput}
                placeholder="Enter destination address"
                placeholderTextColor={PLACEHOLDER}
                value={walletAddress}
                onChangeText={setWalletAddress}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={s.qrBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="qrcode-scan" size={20} color={SUBLABEL} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Amount ── */}
          <View style={s.amountHeaderRow}>
            <Text style={s.sectionHeader}>Amount</Text>
            {/* Balance pill */}
            <View style={s.balancePill}>
              <MaterialCommunityIcons name="wallet-outline" size={12} color={BLUE} />
              <Text style={s.balancePillText}>
                {formattedBalance(balance, selectedSymbol.toUpperCase())}
              </Text>
            </View>
          </View>

          <View style={s.iosCard}>
            <View style={s.amountRow}>
              <TextInput
                style={s.amountInput}
                placeholder="0.00"
                placeholderTextColor={PLACEHOLDER}
                value={amount}
                onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
                keyboardType="numeric"
              />
              <Text style={s.amountSymbol}>{selectedSymbol.toUpperCase() || "—"}</Text>
              <TouchableOpacity
                style={s.maxChip}
                onPress={() => setAmount(String(balance))}
                activeOpacity={0.75}
              >
                <Text style={s.maxChipText}>Max</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── You will receive ── */}
          <View style={[s.receiveCard, parsedAmount > 0 && s.receiveCardActive]}>
            <Text style={s.receiveLabel}>You will receive</Text>
            <Text style={[s.receiveValue, parsedAmount > 0 && { color: BRAND }]}>
              {formattedBalance(amountToReceive > 0 ? amountToReceive : 0, selectedSymbol.toUpperCase() || "")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.primaryBtn, !!formError() && s.disabledOpacity]}
          onPress={handleContinue}
          disabled={!!formError()}
          activeOpacity={0.85}
        >
          <Text style={s.primaryBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// =============================================================================
export default function WithdrawCryptoScreen() {
  return (
    <CryptoProvider>
      <WithdrawCryptoContent />
    </CryptoProvider>
  );
}

// ─── Sub-component — untouched logic ─────────────────────────────────────────
function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={[s.summaryValue, bold && { fontWeight: "700", color: BRAND }]}>{value}</Text>
    </View>
  );
}

// =============================================================================
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Nav bar ──────────────────────────────────────────────────────────────
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: SURFACE,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SEPARATOR,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: BLUE_LIGHT,
    justifyContent: "center", alignItems: "center",
  },
  navCenter: { flex: 1, alignItems: "center" },
  navTitle:  { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:    { fontSize: 11, color: SUBLABEL, marginTop: 1 },

  // ── Section header ────────────────────────────────────────────────────────
  sectionHeader: {
    fontSize: 12, fontWeight: "600", color: SUBLABEL,
    textTransform: "uppercase", letterSpacing: 0.6,
    marginBottom: 8, marginTop: 14, marginLeft: 4,
  },

  // ── iOS grouped card ─────────────────────────────────────────────────────
  iosCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    marginBottom: 6,
    overflow: "hidden",
    ...IOS_SHADOW,
  },
  cardSeparator:     { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 16 },
  cardSeparatorFull: { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },

  // ── Asset selector card ──────────────────────────────────────────────────
  assetSelectorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  assetIcon:         { width: 40, height: 40, borderRadius: 20 },
  assetIconFallback: { backgroundColor: SEPARATOR, justifyContent: "center", alignItems: "center" },
  assetIconText:     { fontSize: 12, fontWeight: "700", color: SUBLABEL },
  assetSelectorName: { fontSize: 15, fontWeight: "600", color: LABEL },
  assetSelectorBalance: { fontSize: 12, color: SUBLABEL, marginTop: 2 },

  // ── Dropdown card ────────────────────────────────────────────────────────
  dropdownCard: {
    backgroundColor: SURFACE,
    borderRadius: 14,
    marginBottom: 6,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SEPARATOR,
    ...IOS_SHADOW,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 58,
  },
  dropdownItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  dropdownIcon:  { width: 38, height: 38, borderRadius: 19 },
  dropdownName:  { fontSize: 14, fontWeight: "600", color: LABEL },
  dropdownSub:   { fontSize: 12, color: SUBLABEL, marginTop: 2 },

  // ── Network selector card ────────────────────────────────────────────────
  networkSelectorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  networkSelectorActive: { borderColor: BLUE, backgroundColor: "#F0F7FF" },
  networkIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: "center", alignItems: "center",
  },
  networkName:            { fontSize: 14, fontWeight: "600", color: LABEL },
  networkNamePlaceholder: { fontSize: 14, fontWeight: "400", color: PLACEHOLDER },
  networkFee:             { fontSize: 12, color: SUBLABEL, marginTop: 2 },

  // ── Wallet address ────────────────────────────────────────────────────────
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  addressInput: { flex: 1, fontSize: 14, color: LABEL },
  qrBtn:        { padding: 4, marginLeft: 8 },

  // ── Amount ───────────────────────────────────────────────────────────────
  amountHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: BLUE_LIGHT,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  balancePillText: { fontSize: 12, color: BLUE, fontWeight: "600" },
  amountRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  amountInput:  { flex: 1, fontSize: 28, fontWeight: "700", color: LABEL, letterSpacing: -0.5 },
  amountSymbol: { fontSize: 14, fontWeight: "600", color: SUBLABEL },
  maxChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: BLUE_LIGHT,
  },
  maxChipText: { fontSize: 12, fontWeight: "700", color: BLUE },

  // ── Receive row ───────────────────────────────────────────────────────────
  receiveCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: SURFACE,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SEPARATOR,
    ...IOS_SHADOW,
  },
  receiveCardActive: { backgroundColor: BLUE_LIGHT, borderColor: BLUE_MID },
  receiveLabel: { fontSize: 14, color: SUBLABEL },
  receiveValue: { fontSize: 16, fontWeight: "700", color: PLACEHOLDER },

  // ── Footer ───────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: SURFACE,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: SEPARATOR,
    ...IOS_SHEET_SHADOW,
  },
  primaryBtn:     { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  primaryBtnText: { fontSize: 16, fontWeight: "700", color: "#fff", letterSpacing: -0.2 },
  disabledOpacity:{ opacity: 0.45 },

  // ── Summary card (OTP step) ───────────────────────────────────────────────
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  summaryLabel: { fontSize: 14, color: SUBLABEL },
  summaryValue: { fontSize: 14, fontWeight: "500", color: LABEL },

  // ── OTP step ─────────────────────────────────────────────────────────────
  otpHint:   { fontSize: 13, color: SUBLABEL, marginBottom: 14, marginTop: -6, marginLeft: 4 },
  otpRow:    { flexDirection: "row", gap: 10, marginBottom: 16 },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 22,
    textAlign: "center",
    letterSpacing: 8,
    color: LABEL,
    backgroundColor: BG,
  },
  sendOtpBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: "center",
  },
  sendOtpText: { color: "#fff", fontWeight: "600", fontSize: 13 },

  biometricRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
  },
  biometricIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: BLUE_LIGHT,
    justifyContent: "center", alignItems: "center",
  },
  biometricLabel: { fontSize: 14, color: BLUE, fontWeight: "600" },

  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
  },
  secureText: { fontSize: 12, color: SUBLABEL },

  // ── Success ───────────────────────────────────────────────────────────────
  successWrap:  { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  successRing:  { width: 88, height: 88, borderRadius: 44, backgroundColor: "#DCFCE7", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  successIcon:  { width: 64, height: 64, borderRadius: 32, backgroundColor: SUCCESS, justifyContent: "center", alignItems: "center" },
  successTitle: { fontSize: 22, fontWeight: "800", color: BRAND, letterSpacing: -0.4, marginBottom: 8 },
  successSub:   { fontSize: 14, color: SUBLABEL, textAlign: "center", marginBottom: 28, lineHeight: 20 },
  receiptCard: {
    width: "100%",
    backgroundColor: SURFACE,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SEPARATOR,
    marginBottom: 28,
    ...IOS_SHADOW,
  },
  receiptRow:    { paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", justifyContent: "space-between" },
  receiptDivider:{ height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  receiptLabel:  { fontSize: 13, color: SUBLABEL },
  receiptValue:  { fontSize: 13, fontWeight: "600", color: LABEL },
  doneBtn:       { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  doneBtnText:   { fontSize: 16, fontWeight: "700", color: "#fff" },
});
