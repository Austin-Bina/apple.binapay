import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Image, Platform, KeyboardAvoidingView, Vibration,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { selectUser, selectNgnUsdtRateWithSpread } from "@store/selectors/auth";
import { formattedBalance } from "@utils/transactionutils";
import { showToast } from "@helpers/toast";
import { authenticateWithBiometrics } from "@helpers/biometricshelper";
import { CryptoProvider, useCrypto } from "@screens/home/CryptoContext";
import * as Crypto from "expo-crypto";
import { useSubmitCryptoWithdrawalMutation } from "@store/redux-api/fundsApi";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { resetNavigationToDashboard, getNavigate } from "@utils/navigation";
import { SCREENS } from "@constants/screens";
import QrScannerModal from "@components/QrScannerModal";
import { resolveIconUrl } from "@utils/resolveIconUrl";
import { applySpread } from "@helpers/rate-display";
import { State } from "@store/main";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";
// Same default the Convert screen uses when the store has none.
const DEFAULT_NO_SPREAD_SYMBOLS = ["USDT", "USDC"];

// The search icon only appears when the asset list is longer than this.
const ASSET_SEARCH_THRESHOLD = 10;

type Network = {
  id: number;
  name: string;
  fee: number;
  min_withdrawal: number;
  network_slug: string;
  icon_url: string | null;
};

const trimZeros = (n: string) =>
  n.includes(".") ? n.replace(/0+$/, "").replace(/\.$/, "") : n;

// Floors (never rounds up) so "Max" can never exceed what the balance covers.
const floorTo = (n: number, decimals: number) => {
  const f = Math.pow(10, decimals);
  return Math.floor(n * f) / f;
};

function WithdrawCryptoContent() {
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch   = useTypedDispatch();
  const user       = useSelector(selectUser);
  const { assets } = useCrypto();

  const wallets      = user?.wallet_balances ?? {};
  const cryptoAssets = user?.crypto_assets   ?? [];

  // ── NGN rate from Redux ────────────────────────────────────────────────────
  const ngnUsdtRate = useSelector(selectNgnUsdtRateWithSpread);
  const noSpreadSymbols = useSelector(
  (st: State) => st.auth.noSpreadSymbols ?? DEFAULT_NO_SPREAD_SYMBOLS
);

  const idempotencyKey = useRef(Crypto.randomUUID());

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedSymbol, setSelectedSymbol]       = useState("USDT");
  const [selectedNetworkId, setSelectedNetworkId] = useState<number | null>(null);
  const [walletAddress, setWalletAddress]         = useState("");
  const [amount, setAmount]                       = useState("");
  const [usdInput, setUsdInput]                   = useState("");
  const [amountMode, setAmountMode]               = useState<"crypto" | "usd">("crypto");
  const [showAssetPicker, setShowAssetPicker]     = useState(false);
  const [showAssetSearch, setShowAssetSearch] = useState(false);
 const [assetSearch, setAssetSearch]         = useState("");
  const [showNetworkPicker, setShowNetworkPicker] = useState(false);
  const [networks, setNetworks]                   = useState<Network[]>([]);
  const [showQrScanner, setShowQrScanner]         = useState(false);

  // Review + PIN step
