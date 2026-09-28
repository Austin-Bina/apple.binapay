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
import { resetNavigationToDashboard } from "@utils/navigation"; 
import QrScannerModal from "@components/QrScannerModal";
import { resolveIconUrl } from "@utils/resolveIconUrl";


const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

type Network = {
  id: number;
  name: string;
  fee: number;
  min_withdrawal: number;
  network_slug: string;
  icon_url: string | null;
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
  const [usdInput, setUsdInput]                   = useState("");
  const [amountMode, setAmountMode]                = useState<"crypto" | "usd">("crypto");
  const [showAssetPicker, setShowAssetPicker]     = useState(false);
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [networks, setNetworks]                   = useState<Network[]>([]);
  const [showQrScanner, setShowQrScanner] = useState(false);


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
  const priceUsd = contextAsset?.price_usd ?? selectedAsset?.price_usd ?? 0;


  

 // ── Load networks when asset changes ──────────────────────────────────────
  useEffect(() => {
    if (selectedAsset) {
      setNetworks(selectedAsset.networks ?? []);
      setSelectedNetworkId(null);
    } else {
      setNetworks([]);
    }
    setAmount("");
    setUsdInput("");
    setAmountMode("crypto");
    setShowNetworkPicker(false);
  }, [selectedSymbol]);

  const trimZeros = (n: string) =>
    n.includes(".") ? n.replace(/0+$/, "").replace(/\.$/, "") : n;

  // User is typing a crypto quantity — keep the USD figure in sync.
  const handleCryptoAmountChange = (v: string) => {
    const clean = v.replace(/[^0-9.]/g, "");
    setAmount(clean);
    if (priceUsd > 0) {
      const parsed = parseFloat(clean) || 0;
      setUsdInput(parsed > 0 ? (parsed * priceUsd).toFixed(2) : "");
    }
  };

  // User is typing a USD amount — keep the crypto quantity (the value
  // actually used for validation and the withdrawal payload) in sync.
  const handleUsdAmountChange = (v: string) => {
    const clean = v.replace(/[^0-9.]/g, "");
    setUsdInput(clean);
    if (priceUsd > 0) {
      const parsed = parseFloat(clean) || 0;
      setAmount(parsed > 0 ? trimZeros((parsed / priceUsd).toFixed(8)) : "");
    }
  };

  // Extracts a wallet address whether the QR contains a raw address
// or a URI scheme like "ethereum:0xABC...?amount=1" or "bitcoin:bc1q...".
const extractAddressFromQr = (data: string): string => {
  const uriMatch = data.match(/^[a-zA-Z0-9]+:([^?]+)/);
  return uriMatch ? uriMatch[1] : data;
};

const handleQrScanned = (data: string) => {
  const address = extractAddressFromQr(data);
  setWalletAddress(address);
  showToast({ variant: "success", message: "Address filled from QR code." });
};

  const toggleAmountMode = () => {
    if (priceUsd <= 0) {
      showToast({ variant: "warning", message: "USD price unavailable for this asset right now." });
      return;
    }
    setAmountMode((m) => (m === "crypto" ? "usd" : "crypto"));
  };

  const handleMax = () => {
    setAmount(String(balance));
    if (priceUsd > 0) setUsdInput((balance * priceUsd).toFixed(2));
  };

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
       return `Minimum withdrawal is ${trimZeros(String(selectedNetwork.min_withdrawal))} ${selectedSymbol}`;
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

  
    const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      resetNavigationToDashboard();
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
      <View style={[s.root, { paddingTop: insets.top }]}>
        <View style={s.header}>
          <TouchableOpacity style={s.backBtn} onPress={() => setShowOtpStep(false)}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerTitle}>Confirm Withdrawal</Text>
            <Text style={s.headerSub}>Authorize with OTP or biometric</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 100 }}>
          {/* Summary card */}
          <View style={s.summaryCard}>
           <SummaryRow label="Asset"       value={selectedSymbol.toUpperCase()} />
            <SummaryRow label="Network"     value={selectedNetwork?.name ?? ""} />
            <SummaryRow
              label="Amount"
              value={`${formattedBalance(parsedAmount, selectedSymbol)}${priceUsd > 0 ? `  (≈ $${(parsedAmount * priceUsd).toFixed(2)})` : ""}`}
            />
            <SummaryRow
              label="Network Fee"
              value={`${formattedBalance(fee, selectedSymbol)}${priceUsd > 0 ? `  (≈ $${(fee * priceUsd).toFixed(2)})` : ""}`}
            />
            <View style={s.summaryDivider} />
            <SummaryRow
              label="You Receive"
              value={`${formattedBalance(amountToReceive, selectedSymbol)}${priceUsd > 0 ? `  (≈ $${(amountToReceive * priceUsd).toFixed(2)})` : ""}`}
              bold
            />
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
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={handleBack}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View>
          <Text style={s.headerTitle}>Withdraw Crypto</Text>
          <Text style={s.headerSub}>Select asset to withdraw</Text>
        </View>
      </View>

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
  {selectedNetwork && resolveIconUrl(selectedNetwork.icon_url) ? (
    <Image
      source={{ uri: resolveIconUrl(selectedNetwork.icon_url) }}
      style={{ width: 22, height: 22, borderRadius: 11 }}
    />
  ) : (
    <MaterialCommunityIcons
      name="swap-horizontal"
      size={18}
      color={selectedNetworkId !== null ? BLUE : "#2d5eb4"}
    />
  )}
