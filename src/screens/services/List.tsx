import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ScrollView, Image, Platform, StatusBar,
} from "react-native";
import { Provider } from "react-native-paper";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { calculateConversion, ConversionResult } from "@helpers/crypto-conversion";
import { getPairRateDisplay } from "@helpers/rate-display";
import { useNavigation } from "@react-navigation/native";
import API from "@lib/api";
import { routes } from "@constants/routes";
import { formattedBalance } from "@utils/transactionutils";
import * as Crypto from "expo-crypto";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { showToast } from "@helpers/toast";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ConvertCryptoConfirmSheet from "@components/ui/modals/transaction-confirmation/ConvertCryptoConfirmSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import ConvertCryptoAuthSheet from "@components/ui/modals/ConvertCryptoAuthSheet";
import { useGoToDashboard } from "@helpers/useGoToDashboard";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";
const PLACEHOLDER = "#9CA3AF";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});
const IOS_SHEET_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 12 },
  android: { elevation: 8 },
});

type CryptoAsset = {
  id: number; name: string; symbol: string;
  price_usd?: number; conversion_enabled: boolean;
  min_conversion: number; icon_url?: string;
};

type Props = {
  cryptoAssets: CryptoAsset[];
  adminNgnUsdtRate: { buy: number; sell: number } | null;
  spreadConfig?: { spreadType: "percent" | "flat"; spread: number };
};