const [showReview, setShowReview]               = useState(false);
const [showConfirmSheet, setShowConfirmSheet]   = useState(false);
const [pin, setPin]                             = useState("");
const [pinError, setPinError]                   = useState("");
const [shake, setShake]                         = useState(false);
const [failCount, setFailCount]                 = useState(0);
const [cooldown, setCooldown]                   = useState(0);
const [showSuccess, setShowSuccess]             = useState(false);
const [successMessage, setSuccessMessage]       = useState("");

  // ── RTK ────────────────────────────────────────────────────────────────────
 const [submitWithdrawal, { isLoading: submitting }] = useSubmitCryptoWithdrawalMutation();

  // ── Derived ────────────────────────────────────────────────────────────────
  const selectedAsset   = cryptoAssets.find((a) => a.symbol === selectedSymbol);
  const contextAsset    = assets.find((a) => a.symbol === selectedSymbol);
  const selectedNetwork = networks.find((n) => n.id === selectedNetworkId);
  const fee             = selectedNetwork?.fee ?? 0;
  const parsedAmount    = parseFloat(amount) || 0;
  const amountToReceive = parsedAmount > fee ? parsedAmount - fee : 0;
  const priceUsd        = contextAsset?.price_usd ?? selectedAsset?.price_usd ?? 0;

  // ── NGN-equivalent balance calculation ────────────────────────────────────
  const nairaBalance = parseFloat(wallets["naira"]?.balance ?? "0");

  // NGN cost of 1 coin, same logic as the Convert screen (NGN → crypto):
// USDT/USDC use the plain sell rate; other coins get the spread added.
const ngnPricePerCoin = useCallback((symbol: string, usd: number): number => {
  if (!ngnUsdtRate?.sell) return 0;
  const sym = symbol.toUpperCase();
  if (sym === "USDT") return ngnUsdtRate.sell;
  if (!usd) return 0;
  const base = usd * ngnUsdtRate.sell;
  if (noSpreadSymbols.includes(sym)) return base;
  return applySpread(base, ngnUsdtRate.spreadType ?? "percent", ngnUsdtRate.spread ?? 0, true);
}, [ngnUsdtRate, noSpreadSymbols]);

const cryptoPriceInNgn = useMemo(() => {
  const p = ngnPricePerCoin(selectedSymbol, priceUsd);
  return p > 0 ? p : null;
}, [ngnPricePerCoin, selectedSymbol, priceUsd]);

  const rateUnavailable = !cryptoPriceInNgn || cryptoPriceInNgn <= 0;

  // How much of the selected crypto the user can afford with their NGN
  const ngnEquivalentBalance = useMemo(() => {
    if (!cryptoPriceInNgn || cryptoPriceInNgn <= 0) return 0;
    return nairaBalance / cryptoPriceInNgn;
  }, [nairaBalance, cryptoPriceInNgn]);

  const enabledAssets = useMemo(
  () => cryptoAssets.filter((a) => a.withdrawal_enabled),
  [cryptoAssets]
);
const showSearchIcon = enabledAssets.length > ASSET_SEARCH_THRESHOLD;