</View>
                <View style={{ flex: 1 }}>
  {selectedNetwork ? (
    <>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Text style={[s.networkName, { color: BRAND }]}>{selectedNetwork.name}</Text>
        <Text style={s.networkSlug}>{selectedNetwork.network_slug}</Text>
      </View>
      <Text style={s.networkFee}>
        Fee: {formattedBalance(selectedNetwork.fee, selectedSymbol.toUpperCase())}
        {priceUsd > 0 ? `  ≈ $${(selectedNetwork.fee * priceUsd).toFixed(2)}` : ""}
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
                 {resolveIconUrl(network.icon_url) ? (
    <Image source={{ uri: resolveIconUrl(network.icon_url) }} style={{ width: 20, height: 20, borderRadius: 10 }}/>
  ) : (
    <MaterialCommunityIcons name="swap-horizontal" size={16} color="#9ca3af" />
  )}
</View>
                     <View style={{ flex: 1 }}>
  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
    <Text style={s.assetDropdownName}>{network.name}</Text>
    <Text style={s.networkSlug}>{network.network_slug}</Text>
  </View>
  <Text style={s.assetDropdownSub}>
  Fee: {formattedBalance(network.fee, selectedSymbol.toUpperCase())}
  {priceUsd > 0 ? ` (≈ $${(network.fee * priceUsd).toFixed(2)})` : ""}
  {" · "}Min: {trimZeros(String(network.min_withdrawal))}
  {priceUsd > 0 ? ` (≈ $${(network.min_withdrawal * priceUsd).toFixed(2)})` : ""}
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
           <TouchableOpacity style={s.qrBtn} onPress={() => setShowQrScanner(true)}>
           <MaterialCommunityIcons name="qrcode-scan" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>

         {/* Amount — Trust Wallet style: currency label inside the input
              row is itself the toggle; Max only appears in token mode. */}
          <Text style={s.sectionLabel}>Amount</Text>
          <View style={s.inputCard}>
            {amountMode === "crypto" ? (
              <TextInput
                style={s.amountInput}
                placeholder={`${selectedSymbol.toUpperCase()} Amount`}
                placeholderTextColor="#9ca3af"
                value={amount}
                onChangeText={handleCryptoAmountChange}
                keyboardType="numeric"
              />
            ) : (
              <TextInput
                style={s.amountInput}
                placeholder="USD Amount"
                placeholderTextColor="#9ca3af"
                value={usdInput}
                onChangeText={handleUsdAmountChange}
                keyboardType="numeric"
              />
            )}

            <TouchableOpacity
              style={s.amountCurrencyBtn}
              onPress={toggleAmountMode}
              disabled={priceUsd <= 0}
            >
              <Text style={[s.amountSymbol, priceUsd <= 0 && { color: "#d1d5db" }]}>
                {amountMode === "crypto" ? selectedSymbol.toUpperCase() : "USD"}
              </Text>
            </TouchableOpacity>

            {amountMode === "crypto" && (
              <TouchableOpacity style={s.amountMaxBtn} onPress={handleMax}>
                <Text style={s.maxBtn}>Max</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.equivalentText}>
            {priceUsd > 0
              ? amountMode === "crypto"
                ? `≈ $${(parsedAmount * priceUsd).toFixed(2)}`
                : `≈ ${amount || "0"} ${selectedSymbol.toUpperCase()}`
              : "USD price unavailable"}
          </Text>

          <View style={s.balanceRow}>
            <Text style={s.balanceText}>
              Available: {formattedBalance(balance, selectedSymbol.toUpperCase() || "")}
              {priceUsd > 0 ? `  (≈ $${(balance * priceUsd).toFixed(2)})` : ""}
            </Text>
          </View>

          {/* You will receive */}
          {/* You will receive */}
          <View style={s.receiveRow}>
            <Text style={s.receiveLabel}>You will receive</Text>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={s.receiveValue}>
                {formattedBalance(amountToReceive > 0 ? amountToReceive : 0, selectedSymbol.toUpperCase() || "")}
              </Text>
              {priceUsd > 0 && (
                <Text style={s.receiveUsd}>
                  ≈ ${(amountToReceive > 0 ? amountToReceive * priceUsd : 0).toFixed(2)}
                </Text>
              )}
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 10 }]}>
  <TouchableOpacity
    style={s.confirmBtn}
    onPress={handleContinue}
  >
    <Text style={s.confirmBtnText}>Continue</Text>
  </TouchableOpacity>
</View>

      <QrScannerModal
  visible={showQrScanner}
  onClose={() => setShowQrScanner(false)}
  onScanned={handleQrScanned}
/>
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
  networkSlug:       { fontSize: 10, fontWeight: "600", color: "#6b7280", backgroundColor: "#f3f4f6", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },

  // Inputs — matches deposit inputCard
  inputCard:         { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 6 },
  addressInput:      { flex: 1, fontSize: 13, color: "#111827", paddingVertical: 12 },
  qrBtn:             { padding: 4 },
  amountInput:       { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827", paddingVertical: 12 },
  amountSymbol:      { fontSize: 13, fontWeight: "600", color: "#6b7280" },

 
   amountCurrencyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#f3f4f6", borderRadius: 8 },
  amountMaxBtn:      { marginLeft: 10, paddingVertical: 4 },
  equivalentText:    { fontSize: 11, color: "#9ca3af", marginBottom: 8, marginTop: -2 },

  balanceRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  balanceText:       { fontSize: 11, color: "#6b7280" },
  maxBtn:            { fontSize: 12, fontWeight: "700", color: BLUE },

  receiveRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f0f0f0", marginTop: 6 },
  receiveLabel:      { fontSize: 13, color: "#6b7280" },
  receiveValue:      { fontSize: 14, fontWeight: "700", color: "#111827" },
  receiveUsd:        { fontSize: 11, color: "#9ca3af", marginTop: 2 },


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