// ── Asset selector row ────────────────────────────────────────────────────────
function AssetRow({
  label, symbol, balance, availableAssets, onChangeSymbol,
  amount, onChangeAmount, showAmountInput, estimatedAmount, quickAmounts,
}: {
  label: string; symbol: string; balance: number;
  availableAssets: { symbol: string; name: string; icon_url?: string }[];
  onChangeSymbol: (s: string) => void;
  amount?: string; onChangeAmount?: (v: string) => void;
  showAmountInput: boolean; estimatedAmount?: string; quickAmounts?: number[];
}) {
  const [open, setOpen] = useState(false);
  const selectedAsset = availableAssets.find(a => a.symbol.toLowerCase() === symbol.toLowerCase());
  const isNgn = symbol.toLowerCase() === "ngn";

  return (
    <View style={[ar.box, IOS_SHADOW]}>
      <View style={ar.boxTop}>
        <Text style={ar.boxLabel}>{label}</Text>
        <Text style={ar.boxBalance}>
          Balance:{" "}
          <Text style={ar.boxBalanceVal}>
            {isNgn
              ? `₦${formattedBalance(balance, "", 2)}`
              : formattedBalance(balance, symbol.toUpperCase(), 8)}
          </Text>
        </Text>
      </View>

      <View style={ar.inner}>
        {/* Asset pill */}
        <TouchableOpacity style={ar.assetPill} onPress={() => setOpen(o => !o)} activeOpacity={0.8}>
          {isNgn ? (
            <Text style={ar.flag}>🇳🇬</Text>
          ) : selectedAsset?.icon_url ? (
            <Image source={{ uri: selectedAsset.icon_url }} style={ar.assetIcon} />
          ) : (
            <View style={[ar.assetIcon, ar.assetIconFallback]}>
              <Text style={ar.assetIconText}>{symbol.toUpperCase().slice(0, 2)}</Text>
            </View>
          )}
          <Text style={ar.assetSymbol}>{symbol.toUpperCase()}</Text>
          <MaterialCommunityIcons name={open ? "chevron-up" : "chevron-down"} size={16} color={SUBLABEL} />
        </TouchableOpacity>

        {/* Amount */}
        {showAmountInput ? (
          <TextInput
            style={ar.amountInput}
            value={amount}
            onChangeText={onChangeAmount}
            placeholder="0.00"
            keyboardType="numeric"
            placeholderTextColor={PLACEHOLDER}
          />
        ) : (
          <Text style={ar.estimatedAmount}>{estimatedAmount ?? "0.00"}</Text>
        )}
      </View>

      <Text style={ar.currencySuffix}>{symbol.toUpperCase()}</Text>

      {/* Quick amounts */}
      {showAmountInput && quickAmounts && quickAmounts.length > 0 && (
        <View style={ar.quickRow}>
          {quickAmounts.map(v => (
            <TouchableOpacity key={v} style={ar.quickChip} onPress={() => onChangeAmount?.(String(v))} activeOpacity={0.75}>
              <Text style={ar.quickChipText}>
                {isNgn ? `₦${v >= 1000 ? `${v / 1000}k` : v}` : `${v} ${symbol.toUpperCase()}`}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={ar.quickChip} onPress={() => onChangeAmount?.(String(balance))} activeOpacity={0.75}>
            <Text style={ar.quickChipText}>Max</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Dropdown */}
      {open && (
        <View style={[ar.dropdown, IOS_SHADOW]}>
          {availableAssets.map((a, i) => (
            <TouchableOpacity key={a.symbol}
              style={[ar.dropdownItem, i < availableAssets.length - 1 && ar.dropdownItemBorder]}
              onPress={() => { onChangeSymbol(a.symbol.toLowerCase()); setOpen(false); }}
              activeOpacity={0.7}>
              {a.symbol.toLowerCase() === "ngn" ? (
                <Text style={ar.flag}>🇳🇬</Text>
              ) : a.icon_url ? (
                <Image source={{ uri: a.icon_url }} style={ar.dropdownIcon} />
              ) : (
                <View style={[ar.dropdownIcon, ar.assetIconFallback]}>
                  <Text style={ar.assetIconText}>{a.symbol.toUpperCase().slice(0, 2)}</Text>
                </View>
              )}
              <View>
                <Text style={ar.dropdownSymbol}>{a.symbol.toUpperCase()}</Text>
                <Text style={ar.dropdownName}>{a.name}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const ar = StyleSheet.create({
  box:            { backgroundColor: SURFACE, borderRadius: 16, padding: 16, marginBottom: 4, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  boxTop:         { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  boxLabel:       { fontSize: 12, color: SUBLABEL, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.4 },
  boxBalance:     { fontSize: 11, color: PLACEHOLDER },
  boxBalanceVal:  { color: SUBLABEL, fontWeight: "600" },
  inner:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  assetPill:      { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: BG, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  assetIcon:      { width: 24, height: 24, borderRadius: 12 },
  assetIconFallback: { backgroundColor: SEPARATOR, justifyContent: "center", alignItems: "center" },
  assetIconText:  { fontSize: 10, fontWeight: "700", color: SUBLABEL },
  assetSymbol:    { fontSize: 15, fontWeight: "700", color: LABEL },
  flag:           { fontSize: 22 },
  amountInput:    { flex: 1, fontSize: 28, fontWeight: "700", color: LABEL, textAlign: "right", paddingRight: 4, letterSpacing: -0.5 },
  estimatedAmount:{ flex: 1, fontSize: 28, fontWeight: "700", color: LABEL, textAlign: "right", letterSpacing: -0.5 },
  currencySuffix: { fontSize: 12, color: PLACEHOLDER, textAlign: "right", marginTop: 4 },
  quickRow:       { flexDirection: "row", gap: 8, marginTop: 14, flexWrap: "wrap" },
  quickChip:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: BLUE_LIGHT, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  quickChipText:  { fontSize: 13, fontWeight: "600", color: BLUE },
  dropdown:       { marginTop: 10, backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  dropdownItem:   { flexDirection: "row", alignItems: "center", gap: 10, padding: 13, minHeight: 50 },
  dropdownItemBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  dropdownIcon:   { width: 28, height: 28, borderRadius: 14 },
  dropdownSymbol: { fontSize: 14, fontWeight: "600", color: LABEL },
  dropdownName:   { fontSize: 12, color: SUBLABEL },
});

// ── Main Component ────────────────────────────────────────────────────────────
export default function ConvertCrypto({ cryptoAssets, adminNgnUsdtRate, spreadConfig }: Props) {
  const navigation    = useNavigation();
  const user          = useSelector(selectUser);
  const goToDashboard = useGoToDashboard();
  const insets        = useSafeAreaInsets();

  // ── All original state + logic — untouched ────────────────────────────────
  const wallets: Record<string, number> = {};
  if (user?.wallet_balances) {
    Object.entries(user.wallet_balances).forEach(([slug, wallet]: any) => {
      const key = slug.toLowerCase() === "naira" ? "ngn" : slug.toLowerCase();
      wallets[key] = Number(wallet.balance);
    });
  }

  const [mode, setMode]             = useState<"buy" | "sell">("buy");
  const [loading, setLoading]       = useState(true);
  const [fromSymbol, setFromSymbol] = useState("ngn");
  const [toSymbol, setToSymbol]     = useState("");
  const [amount, setAmount]         = useState("");
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [conversionResult, setConversionResult] = useState<ConversionResult>({ finalAmount: null, spreadApplied: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess]   = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const confirmSheetRef   = useRef<BottomSheetModalMethods>(null);
  const authSheetRef      = useRef<BottomSheetModalMethods>(null);
  const idempotencyKeyRef = useRef<string>(Crypto.randomUUID());
  const RATE_TTL          = 600;
  const BASE_URL          = process.env.EXPO_PUBLIC_BINAPAY_BASE_URL;

  useEffect(() => {
    if (mode === "buy") { setFromSymbol("ngn"); setToSymbol(cryptoAssets[0]?.symbol.toLowerCase() ?? ""); }
    else                { setFromSymbol(cryptoAssets[0]?.symbol.toLowerCase() ?? ""); setToSymbol("ngn"); }
    setAmount("");
  }, [mode]);

  useEffect(() => {
    const fetchPrices = async (showInitial = false) => {
      if (showInitial) setLoading(true);
      try {
        API.defaults.baseURL = BASE_URL;
        const res = await API.get<{ success: boolean; data: CryptoAsset[] }>(routes.api.v1.auth.cryptoprices);
        if (res.data.success) {
          const map: Record<string, number> = {};
          res.data.data.forEach(a => { if (a.price_usd) map[a.symbol.toUpperCase()] = a.price_usd; });
          setLivePrices(map);
        }
      } catch (e) { console.log("Price fetch error:", e); }
      finally { if (showInitial) setLoading(false); }
    };
    fetchPrices(true);
    const interval = setInterval(() => fetchPrices(false), 180000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!amount || !toSymbol || !adminNgnUsdtRate) { setConversionResult({ finalAmount: null, spreadApplied: null }); return; }
    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) { setConversionResult({ finalAmount: null, spreadApplied: null }); return; }
    setConversionResult(calculateConversion(fromSymbol, toSymbol, parsed, livePrices, adminNgnUsdtRate, spreadConfig));
  }, [fromSymbol, toSymbol, amount, livePrices, adminNgnUsdtRate]);

  const ngnAsset   = { symbol: "ngn", name: "Nigerian Naira", icon_url: undefined };
  const cryptoList = cryptoAssets.map(a => ({ symbol: a.symbol.toLowerCase(), name: a.name, icon_url: a.icon_url }));
  const fromAssets = mode === "buy" ? [ngnAsset] : cryptoList;
  const toAssets   = mode === "buy" ? cryptoList : [ngnAsset];
  const quickAmounts = mode === "buy" ? [10000, 50000, 100000] : [10, 25, 50];

  const rateDisplay = fromSymbol && toSymbol && adminNgnUsdtRate
    ? getPairRateDisplay({ fromSymbol, toSymbol, livePrices, liveNgnUsdt: adminNgnUsdtRate, spreadConfig })
    : null;

  const handleReviewOrder = () => {
    const parsed = parseFloat(amount);
    if (!amount || isNaN(parsed) || parsed <= 0) {
      showToast({ title: "Amount Required", message: "Please enter a valid amount.", variant: "warning" }); return;
    }
    if (mode === "buy" && parsed < 1500) {
      showToast({ title: "Below Minimum", message: "Minimum NGN conversion is ₦1,500.", variant: "warning" }); return;
    }
    if (mode === "sell") {
      const fromAsset = cryptoAssets.find(a => a.symbol.toLowerCase() === fromSymbol);
      const min = Number(fromAsset?.min_conversion ?? 0);
      if (parsed < min) {
        showToast({ title: "Below Minimum", message: `Minimum ${fromSymbol.toUpperCase()} conversion is ${min}.`, variant: "warning" }); return;
      }
    }
    if (parsed > (wallets[fromSymbol] ?? 0)) {
      showToast({ title: "Insufficient Balance", message: `You don't have enough ${fromSymbol.toUpperCase()}.`, variant: "warning" }); return;
    }
    confirmSheetRef.current?.present();
  };

  const handleConfirm = () => { confirmSheetRef.current?.dismiss(); setTimeout(() => authSheetRef.current?.present(), 250); };

  // ── Success screen ────────────────────────────────────────────────────────
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
          <Text style={s.successTitle}>Conversion Successful</Text>
          <Text style={s.successSub}>{successMessage}</Text>
          <View style={[s.receiptCard, IOS_SHADOW]}>
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>You Spent</Text>
              <Text style={s.receiptValue}>{formattedBalance(parseFloat(amount) || 0, fromSymbol.toUpperCase())}</Text>
            </View>
            <View style={s.receiptDivider} />
            <View style={s.receiptRow}>
              <Text style={s.receiptLabel}>You Received</Text>
              <Text style={[s.receiptValue, { color: "#16A34A" }]}>{formattedBalance(conversionResult.finalAmount ?? 0, toSymbol.toUpperCase())}</Text>
            </View>
            {rateDisplay && (
              <>
                <View style={s.receiptDivider} />
                <View style={s.receiptRow}>
                  <Text style={s.receiptLabel}>Rate</Text>
                  <Text style={s.receiptValue}>{rateDisplay}</Text>
                </View>
              </>
            )}
          </View>
          <TouchableOpacity style={s.doneBtn} onPress={goToDashboard} activeOpacity={0.85}>
            <Text style={s.doneBtnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <Provider>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />

        {/* ── iOS nav bar ── */}
        <View style={s.navBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
          </TouchableOpacity>
          <View style={s.navCenter}>
            <Text style={s.navTitle}>Convert</Text>
            <Text style={s.navSub}>Buy or sell crypto instantly</Text>
          </View>
          <TouchableOpacity style={s.historyBtn} onPress={() => navigation.navigate("Activity" as never)} activeOpacity={0.7}>
            <MaterialCommunityIcons name="history" size={20} color={BRAND} />
          </TouchableOpacity>
        </View>

        {/* ── Buy / Sell segmented control ── */}
        <View style={s.tabRow}>
          <TouchableOpacity style={[s.tab, mode === "buy" && s.tabActiveBuy]}
            onPress={() => setMode("buy")} activeOpacity={0.8}>
            <Text style={[s.tabText, mode === "buy" && s.tabTextActive]}>Buy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.tab, mode === "sell" && s.tabActiveSell]}
            onPress={() => setMode("sell")} activeOpacity={0.8}>
            <Text style={[s.tabText, mode === "sell" && s.tabTextActive]}>Sell</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* From */}
          <AssetRow label="You Spend" symbol={fromSymbol} balance={wallets[fromSymbol] ?? 0}
            availableAssets={fromAssets} onChangeSymbol={setFromSymbol}
            amount={amount} onChangeAmount={setAmount} showAmountInput quickAmounts={quickAmounts} />

          {/* Swap */}
          <View style={s.swapRow}>
            <View style={s.swapLine} />
            <TouchableOpacity style={s.swapBtn} activeOpacity={0.8}
              onPress={() => { setFromSymbol(toSymbol); setToSymbol(fromSymbol); setMode(mode === "buy" ? "sell" : "buy"); setAmount(""); }}>
              <MaterialCommunityIcons name="swap-vertical" size={20} color={BLUE} />
            </TouchableOpacity>
            <View style={s.swapLine} />
          </View>

          {/* To */}
          <AssetRow label="You Receive"
            symbol={toSymbol || (mode === "buy" ? cryptoAssets[0]?.symbol.toLowerCase() ?? "" : "ngn")}
            balance={wallets[toSymbol] ?? 0} availableAssets={toAssets} onChangeSymbol={setToSymbol}
            showAmountInput={false}
            estimatedAmount={conversionResult.finalAmount !== null ? formattedBalance(conversionResult.finalAmount, toSymbol) : "0.00"} />

          {/* Rate */}
          {rateDisplay && (
            <View style={[s.rateRow, IOS_SHADOW]}>
              <Text style={s.rateLabel}>Exchange Rate</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Text style={s.rateValue}>{rateDisplay}</Text>
                <TouchableOpacity hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <MaterialCommunityIcons name="refresh" size={16} color={BLUE} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Why Convert */}
          <View style={s.whySection}>
            <Text style={s.whyTitle}>Why Convert with BinaPay?</Text>
            <View style={[s.whyCard, IOS_SHADOW]}>
              {[
                { icon: "star-circle-outline", title: "Best Rate",  sub: "Competitive and transparent pricing" },
                { icon: "lightning-bolt",      title: "Instant",    sub: "Your crypto will be available instantly" },
                { icon: "shield-check-outline",title: "Secure",     sub: "Bank-grade security for your assets" },
              ].map(({ icon, title, sub }, i, arr) => (
                <React.Fragment key={title}>
                  {i > 0 && <View style={s.whyHairline} />}
                  <View style={s.whyRow}>
                    <View style={s.whyIconWrap}>
                      <MaterialCommunityIcons name={icon as any} size={22} color={BLUE} />
                    </View>
                    <View>
                      <Text style={s.whyRowTitle}>{title}</Text>
                      <Text style={s.whyRowSub}>{sub}</Text>
                    </View>
                  </View>
                </React.Fragment>
              ))}
            </View>
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }, IOS_SHEET_SHADOW]}>
          <TouchableOpacity style={s.reviewBtn} onPress={handleReviewOrder} activeOpacity={0.85}>
            <Text style={s.reviewBtnText}>Review Order</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sheets */}
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
        onSuccess={(msg) => { setSuccessMessage(msg); setShowSuccess(true); }}
      />
      <PleaseWaitModal visible={isProcessing} />
    </Provider>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: BG },
  // Nav
  navBar:         { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:        { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:      { flex: 1, alignItems: "center" },
  navTitle:       { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:         { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  historyBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  // Tabs
  tabRow:         { flexDirection: "row", marginHorizontal: 16, marginTop: 14, marginBottom: 4, backgroundColor: "#E2E8F0", borderRadius: 14, padding: 4 },
  tab:            { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: "center" },
  tabActiveBuy:   { backgroundColor: BLUE },
  tabActiveSell:  { backgroundColor: "#7C3AED" },
  tabText:        { fontSize: 15, fontWeight: "600", color: SUBLABEL },
  tabTextActive:  { color: SURFACE },
  // Scroll
  scroll:         { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120 },
  // Swap
  swapRow:        { flexDirection: "row", alignItems: "center", marginVertical: 6 },
  swapLine:       { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  swapBtn:        { width: 40, height: 40, borderRadius: 20, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center", marginHorizontal: 12, borderWidth: 1, borderColor: "#BFDBFE" },
  // Rate
  rateRow:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: SURFACE, borderRadius: 12, padding: 14, marginTop: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  rateLabel:      { fontSize: 13, color: SUBLABEL },
  rateValue:      { fontSize: 13, fontWeight: "600", color: LABEL },
  // Why section
  whySection:     { marginTop: 20 },
  whyTitle:       { fontSize: 14, fontWeight: "700", color: SUBLABEL, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 },
  whyCard:        { backgroundColor: SURFACE, borderRadius: 14, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  whyHairline:    { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 60 },
  whyRow:         { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14 },
  whyIconWrap:    { width: 40, height: 40, borderRadius: 12, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  whyRowTitle:    { fontSize: 14, fontWeight: "600", color: LABEL },
  whyRowSub:      { fontSize: 12, color: SUBLABEL, marginTop: 2 },
  // Footer
  footer:         { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: SURFACE, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: SEPARATOR },
  reviewBtn:      { backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  reviewBtnText:  { fontSize: 16, fontWeight: "700", color: SURFACE },
  // Success
  successWrap:    { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  successRing:    { width: 88, height: 88, borderRadius: 44, backgroundColor: "#DCFCE7", justifyContent: "center", alignItems: "center", marginBottom: 20 },
  successIcon:    { width: 64, height: 64, borderRadius: 32, backgroundColor: "#16A34A", justifyContent: "center", alignItems: "center" },
  successTitle:   { fontSize: 22, fontWeight: "800", color: BRAND, letterSpacing: -0.4, marginBottom: 8 },
  successSub:     { fontSize: 14, color: SUBLABEL, textAlign: "center", marginBottom: 24, lineHeight: 20 },
  receiptCard:    { width: "100%", backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, marginBottom: 28 },
  receiptRow:     { paddingHorizontal: 16, paddingVertical: 14 },
  receiptDivider: { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR },
  receiptLabel:   { fontSize: 12, color: SUBLABEL, marginBottom: 3 },
  receiptValue:   { fontSize: 14, fontWeight: "600", color: LABEL },
  doneBtn:        { width: "100%", backgroundColor: BLUE, paddingVertical: 15, borderRadius: 14, alignItems: "center" },
  doneBtnText:    { fontSize: 16, fontWeight: "700", color: SURFACE },
});
