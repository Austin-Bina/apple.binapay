import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image,
} from "react-native";
import { Provider } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { calculateConversion, ConversionResult } from "@helpers/crypto-conversion";
import { getPairRateDisplay } from "@helpers/rate-display";
import { useNavigation } from "@react-navigation/native";
import API from "@lib/api";
import { routes } from "@constants/routes";
import { useDispatch } from "react-redux";
import { formattedBalance } from "@utils/transactionutils";
import * as Crypto from "expo-crypto";
import { useRef as useReactRef } from "react";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { showToast } from "@helpers/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ConvertCryptoConfirmSheet from "@components/ui/modals/transaction-confirmation/ConvertCryptoConfirmSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import ConvertCryptoAuthSheet from "@components/ui/modals/ConvertCryptoAuthSheet";
import { useGoToDashboard } from "@helpers/useGoToDashboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";

type CryptoAsset = {
  id: number;
  name: string;
  symbol: string;
  price_usd?: number;
  conversion_enabled: boolean;
  min_conversion: number;
  icon_url?: string;
};

type Props = {
  cryptoAssets: CryptoAsset[];
  adminNgnUsdtRate: { buy: number; sell: number } | null;
  spreadConfig?: { spreadType: "percent" | "flat"; spread: number };
};

// ── Asset selector row ─────────────────────────────────────────────────────

