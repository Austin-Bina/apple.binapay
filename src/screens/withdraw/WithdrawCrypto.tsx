import React, { useEffect, useState, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Platform, KeyboardAvoidingView,
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
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import * as Crypto from "expo-crypto";
import {
  useSendCryptoWithdrawalOtpMutation,
  useSubmitCryptoWithdrawalMutation,
} from "@store/redux-api/fundsApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Network = {
  id: number;
  name: string;
  fee: number;
  min_withdrawal: number;
  network_slug: string;
};

function WithdrawCryptoContent() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch   = useTypedDispatch();
  const user       = useSelector(selectUser);
  const { assets } = useCrypto();

  const wallets      = user?.wallet_balances ?? {};
  const cryptoAssets = user?.crypto_assets   ?? [];

  const idempotencyKey = useRef(Crypto.randomUUID());

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedSymbol, setSelectedSymbol]       = useState("USDT");
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [walletAddress, setWalletAddress]         = useState("");
  const [amount, setAmount]                       = useState("");
  const [showAssetPicker, setShowAssetPicker]     = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [networks, setNetworks]                   = useState<Network[]>([]);

  // OTP step
  const [showOtpStep, setShowOtpStep]         = useState(false);
  const [otp, setOtp]                         = useState("");
  const [otpSent, setOtpSent]                 = useState(false);
  const [otpCooldown, setOtpCooldown]         = useState(0);
  const [showSuccess, setShowSuccess]         = useState(false);
  const [successMessage, setSuccessMessage]   = useState("");

  // ── RTK ────────────────────────────────────────────────────────────────────
  const [sendOtp, { isLoading: sendingOtp }]          = useSendCryptoWithdrawalOtpMutation();
  const [submitWithdrawal, { isLoading: submitting }] = useSubmitCryptoWithdrawalMutation();

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedAsset   = cryptoAssets.find((a) => a.symbol === selectedSymbol);
  const contextAsset    = assets.find((a) => a.symbol === selectedSymbol);
  const balance         = parseFloat(wallets[selectedSymbol?.toLowerCase()]?.balance ?? "0");
  const selectedNetwork = networks.find((n) => n.id === selectedNetworkId);
  const fee             = selectedNetwork?.fee ?? 0;
  const parsedAmount    = parseFloat(amount) || 0;
  const amountToReceive = parsedAmount > fee ? parsedAmount - fee : 0;

  // ── Load networks when asset changes ──────────────────────────────────────
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

  // ── OTP cooldown ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (otpCooldown <= 0) return;
    const timer = setInterval(() => setOtpCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [otpCooldown]);

  // ── Validation ────────────────────────────────────────────────────────────
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

  // ── OTP ───────────────────────────────────────────────────────────────────
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

  // ── Submit ────────────────────────────────────────────────────────────────
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

  // ── Success screen ────────────────────────────────────────────────────────
  if (showSuccess) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.successWrap}>
          <View style={s.successIcon}>
            <MaterialCommunityIcons name="check" size={44} color="#fff" />
          </View>
          <Text style={s.successTitle}>Withdrawal Submitted</Text>
          <Text style={s.successSub}>{successMessage}</Text>
          <TouchableOpacity style={s.doneBtn} onPress={() => navigation.navigate("Dashboard")}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── OTP step ──────────────────────────────────────────────────────────────
  if (showOtpStep) {
    return (
      <View style={[s.root]}>
        <ScreenHeader
       title="Confirm Withdrawal"
       subtitle="Authorize with OTP or biometric"
       onBack={() => setShowOtpStep(false)}
       rightIcon="shield-check-outline"
        />

        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 100 }}>
          {/* Summary card */}
          <View style={s.summaryCard}>
            <SummaryRow label="Asset"       value={selectedSymbol.toUpperCase()} />
            <SummaryRow label="Network"     value={selectedNetwork?.name ?? ""} />
            <SummaryRow label="Amount"      value={formattedBalance(parsedAmount, selectedSymbol)} />
            <SummaryRow label="Network Fee" value={formattedBalance(fee, selectedSymbol)} />
            <View style={s.summaryDivider} />
            <SummaryRow label="You Receive" value={formattedBalance(amountToReceive, selectedSymbol)} bold />
            <SummaryRow
              label="To Address"
              value={`${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`}
            />
          </View>

          {/* OTP input */}
          <Text style={s.sectionLabel}>Enter OTP</Text>
          <Text style={s.otpSub}>We'll send an OTP to your registered email.</Text>
          <View style={s.otpRow}>
            <TextInput
              style={s.otpInput}
              placeholder="Enter OTP"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
            <TouchableOpacity
              style={[s.sendOtpBtn, (sendingOtp || otpCooldown > 0) && s.disabledBtn]}
              onPress={handleSendOtp}
              disabled={sendingOtp || otpCooldown > 0}
            >
              <Text style={s.sendOtpText}>
                {otpCooldown > 0 ? `${otpCooldown}s` : otpSent ? "Resend" : "Send OTP"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={s.biometricRow} onPress={() => handleSubmit("biometric")}>
            <MaterialCommunityIcons name="fingerprint" size={40} color={BLUE} />
            <Text style={s.biometricLabel}>Use Biometric Instead</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity
            style={[s.confirmBtn, (!otp || submitting) && s.disabledBtn]}
            onPress={() => handleSubmit("otp")}
            disabled={!otp || submitting}
          >
            <Text style={s.confirmBtnText}>
              {submitting ? "Processing..." : "Confirm Withdrawal"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <View style={[s.root]}>
     <ScreenHeader
      title="Withdraw Crypto"
      subtitle="Select asset to withdraw"
      onBack={() => navigation.goBack()}
      rightIcon="shield-check-outline"
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Asset selector */}
          <TouchableOpacity
            style={s.assetSelector}
            onPress={() => setShowAssetPicker((v) => !v)}
            activeOpacity={0.8}
          >
            {(selectedAsset?.icon_url ?? contextAsset?.icon_url) ? (
              <Image source={{ uri: selectedAsset?.icon_url ?? contextAsset?.icon_url }} style={s.assetIcon} />
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
            <MaterialCommunityIcons name={showAssetPicker ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Asset picker dropdown */}
          {showAssetPicker && (
            <View style={s.assetDropdown}>
              {cryptoAssets
                .filter((a) => a.withdrawal_enabled)
                .map((asset) => (
                  <TouchableOpacity
                    key={asset.id}
                    style={s.assetDropdownItem}
                    onPress={() => { setSelectedSymbol(asset.symbol); setShowAssetPicker(false); }}
                  >
                    {(asset.icon_url ?? assets.find((x) => x.symbol === asset.symbol)?.icon_url) ? (
                      <Image
                        source={{ uri: asset.icon_url ?? assets.find((x) => x.symbol === asset.symbol)?.icon_url }}
                        style={s.assetDropdownIcon}
                      />
                    ) : (
                      <View style={[s.assetDropdownIcon, s.assetIconFallback]}>
                        <Text style={s.assetIconText}>{asset.symbol.slice(0, 2)}</Text>
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={s.assetDropdownName}>{asset.name}</Text>
                      <Text style={s.assetDropdownSub}>
                        {formattedBalance(
                          parseFloat(wallets[asset.symbol.toLowerCase()]?.balance ?? "0"),
                          asset.symbol.toUpperCase()
                        )}
                      </Text>
                    </View>
                    {selectedSymbol === asset.symbol && (
                      <MaterialCommunityIcons name="check-circle" size={16} color={BLUE} />
                    )}
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* Network selector */}
          {networks.length > 0 && (
            <>
              <Text style={s.sectionLabel}>Withdrawal Network</Text>

              <TouchableOpacity
                style={[s.networkCard, selectedNetworkId !== null && s.networkCardActive]}
                onPress={() => setShowNetworkPicker((v) => !v)}
                activeOpacity={0.8}
              >
                <View style={[s.networkIconWrap, { backgroundColor: selectedNetworkId !== null ? "#EEF3FF" : "#f3f4f6" }]}>
                  <MaterialCommunityIcons
                    name="swap-horizontal"
                    size={18}
                    color={selectedNetworkId !== null ? BLUE : "#9ca3af"}
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
                    <Text style={s.networkName}>Select network</Text>
                  )}
                </View>
                <MaterialCommunityIcons
                  name={showNetworkPicker ? "chevron-up" : "chevron-down"}
                  size={18}
                  color="#9ca3af"
                />
              </TouchableOpacity>

              {showNetworkPicker && (
                <View style={s.assetDropdown}>
                  {networks.map((network) => (
                    <TouchableOpacity
                      key={network.id}
                      style={s.assetDropdownItem}
                      onPress={() => { setSelectedNetworkId(network.id); setShowNetworkPicker(false); }}
                    >
                      <View style={[s.networkIconWrap, { backgroundColor: "#f3f4f6" }]}>
                        <MaterialCommunityIcons name="swap-horizontal" size={16} color="#9ca3af" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.assetDropdownName}>{network.name}</Text>
                        <Text style={s.assetDropdownSub}>
                          Fee: {formattedBalance(network.fee, selectedSymbol.toUpperCase())} · Min: {network.min_withdrawal}
                        </Text>
                      </View>
                      {selectedNetworkId === network.id && (
                        <MaterialCommunityIcons name="check-circle" size={16} color={BLUE} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}

          {/* Wallet Address */}
          <Text style={s.sectionLabel}>Wallet Address</Text>
          <View style={s.inputCard}>
            <TextInput
              style={s.addressInput}
              placeholder="Enter wallet address"
              placeholderTextColor="#9ca3af"
              value={walletAddress}
              onChangeText={setWalletAddress}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={s.qrBtn}>
              <MaterialCommunityIcons name="qrcode-scan" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <Text style={s.sectionLabel}>Amount</Text>
          <View style={s.inputCard}>
            <TextInput
              style={s.amountInput}
              placeholder="Enter amount"
              placeholderTextColor="#9ca3af"
              value={amount}
              onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
              keyboardType="numeric"
            />
            <Text style={s.amountSymbol}>{selectedSymbol.toUpperCase() || "—"}</Text>
          </View>
          <View style={s.balanceRow}>
            <Text style={s.balanceText}>
              Available: {formattedBalance(balance, selectedSymbol.toUpperCase() || "")}
            </Text>
            <TouchableOpacity onPress={() => setAmount(String(balance))}>
              <Text style={s.maxBtn}>Max</Text>
            </TouchableOpacity>
          </View>

          {/* You will receive */}
          <View style={s.receiveRow}>
            <Text style={s.receiveLabel}>You will receive</Text>
            <Text style={s.receiveValue}>
              {formattedBalance(amountToReceive > 0 ? amountToReceive : 0, selectedSymbol.toUpperCase() || "")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity
          style={[s.confirmBtn, !!formError() && s.disabledBtn]}
          onPress={handleContinue}
          disabled={!!formError()}
        >
          <Text style={s.confirmBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function WithdrawCryptoScreen() {
  return (
    <CryptoProvider>
      <WithdrawCryptoContent />
    </CryptoProvider>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={[s.summaryValue, bold && { fontWeight: "700", color: BRAND }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#f8f9fb" },

  // Header — matches deposit
  header:            { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:           { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginRight: 10 },
  headerTitle:       { fontSize: 15, fontWeight: "700", color: BRAND },
  headerSub:         { fontSize: 10, color: "#6b7280", marginTop: 1 },

  // Asset selector — matches deposit selectorCard
  assetSelector:     { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 6 },
  assetIcon:         { width: 34, height: 34, borderRadius: 17 },
  assetIconFallback: { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  assetIconText:     { fontSize: 11, fontWeight: "700", color: "#6b7280" },
  assetSelectorName: { fontSize: 14, fontWeight: "600", color: "#111827" },
  assetSelectorBalance: { fontSize: 11, color: "#6b7280", marginTop: 1 },

  assetDropdown:     { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", marginBottom: 6, overflow: "hidden" },
  assetDropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  assetDropdownIcon: { width: 34, height: 34, borderRadius: 17 },
  assetDropdownName: { fontSize: 13, fontWeight: "600", color: "#111827" },
  assetDropdownSub:  { fontSize: 11, color: "#6b7280", marginTop: 1 },

  sectionLabel:      { fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8, marginTop: 10 },

  // Network card — matches deposit
  networkCard:       { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 10, borderWidth: 1.5, borderColor: "#f0f0f0", marginBottom: 6 },
  networkCardActive: { borderColor: BLUE, backgroundColor: "#f0f7ff" },
  networkIconWrap:   { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  networkName:       { fontSize: 13, fontWeight: "600", color: "#111827" },
  networkFee:        { fontSize: 11, color: "#6b7280", marginTop: 1 },

  // Inputs — matches deposit inputCard
  inputCard:         { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 6 },
  addressInput:      { flex: 1, fontSize: 13, color: "#111827", paddingVertical: 12 },
  qrBtn:             { padding: 4 },
  amountInput:       { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827", paddingVertical: 12 },
  amountSymbol:      { fontSize: 13, fontWeight: "600", color: "#6b7280" },

  balanceRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  balanceText:       { fontSize: 11, color: "#6b7280" },
  maxBtn:            { fontSize: 12, fontWeight: "700", color: BLUE },

  receiveRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f0f0f0", marginTop: 6 },
  receiveLabel:      { fontSize: 13, color: "#6b7280" },
  receiveValue:      { fontSize: 14, fontWeight: "700", color: "#111827" },

  footer:            { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  confirmBtn:        { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  confirmBtnText:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:       { opacity: 0.5 },

  // OTP step
  summaryCard:       { backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 14 },
  summaryRow:        { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  summaryDivider:    { height: 1, backgroundColor: "#f3f4f6", marginVertical: 4 },
  summaryLabel:      { fontSize: 12, color: "#6b7280" },
  summaryValue:      { fontSize: 12, fontWeight: "600", color: "#111827" },
  otpSub:            { fontSize: 11, color: "#6b7280", marginBottom: 10, marginTop: -4 },
  otpRow:            { flexDirection: "row", gap: 10, marginBottom: 16 },
  otpInput:          { flex: 1, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, textAlign: "center", letterSpacing: 4, backgroundColor: "#fff" },
  sendOtpBtn:        { backgroundColor: BLUE, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, justifyContent: "center" },
  sendOtpText:       { color: "#fff", fontWeight: "600", fontSize: 12 },
  biometricRow:      { alignItems: "center", gap: 6, paddingVertical: 14 },
  biometricLabel:    { fontSize: 12, color: "#6b7280" },

  // Success
  successWrap:       { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  successIcon:       { width: 72, height: 72, borderRadius: 36, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginBottom: 16 },
  successTitle:      { fontSize: 20, fontWeight: "800", color: BRAND, marginBottom: 6 },
  successSub:        { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 28 },
  doneBtn:           { width: "100%", backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  doneBtnText:       { fontSize: 15, fontWeight: "700", color: "#fff" },
});