const filteredAssets = useMemo(() => {
  const q = assetSearch.trim().toLowerCase();
  if (!q) return enabledAssets;
  return enabledAssets.filter(
    (a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
  );
}, [enabledAssets, assetSearch]);

  // User can't withdraw more than their NGN can cover
  const maxWithdrawable = ngnEquivalentBalance;

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

  // A new key is issued whenever the withdrawal details change, so a changed
  // request is never sent under the key of an earlier one. Retrying the exact
  // same request (e.g. after a network error) keeps the same key.
  useEffect(() => {
    idempotencyKey.current = Crypto.randomUUID();
  }, [selectedSymbol, selectedNetworkId, walletAddress, amount]);

  // ── PIN cooldown ──────────────────────────────────────────────────────────
useEffect(() => {
  if (cooldown <= 0) return;
  const t = setInterval(() => {
    setCooldown((c) => {
      const next = Math.max(0, c - 1);
      if (next === 0) setPinError("");
      return next;
    });
  }, 1000);
  return () => clearInterval(t);
}, [cooldown]);

  // ── Amount handlers ───────────────────────────────────────────────────────
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

  const toggleAmountMode = () => {
    if (priceUsd <= 0) {
      showToast({ variant: "warning", message: "USD price unavailable for this asset right now." });
      return;
    }
    setAmountMode((m) => (m === "crypto" ? "usd" : "crypto"));
  };

  const handleMax = () => {
    const max = floorTo(maxWithdrawable, 8);
    setAmount(max > 0 ? trimZeros(max.toFixed(8)) : "");
    if (priceUsd > 0) setUsdInput(max > 0 ? (max * priceUsd).toFixed(2) : "");
  };

  // ── QR ────────────────────────────────────────────────────────────────────
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

  // ── Validation ────────────────────────────────────────────────────────────
  const formError = (): string | null => {
    if (!selectedSymbol)                    return "Select a crypto asset";
    if (!selectedNetworkId)                 return "Select a withdrawal network";
    if (!walletAddress.trim())              return "Enter a wallet address";
    if (!parsedAmount || parsedAmount <= 0) return "Enter a valid amount";
    if (selectedNetwork && parsedAmount < selectedNetwork.min_withdrawal)
      return `Minimum withdrawal is ${trimZeros(String(selectedNetwork.min_withdrawal))} ${selectedSymbol}`;
    if (rateUnavailable)
      return "Exchange rate unavailable right now. Please try again shortly.";
    // Validate against NGN-equivalent balance, not actual crypto balance
    if (parsedAmount > maxWithdrawable)
      return "Insufficient naira balance";
    return null;
  };

  const handleContinue = () => {
  const err = formError();
  if (err) { showToast({ variant: "warning", message: err }); return; }
  setShowReview(true);
};

  // ── OTP ───────────────────────────────────────────────────────────────────
  // ── PIN helpers ───────────────────────────────────────────────────────────
const triggerPinError = (message: string) => {
  const next = failCount + 1;
  setFailCount(next);
  setPinError(message);
  setShake(true);
  Vibration.vibrate(200);
  if (next >= 3) setCooldown(30);
  setTimeout(() => { setShake(false); setPin(""); }, 500);
};

const handleForgotPin = async () => {
  setShowConfirmSheet(false);
  setPin("");
  setPinError("");
  const { navigate } = await getNavigate();
  navigate(SCREENS.MAIN, {
    screen: "Menu",
    params: { screen: SCREENS.CHANGE_PIN },
  });
};

// ── Submit ────────────────────────────────────────────────────────────────
const handleSubmit = async (authMethod: "pin" | "biometric", enteredPin?: string) => {
  const payload: any = {
    crypto_type:       selectedSymbol,
    crypto_asset_id:   selectedAsset!.id.toString(),
    crypto_network_id: selectedNetworkId!.toString(),
    wallet_address:    walletAddress,
    network_slug:      selectedNetwork!.network_slug,
    amount,
    idempotency_key:   idempotencyKey.current,
    source:            "ngn_conversion",
  };

  if (authMethod === "pin") {
    payload.pin = enteredPin;
  } else {
    try {
      await authenticateWithBiometrics();
      payload.biometric       = true;
      // NOTE: generated on-device, so the server can't treat it as proof of
      // biometric auth. Validate on the backend.
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
    const status  = e?.status;
    const data    = e?.data;
    const message = data?.error ?? data?.message ?? data?.errors?.pin?.[0] ?? "Withdrawal failed. Try again.";

    if (authMethod === "pin" && status === 422) {
      triggerPinError(message);
      return;
    }

    setPin(""); // clear the 4 digits so the user can retry
    if (status === 403) {
      showToast({ variant: "warning", message: "Your account is blocked. Contact support." });
    } else if (status === 429) {
      showToast({ variant: "warning", message: "Too many attempts. Please wait and try again." });
    } else {
      showToast({ variant: "error", message });
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

  const closeAssetPicker = () => {
  setShowAssetPicker(false);
  setShowAssetSearch(false);
  setAssetSearch("");
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

  // ── Review step ───────────────────────────────────────────────────────────
if (showReview) {
  return (
    <View style={s.root}>
      <ScreenHeader
        title="Review Withdrawal"
        subtitle="Please confirm the details"
        onBack={() => setShowReview(false)}
        rightIcon="shield-check-outline"
      />

      <ScrollView contentContainerStyle={{ padding: 14, paddingBottom: 120 }}>
        <Text style={s.sectionLabel}>Withdrawal Details</Text>
        <View style={s.summaryCard}>
  <View style={[s.summaryRow, s.summaryRowBorder]}>
    <Text style={s.summaryLabel}>Asset</Text>
    <View style={s.summaryValueRow}>
      {(selectedAsset?.icon_url ?? contextAsset?.icon_url) && (
        <Image source={{ uri: selectedAsset?.icon_url ?? contextAsset?.icon_url }} style={s.summaryIcon} />
      )}
      <Text style={s.summaryValue}>{selectedSymbol.toUpperCase()}</Text>
    </View>
  </View>

  <View style={[s.summaryRow, s.summaryRowBorder]}>
    <Text style={s.summaryLabel}>Network</Text>
    <View style={s.summaryValueRow}>
      {resolveIconUrl(selectedNetwork?.icon_url) && (
        <Image source={{ uri: resolveIconUrl(selectedNetwork?.icon_url) }} style={s.summaryIcon} />
      )}
      <Text style={s.summaryValue}>{selectedNetwork?.name ?? ""}</Text>
    </View>
  </View>

  <View style={[s.summaryRow, s.summaryRowBorder]}>
    <Text style={s.summaryLabel}>Amount</Text>
    <Text style={s.summaryValue}>
      {formattedBalance(parsedAmount, selectedSymbol)}{priceUsd > 0 ? `  (≈ $${(parsedAmount * priceUsd).toFixed(2)})` : ""}
    </Text>
  </View>

  <View style={[s.summaryRow, s.summaryRowBorder]}>
    <Text style={s.summaryLabel}>Network Fee</Text>
    <Text style={s.summaryValue}>
      {formattedBalance(fee, selectedSymbol)}{priceUsd > 0 ? `  (≈ $${(fee * priceUsd).toFixed(2)})` : ""}
    </Text>
  </View>

  <View style={[s.summaryRow, s.summaryHighlightRow, s.summaryRowBorder]}>
    <Text style={s.summaryLabel}>You Receive</Text>
    <Text style={s.summaryValueHighlight}>
      {formattedBalance(amountToReceive, selectedSymbol)}{priceUsd > 0 ? `  (≈ $${(amountToReceive * priceUsd).toFixed(2)})` : ""}
    </Text>
  </View>

  <View style={[s.summaryRow, s.summaryRowBorder]}>
    <Text style={s.summaryLabel}>To Address</Text>
    <Text style={s.summaryValue}>{walletAddress}</Text>
  </View>

  {cryptoPriceInNgn && (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>NGN Deducted</Text>
      <Text style={s.summaryValue}>₦{formattedBalance(parsedAmount * cryptoPriceInNgn, "", 2)}</Text>
    </View>
  )}
</View>

       
      </ScrollView>

      {showConfirmSheet ? (
        <View style={[s.confirmSheetFull, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
          <View style={s.confirmLockWrap}>
            <MaterialCommunityIcons name="shield-lock-outline" size={40} color={BLUE} />
          </View>
          <Text style={s.confirmTitle}>Enter PIN</Text>
          <Text style={s.confirmSubtitle}>
            Enter your 4-digit transaction PIN{"\n"}to complete this withdrawal
          </Text>

          <View style={[s.dotsRow, shake && s.dotsShake]}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={[s.dot, i < pin.length && s.dotFilled, !!pinError && s.dotError]} />
            ))}
          </View>

          {!!pinError && <Text style={s.errorText}>{pinError}</Text>}
          {cooldown > 0 && (
            <Text style={s.cooldownText}>
              Too many failed attempts. Please wait {cooldown}s before retrying.
            </Text>
          )}

          <TouchableOpacity style={s.forgotBtn} activeOpacity={0.7} onPress={handleForgotPin}>
            <Text style={s.forgotText}>Forgot PIN?</Text>
          </TouchableOpacity>

          <View style={s.numpad}>
            {[["1","2","3"],["4","5","6"],["7","8","9"],["bio","0","del"]].map((row, ri) => (
              <View key={ri} style={s.numpadRow}>
                {row.map((key, ki) => {
                  if (key === "bio") return (
                    <TouchableOpacity key={ki} style={s.numpadKey} onPress={() => handleSubmit("biometric")} disabled={submitting}>
                      <MaterialCommunityIcons name="fingerprint" size={30} color={BLUE} />
                    </TouchableOpacity>
                  );
                  if (key === "del") return (
                    <TouchableOpacity
                      key={ki}
                      style={s.numpadKey}
                      onPress={() => { if (pinError) setPinError(""); setPin((p) => p.slice(0, -1)); }}
                      disabled={submitting || cooldown > 0}
                    >
                      <MaterialCommunityIcons name="backspace-outline" size={22} color="#111827" />
                    </TouchableOpacity>
                  );
                  return (
                    <TouchableOpacity
                      key={ki}
                      style={s.numpadKey}
                      disabled={submitting || cooldown > 0}
                      onPress={() => {
                        if (pin.length >= 4 || cooldown > 0) return;
                        setPinError("");
                        const next = pin + key;
                        setPin(next);
                        if (next.length === 4) handleSubmit("pin", next);
                      }}
                    >
                      <Text style={s.numpadDigit}>{key}</Text>
                      <Text style={s.numpadHint}>
                        {["", "ABC", "DEF", "GHI", "JKL", "MNO", "PQRS", "TUV", "WXYZ"][parseInt(key)] ?? ""}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={s.cancelLink}
            onPress={() => { setShowConfirmSheet(false); setPin(""); setPinError(""); }}
          >
            <Text style={s.cancelLinkText}>Cancel Transaction</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[s.footer, { paddingBottom: insets.bottom + 10 }]}>
          <TouchableOpacity style={s.confirmBtn} onPress={() => setShowConfirmSheet(true)}>
            <Text style={s.confirmBtnText}>Confirm & Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}




  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      <ScreenHeader
        title="Send Crypto"
        subtitle="Converted from your naira balance"
        onBack={handleBack}
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
              onPress={() => (showAssetPicker ? closeAssetPicker() : setShowAssetPicker(true))}
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
            </View>
            <MaterialCommunityIcons name={showAssetPicker ? "chevron-up" : "chevron-down"} size={18} color="#9ca3af" />
          </TouchableOpacity>

          {/* Asset picker dropdown */}
          {showAssetPicker && (
          <View style={s.assetDropdown}>
  {/* Search toggle row */}
  {showSearchIcon && (
  <View style={s.assetSearchRow}>
    {showAssetSearch ? (
      <TextInput
        style={s.assetSearchInput}
        placeholder="Search by name or symbol"
        placeholderTextColor="#9ca3af"
        value={assetSearch}
        onChangeText={setAssetSearch}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus
      />
    ) : (
      <Text style={s.assetSearchHint}>Select asset</Text>
    )}
    <TouchableOpacity
      onPress={() => {
        if (showAssetSearch) setAssetSearch("");
        setShowAssetSearch((v) => !v);
      }}
      style={s.assetSearchBtn}
    >
      <MaterialCommunityIcons
        name={showAssetSearch ? "close" : "magnify"}
        size={18}
        color="#6b7280"
      />
    </TouchableOpacity>
  </View>
  )}

  <ScrollView style={{ maxHeight: 420 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
    {filteredAssets.length === 0 && (
      <Text style={s.assetEmpty}>No assets found</Text>
    )}
    {filteredAssets.map((asset) => {
                  const assetPriceUsd = assets.find((x) => x.symbol === asset.symbol)?.price_usd ?? asset.price_usd ?? 0;
                  const assetPriceNgn = ngnPricePerCoin(asset.symbol, assetPriceUsd);
                  const assetNgnEquivalent = assetPriceNgn > 0 ? nairaBalance / assetPriceNgn : 0;

                  return (
                    <TouchableOpacity
                      key={asset.id}
                      style={s.assetDropdownItem}
                        onPress={() => { setSelectedSymbol(asset.symbol); closeAssetPicker(); }}
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
                          {assetPriceNgn > 0
                            ? formattedBalance(assetNgnEquivalent, asset.symbol.toUpperCase(), 6)
                            : "Rate unavailable"}
                        </Text>
                      </View>
                      {selectedSymbol === asset.symbol && (
                        <MaterialCommunityIcons name="check-circle" size={16} color={BLUE} />
                      )}
                    </TouchableOpacity>
                                            );
    })}
  </ScrollView>
</View>
)}

          {/* Network selector */}

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
                  {priceUsd > 0 ? ` (≈ $${(selectedNetwork.fee * priceUsd).toFixed(2)})` : ""}
                    {" · "}Min: {trimZeros(String(selectedNetwork.min_withdrawal))}
                   {priceUsd > 0 ? ` (≈ $${(selectedNetwork.min_withdrawal * priceUsd).toFixed(2)})` : ""}
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
                          <Image
                            source={{ uri: resolveIconUrl(network.icon_url) }}
                            style={{ width: 20, height: 20, borderRadius: 10 }}
                          />
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

          {/* Amount — currency label inside the input row is itself the toggle;
              Max only appears in token mode. */}
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

          {/* Summary card: balance ⇄ max coin, debit, receive */}
          <View style={s.convCard}>
            <View style={s.convRow}>
           <Text style={s.convLabel}>Balance</Text>
           <Text style={s.convValue}>₦{formattedBalance(nairaBalance, "", 2)}</Text>
           </View>
                  {parsedAmount > 0 && (
                     <>
            <View style={s.convRow}>
              <Text style={s.convLabel}>You'll be debited</Text>
              <Text style={s.convValue}>
                {rateUnavailable
               ? "Rate unavailable"
               : `₦${formattedBalance(parsedAmount * (cryptoPriceInNgn ?? 0), "", 2)}`}
              </Text>
            </View>

            <View style={s.convDivider} />

            <View style={s.convRow}>
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
    </>
  )}
</View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Continue always tappable — validation errors surface as a toast */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={s.confirmBtn} onPress={handleContinue}>
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

function SummaryRow({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={[s.summaryValue, bold && { fontWeight: "700", color: BRAND }]}>{value}</Text>
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

const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: "#f8f9fb" },

  // Asset selector
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

  // Network card
  networkCard:       { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#fff", borderRadius: 12, padding: 10, borderWidth: 1.5, borderColor: "#f0f0f0", marginBottom: 6 },
  networkCardActive: { borderColor: BLUE, backgroundColor: "#f0f7ff" },
  networkIconWrap:   { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
  networkName:       { fontSize: 13, fontWeight: "600", color: "#111827" },
  networkFee:        { fontSize: 11, color: "#6b7280", marginTop: 1 },
  networkSlug:       { fontSize: 10, fontWeight: "600", color: "#6b7280", backgroundColor: "#f3f4f6", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },

  // Inputs
  inputCard:         { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, marginBottom: 6 },
  addressInput:      { flex: 1, fontSize: 13, color: "#111827", paddingVertical: 12 },
  qrBtn:             { padding: 4 },
  amountInput:       { flex: 1, fontSize: 15, fontWeight: "600", color: "#111827", paddingVertical: 12 },
  amountSymbol:      { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  amountCurrencyBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: "#f3f4f6", borderRadius: 8 },
  amountMaxBtn:      { marginLeft: 10, paddingVertical: 4 },
  equivalentText:    { fontSize: 11, color: "#9ca3af", marginBottom: 8, marginTop: -2 },

  maxBtn:            { fontSize: 12, fontWeight: "700", color: BLUE },

  // Summary card
  convCard:          { backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#f0f0f0", marginTop: 6 },
  convRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6 },
  convLabel:         { fontSize: 12, color: "#6b7280" },
  convValue:         { fontSize: 12, fontWeight: "600", color: "#111827" },
  convMuted:         { color: "#9ca3af" },
  convBalanceValue:  { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 1 },
  convDivider:       { height: 1, backgroundColor: "#f3f4f6", marginVertical: 4 },
  receiveLabel:      { fontSize: 13, color: "#6b7280" },
  receiveValue:      { fontSize: 14, fontWeight: "700", color: "#111827" },
  receiveUsd:        { fontSize: 11, color: "#9ca3af", marginTop: 2 },

  footer:            { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: 14, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  confirmBtn:        { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  confirmBtnText:    { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:       { opacity: 0.5 },

  // OTP step
  summaryCard:          { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", overflow: "hidden" },
summaryRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", paddingVertical: 14, paddingHorizontal: 14 },
summaryRowBorder:     { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
summaryHighlightRow:  { backgroundColor: "#EEF3FF" },
summaryValueRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
summaryIcon:          { width: 20, height: 20, borderRadius: 10 },
summaryLabel:         { fontSize: 13, color: "#6b7280" },
summaryValue:         { fontSize: 13, fontWeight: "500", color: "#111827", textAlign: "right", flexShrink: 1, marginLeft: 12 },
summaryValueHighlight:{ fontSize: 15, fontWeight: "700", color: BLUE, textAlign: "right", flexShrink: 1, marginLeft: 12 },
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

  // Asset search
  assetSearchRow:   { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
assetSearchHint:  { flex: 1, fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
assetSearchInput: { flex: 1, fontSize: 13, color: "#111827", paddingVertical: 6 },
assetSearchBtn:   { padding: 6 },
assetEmpty:       { fontSize: 12, color: "#9ca3af", textAlign: "center", padding: 16 },

// Review + PIN
secureNote:        { flexDirection: "row", gap: 10, alignItems: "flex-start", backgroundColor: "#EEF3FF", borderRadius: 10, padding: 12, marginBottom: 16 },
secureTitle:       { fontSize: 12, fontWeight: "700", color: BRAND },
secureSub:         { fontSize: 11, color: "#6b7280", marginTop: 2 },

confirmSheetFull:  { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
confirmLockWrap:   { width: 64, height: 64, borderRadius: 32, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginBottom: 12 },
confirmTitle:      { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
confirmSubtitle:   { fontSize: 12, color: "#6b7280", textAlign: "center", marginBottom: 16 },
dotsRow:           { flexDirection: "row", gap: 14, marginBottom: 12 },
dotsShake:         { transform: [{ translateX: 6 }] },
dot:               { width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: "#e5e7eb" },
dotFilled:         { backgroundColor: BLUE, borderColor: BLUE },
dotError:          { borderColor: "#DC2626", backgroundColor: "#DC2626" },
errorText:         { fontSize: 12, color: "#DC2626", fontWeight: "500", marginBottom: 6 },
cooldownText:      { fontSize: 11, color: "#6b7280", textAlign: "center", marginBottom: 6 },
forgotBtn:         { marginTop: 12, marginBottom: 28 },
forgotText:        { fontSize: 14, color: BLUE, fontWeight: "600" },
numpad:            { width: "100%", marginTop: 4, borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 16 },
numpadRow:         { flexDirection: "row", justifyContent: "space-around", marginBottom: 4 },
numpadKey:         { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center" },
numpadDigit:       { fontSize: 22, color: "#111827" },
numpadHint:        { fontSize: 9, color: "#6B7280", letterSpacing: 1, marginTop: 1 },
cancelLink:        { alignItems: "center", marginTop: 14, paddingVertical: 8 },
cancelLinkText:    { fontSize: 14, fontWeight: "600", color: BLUE },
});