function AssetRow({
  label,
  symbol,
  balance,
  availableAssets,
  onChangeSymbol,
  amount,
  onChangeAmount,
  showAmountInput,
  estimatedAmount,
  quickAmounts,
}: {
  label: string;
  symbol: string;
  balance: number;
  availableAssets: { symbol: string; name: string; icon_url?: string }[];
  onChangeSymbol: (s: string) => void;
  amount?: string;
  onChangeAmount?: (v: string) => void;
  showAmountInput: boolean;
  estimatedAmount?: string;
  quickAmounts?: number[];
}) {
  const [open, setOpen] = useState(false);
  const selectedAsset = availableAssets.find(
    (a) => a.symbol.toLowerCase() === symbol.toLowerCase()
  );
  const isNgn = symbol.toLowerCase() === "ngn";

  return (
    <View style={s.assetBox}>
      <View style={s.assetBoxTop}>
        <Text style={s.assetBoxLabel}>{label}</Text>
        <Text style={s.assetBoxBalance}>
          Available Balance:{" "}
          <Text style={s.assetBoxBalanceValue}>
            {isNgn
              ? `₦${formattedBalance(balance, "", 2)}`
              : formattedBalance(balance, symbol.toUpperCase(), 8)}
          </Text>
        </Text>
      </View>

      <View style={s.assetRowInner}>
        {/* Asset selector */}
        <TouchableOpacity style={s.assetSelector} onPress={() => setOpen(o => !o)}>
          {isNgn ? (
            <Text style={s.flagEmoji}>🇳🇬</Text>
          ) : selectedAsset?.icon_url ? (
            <Image source={{ uri: selectedAsset.icon_url }} style={s.assetSelectorIcon} />
          ) : (
            <View style={[s.assetSelectorIcon, { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" }]}>
              <Text style={{ fontSize: 10, fontWeight: "700", color: "#6b7280" }}>
                {symbol.toUpperCase().slice(0, 2)}
              </Text>
            </View>
          )}
          <Text style={s.assetSelectorSymbol}>{symbol.toUpperCase()}</Text>
          <MaterialCommunityIcons name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>

        {/* Amount */}
        {showAmountInput ? (
          <TextInput
            style={s.amountInput}
            value={amount}
            onChangeText={onChangeAmount}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor="#d1d5db"
          />
        ) : (
          <Text style={s.estimatedAmount}>
            {estimatedAmount ?? "0.00"}
          </Text>
        )}
      </View>

      {/* Currency suffix */}
      <Text style={s.currencySuffix}>{symbol.toUpperCase()}</Text>

      {/* Quick amounts */}
      {showAmountInput && quickAmounts && quickAmounts.length > 0 && (
        <View style={s.quickRow}>
          {quickAmounts.map((v) => (
            <TouchableOpacity
              key={v}
              style={s.quickChip}
              onPress={() => onChangeAmount?.(String(v))}
            >
              <Text style={s.quickChipText}>
                {isNgn ? `₦${v >= 1000 ? `${v / 1000}k` : v}` : `${v} ${symbol.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={s.quickChip}
            onPress={() => onChangeAmount?.(String(balance))}
          >
            <Text style={s.quickChipText}>Max</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dropdown */}
      {open && (
        <View style={s.dropdown}>
          {availableAssets.map((a) => (
            <TouchableOpacity
              key={a.symbol}
              style={s.dropdownItem}
              onPress={() => { onChangeSymbol(a.symbol.toLowerCase()); setOpen(false); }}
            >
              {a.symbol.toLowerCase() === "ngn" ? (
                <Text style={s.flagEmoji}>🇳🇬</Text>
              ) : a.icon_url ? (
                <Image source={{ uri: a.icon_url }} style={s.dropdownIcon} />
              ) : (
                <View style={[s.dropdownIcon, { backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" }]}>
                  <Text style={{ fontSize: 10, fontWeight: "700", color: "#6b7280" }}>
                    {a.symbol.toUpperCase().slice(0, 2)}
                  </Text>
                </View>
              )}
              <View>
                <Text style={s.dropdownSymbol}>{a.symbol.toUpperCase()}</Text>
                <Text style={s.dropdownName}>{a.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────

export default function ConvertCrypto({ cryptoAssets, adminNgnUsdtRate, spreadConfig }: Props) {
  const navigation  = useNavigation();
  const user        = useSelector(selectUser);
  const goToDashboard = useGoToDashboard();
  const insets      = useSafeAreaInsets();

  // Map wallet balances
  const wallets: Record<string, number> = {};
  if (user?.wallet_balances) {
    Object.entries(user.wallet_balances).forEach(([slug, wallet]: any) => {
      const key = slug.toLowerCase() === "naira" ? "ngn" : slug.toLowerCase();
      wallets[key] = Number(wallet.balance);
    });
  }

  const [mode, setMode]     = useState<"buy" | "sell">("buy");
  const [loading, setLoading] = useState(true);
  const [fromSymbol, setFromSymbol] = useState("ngn");
  const [toSymbol, setToSymbol]     = useState("");
  const [amount, setAmount]         = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [conversionResult, setConversionResult] = useState<ConversionResult>({
    finalAmount: null, spreadApplied: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const confirmSheetRef = useRef<BottomSheetModalMethods>(null);
  const authSheetRef    = useRef<BottomSheetModalMethods>(null);
  const idempotencyKeyRef = useRef<string>(Crypto.randomUUID());
  const RATE_TTL = 600;
  const BASE_URL = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  // ── Mode switch ────────────────────────────────────────────────────────────
  // Buy = NGN → Crypto, Sell = Crypto → NGN
  useEffect(() => {
    if (mode === "buy") {
      setFromSymbol("ngn");
      setToSymbol(cryptoAssets[0]?.symbol.toLowerCase() ?? "");
    } else {
      setFromSymbol(cryptoAssets[0]?.symbol.toLowerCase() ?? "");
      setToSymbol("ngn");
    }
    setAmount("");
  }, [mode]);

  // ── Fetch prices ───────────────────────────────────────────────────────────
  useEffect(() => {
    const fetchPrices = async (showInitial = false) => {
      if (showInitial) setLoading(true);
      try {
        API.defaults.baseURL = BASE_URL;
        const res = await API.get<{ success: boolean; data: CryptoAsset[] }>(
          routes.api.v1.auth.cryptoprices
        );
        if (res.data.success) {
          const map: Record<string, number> = {};
          res.data.data.forEach((a) => {
            if (a.price_usd) map[a.symbol.toUpperCase()] = a.price_usd;
          });
          setLivePrices(map);
        }
      } catch (e) {
        console.log("Price fetch error:", e);
      } finally {
        if (showInitial) setLoading(false);
      }
    };
    fetchPrices(true);
    const interval = setInterval(() => fetchPrices(false), 180000);
    return () => clearInterval(interval);
  }, []);

  // ── Conversion calculation ─────────────────────────────────────────────────
  useEffect(() => {
    if (!amount || !toSymbol || !adminNgnUsdtRate) {
      setConversionResult({ finalAmount: null, spreadApplied: null });
      return;
    }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      setConversionResult({ finalAmount: null, spreadApplied: null });
      return;
    }
    const result = calculateConversion(
      fromSymbol, toSymbol, parsed, livePrices, adminNgnUsdtRate, spreadConfig
    );
    setConversionResult(result);
  }, [fromSymbol, toSymbol, amount, livePrices, adminNgnUsdtRate]);

  // ── Asset lists ────────────────────────────────────────────────────────────
  const ngnAsset = { symbol: "ngn", name: "Nigerian Naira", icon_url: undefined };
  const cryptoList = cryptoAssets.map((a) => ({
    symbol: a.symbol.toLowerCase(),
    name: a.name,
    icon_url: a.icon_url,
  }));

  const fromAssets = mode === "buy" ? [ngnAsset] : cryptoList;
  const toAssets   = mode === "buy" ? cryptoList : [ngnAsset];

  // ── Quick amounts ──────────────────────────────────────────────────────────
  const quickAmounts = mode === "buy"
    ? [10000, 50000, 100000]
    : [10, 25, 50];

  // ── Rate display ───────────────────────────────────────────────────────────
  const rateDisplay = fromSymbol && toSymbol && adminNgnUsdtRate
    ? getPairRateDisplay({ fromSymbol, toSymbol, livePrices, liveNgnUsdt: adminNgnUsdtRate, spreadConfig })
    : null;

  const spreadPercent = spreadConfig
    ? spreadConfig.spreadType === "percent"
      ? `(${spreadConfig.spread}%)`
      : null
    : null;

  // ── Validation & submit ────────────────────────────────────────────────────
  const handleReviewOrder = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      showToast({ title: "Amount Required", message: "Please enter a valid amount.", variant: "warning" });
      return;
    }

    if (mode === "buy" && parsed < 1500) {
      showToast({ title: "Below Minimum", message: "Minimum NGN conversion is ₦1,500.", variant: "warning" });
      return;
    }

    if (mode === "sell") {
      const fromAsset = cryptoAssets.find(
        (a) => a.symbol.toLowerCase() === fromSymbol
      );
      const min = Number(fromAsset?.min_conversion ?? 0);
      if (parsed < min) {
        showToast({
          title: "Below Minimum",
          message: `Minimum ${fromSymbol.toUpperCase()} conversion is ${min}.`,
          variant: "warning",
        });
        return;
      }
    }

    const balance = wallets[fromSymbol] ?? 0;
    if (parsed > balance) {
      showToast({
        title: "Insufficient Balance",
        message: `You don't have enough ${fromSymbol.toUpperCase()}.`,
        variant: "warning",
      });
      return;
    }

    confirmSheetRef.current?.present();
  };

  const handleConfirm = () => {
    confirmSheetRef.current?.dismiss();
    setTimeout(() => authSheetRef.current?.present(), 250);
  };

if (showSuccess) {
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.successWrap}>
        <View style={s.successIcon}>
          <MaterialCommunityIcons name="check" size={44} color="#fff" />
        </View>
        <Text style={s.successTitle}>Conversion Successful</Text>
        <Text style={s.successSub}>{successMessage}</Text>

        <View style={s.receiptCard}>
          <View style={s.receiptRow}>
            <Text style={s.receiptLabel}>You Spent</Text>
            <Text style={s.receiptValue}>{formattedBalance(parseFloat(amount) || 0, fromSymbol.toUpperCase())}</Text>
          </View>
          <View style={s.receiptRow}>
            <Text style={s.receiptLabel}>You Received</Text>
            <Text style={s.receiptValue}>{formattedBalance(conversionResult.finalAmount ?? 0, toSymbol.toUpperCase())}</Text>
          </View>
          {rateDisplay && (
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>Rate</Text>
              <Text style={s.receiptValue}>{rateDisplay}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity style={s.doneBtn} onPress={goToDashboard}>
          <Text style={s.doneBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
  return (
    <Provider>
      <View style={[s.root]}>

        {/* ── Header ── */}
        <ScreenHeader
  title="Convert"
  subtitle="Buy or sell crypto instantly"
  onBack={() => navigation.goBack()}
  rightIcon="history"
  onRightPress={() => navigation.navigate("Activity" as never)}/>
  
        {/* ── Buy / Sell tabs ── */}
        <View style={s.tabRow}>
          <TouchableOpacity
            style={[s.tab, mode === "buy" && s.tabActive]}
            onPress={() => setMode("buy")}>
            <Text style={[s.tabText, mode === "buy" && s.tabTextActive]}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.tab, mode === "sell" && s.tabActiveSell]}
            onPress={() => setMode("sell")}
          >
            <Text style={[s.tabText, mode === "sell" && s.tabTextActive]}>Sell</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── From asset ── */}
          <AssetRow
            label="You Spend"
            symbol={fromSymbol}
            balance={wallets[fromSymbol] ?? 0}
            availableAssets={fromAssets}
            onChangeSymbol={setFromSymbol}
            amount={amount}
            onChangeAmount={setAmount}
            showAmountInput
            quickAmounts={quickAmounts}
          />

          {/* ── Swap button ── */}
          <View style={s.swapRow}>
            <View style={s.swapLine} />
            <TouchableOpacity
              style={s.swapBtn}
              onPress={() => {
                setFromSymbol(toSymbol);
                setToSymbol(fromSymbol);
                setMode(mode === "buy" ? "sell" : "buy");
                setAmount("");
              }}
            >
              <MaterialCommunityIcons name="swap-vertical" size={20} color={BLUE} />
            </TouchableOpacity>
            <View style={s.swapLine} />
          </View>

          {/* ── To asset ── */}
          <AssetRow
            label="You Receive"
            symbol={toSymbol || (mode === "buy" ? cryptoAssets[0]?.symbol.toLowerCase() ?? "" : "ngn")}
            balance={wallets[toSymbol] ?? 0}
            availableAssets={toAssets}
            onChangeSymbol={setToSymbol}
            showAmountInput={false}
            estimatedAmount={
              conversionResult.finalAmount !== null
                ? formattedBalance(conversionResult.finalAmount, toSymbol)
                : "0.00"
            }
          />

          {/* ── Rate row ── */}
          {rateDisplay && (
            <View style={s.rateRow}>
              <Text style={s.rateLabel}>Exchange Rate</Text>
              <View style={s.rateRight}>
                <Text style={s.rateValue}>{rateDisplay}</Text>
                <TouchableOpacity>
                  <MaterialCommunityIcons name="refresh" size={16} color={BLUE} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Why Convert section ── */}
          <View style={s.whySection}>
            <Text style={s.whyTitle}>Why Convert with BinaPay?</Text>
            {[
              { icon: "star-circle-outline", title: "Best Rate",  sub: "Competitive and transparent pricing" },
              { icon: "lightning-bolt",      title: "Instant",    sub: "Your crypto will be available instantly" },
              { icon: "shield-check-outline",title: "Secure",     sub: "Bank-grade security for your assets" },
            ].map(({ icon, title, sub }) => (
              <View key={title} style={s.whyRow}>
                <View style={s.whyIconWrap}>
                  <MaterialCommunityIcons name={icon as any} size={22} color={BLUE} />
                </View>
                <View>
                  <Text style={s.whyRowTitle}>{title}</Text>
                  <Text style={s.whyRowSub}>{sub}</Text>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        {/* ── Review Order button ── */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity style={s.reviewBtn} onPress={handleReviewOrder}>
            <Text style={s.reviewBtnText}>Review Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Sheets ── */}
      <ConvertCryptoConfirmSheet
  ref={confirmSheetRef}
  mode={mode}
  fromSymbol={fromSymbol}
  toSymbol={toSymbol || (mode === "buy" ? cryptoAssets[0]?.symbol.toLowerCase() ?? "" : "ngn")}
  fromIconUrl={cryptoList.find(a => a.symbol === fromSymbol)?.icon_url}
  toIconUrl={cryptoList.find(a => a.symbol === toSymbol)?.icon_url}
  fee={formattedBalance(0, fromSymbol)}
  From={formattedBalance(amount || 0, fromSymbol)}
  To={formattedBalance(conversionResult.finalAmount ?? 0, toSymbol)}
  Rate={rateDisplay ?? ""}
  youSpend={formattedBalance(amount || 0, fromSymbol)}
  youReceive={formattedBalance(conversionResult.finalAmount ?? 0, toSymbol)}
  onConfirm={handleConfirm}
  onCancel={() => confirmSheetRef.current?.dismiss()}
/>
     <ConvertCryptoAuthSheet
  ref={authSheetRef}
  ttlSeconds={RATE_TTL}
  payload={{ from: fromSymbol, to: toSymbol, amount: parseFloat(amount), livePrices, liveNgnUsdt: adminNgnUsdtRate }}
  onExpired={() => { authSheetRef.current?.dismiss(); goToDashboard(); showToast({ variant: "warning", title: "Rate Expired", message: "The conversion time expired. Please try again." }); }}
  onClose={() => authSheetRef.current?.dismiss()}
  onSuccess={(msg) => { setSuccessMessage(msg); setShowSuccess(true); }}  // ← add this
/>
      
      <PleaseWaitModal visible={isProcessing} />
    </Provider>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: "#f8f9fb" },

  header:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:          { width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginRight: 12 },
  headerTitle:      { fontSize: 17, fontWeight: "700", color: BRAND },
  headerSub:        { fontSize: 12, color: "#6b7280", marginTop: 1 },
  historyBtn:       { marginLeft: "auto", width: 36, height: 36, borderRadius: 12, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },

  tabRow:           { flexDirection: "row", marginHorizontal: 16, marginTop: 16, backgroundColor: "#f3f4f6", borderRadius: 12, padding: 4 },
  tab:              { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  tabActive:        { backgroundColor: BLUE },
  tabActiveSell:    { backgroundColor: "#7c3aed" },
  tabText:          { fontSize: 15, fontWeight: "600", color: "#6b7280" },
  tabTextActive:    { color: "#fff" },

  rateBanner:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f0fdf4", borderWidth: 1, borderColor: "#bbf7d0", borderRadius: 14, padding: 14, marginBottom: 16 },
  rateBannerLeft:   {},
  rateBannerTitle:  { fontSize: 14, fontWeight: "700", color: "#15803d" },
  rateBannerSub:    { fontSize: 12, color: "#16a34a", marginTop: 2 },

  assetBox:         { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 4, borderWidth: 1, borderColor: "#f0f0f0" },
  assetBoxTop:      { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  assetBoxLabel:    { fontSize: 12, color: "#6b7280", fontWeight: "500" },
  assetBoxBalance:  { fontSize: 11, color: "#9ca3af" },
  assetBoxBalanceValue: { color: "#374151", fontWeight: "600" },

  assetRowInner:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  assetSelector:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f3f4f6", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  assetSelectorIcon:{ width: 24, height: 24, borderRadius: 12 },
  assetSelectorSymbol: { fontSize: 15, fontWeight: "700", color: "#111827" },
  flagEmoji:        { fontSize: 22 },

  amountInput:      { flex: 1, fontSize: 28, fontWeight: "700", color: "#111827", textAlign: "right", paddingRight: 4 },
  estimatedAmount:  { flex: 1, fontSize: 28, fontWeight: "700", color: "#111827", textAlign: "right" },
  currencySuffix:   { fontSize: 12, color: "#9ca3af", textAlign: "right", marginTop: 4 },

  quickRow:         { flexDirection: "row", gap: 8, marginTop: 12, flexWrap: "wrap" },
  quickChip:        { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: "#EEF3FF", borderWidth: 1, borderColor: "#bfdbfe" },
  quickChipText:    { fontSize: 13, fontWeight: "600", color: BLUE },

  dropdown:         { marginTop: 8, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  dropdownItem:     { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  dropdownIcon:     { width: 28, height: 28, borderRadius: 14 },
  dropdownSymbol:   { fontSize: 14, fontWeight: "600", color: "#111827" },
  dropdownName:     { fontSize: 12, color: "#6b7280" },

  swapRow:          { flexDirection: "row", alignItems: "center", marginVertical: 8 },
  swapLine:         { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  swapBtn:          { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center", marginHorizontal: 12, borderWidth: 1, borderColor: "#bfdbfe" },

  rateRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: "#f0f0f0" },
  rateLabel:        { fontSize: 13, color: "#6b7280" },
  rateRight:        { flexDirection: "row", alignItems: "center", gap: 8 },
  rateValue:        { fontSize: 13, fontWeight: "600", color: "#111827" },
  spreadBadge:      { fontSize: 12, color: "#16a34a", fontWeight: "600", backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },

  whySection:       { marginTop: 20 },
  whyTitle:         { fontSize: 14, fontWeight: "700", color: "#374151", marginBottom: 12 },
  whyRow:           { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 14 },
  whyIconWrap:      { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  whyRowTitle:      { fontSize: 14, fontWeight: "600", color: "#111827" },
  whyRowSub:        { fontSize: 12, color: "#6b7280", marginTop: 2 },

  footer:           { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  reviewBtn:        { backgroundColor: BLUE, paddingVertical: 16, borderRadius: 14, alignItems: "center" },
  reviewBtnText:    { fontSize: 16, fontWeight: "700", color: "#fff" },

  successWrap:   { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
successIcon:   { width: 72, height: 72, borderRadius: 36, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center", marginBottom: 16 },
successTitle:  { fontSize: 20, fontWeight: "800", color: BRAND, marginBottom: 4 },
successSub:    { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 24 },
receiptCard:   { width: "100%", backgroundColor: "#fff", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 20 },
receiptRow:    { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
receiptLabel:  { fontSize: 11, color: "#9ca3af", marginBottom: 3 },
receiptValue:  { fontSize: 13, fontWeight: "600", color: "#111827" },
doneBtn:       { width: "100%", backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
doneBtnText:   { fontSize: 15, fontWeight: "700", color: "#fff" },
});
