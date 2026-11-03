import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useFocusEffect } from "@react-navigation/native";
import { CryptoProvider, useCrypto } from "@screens/home/CryptoContext";
import { selectNgnUsdtRateWithSpread, selectUser } from "@store/selectors/auth";
import { formattedBalance } from "@utils/transactionutils";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { getPairRateDisplay } from "@helpers/rate-display";
import { getCompactRateDisplay } from "@helpers/rate-display-compact";
import { calculateConversion } from "@helpers/crypto-conversion";
import { State } from "@store/main";

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const GRAD_START = "#2563EB";
const GRAD_END   = "#1E3A8A";

// Rates refresh every 5 minutes.
const REFRESH_SECONDS = 5 * 60;
// Seconds until the next 5-minute clock mark (9:40 → 9:45 → 9:50 ...).
const secondsToNextSlot = () => {
  const now = Math.floor(Date.now() / 1000);
  return REFRESH_SECONDS - (now % REFRESH_SECONDS);
};

// Search only appears once a list is longer than these.
const RATES_SEARCH_THRESHOLD  = 6; // full-page rates list
const PICKER_SEARCH_THRESHOLD = 6;  // calculator asset dropdown

// Same default the Convert screen uses when the store has none.
const DEFAULT_NO_SPREAD_SYMBOLS = ["USDT", "USDC"];

const pad = (n: number) => String(n).padStart(2, "0");

function AssetIcon({ uri, size = 40 }: { uri?: string | null; size?: number }) {
  return (
    <Image
      source={uri ? { uri } : require("@assets/images/oops.png")}
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: "#f3f4f6" }}
      resizeMode="contain"
    />
  );
}

function RatesContent() {
  const insets   = useSafeAreaInsets();
  const dispatch = useTypedDispatch();
  const { assets } = useCrypto(); // live prices only — list order comes from the server list below
  const ngnRate  = useSelector(selectNgnUsdtRateWithSpread); // { buy, sell, spreadType, spread }
  const user     = useSelector(selectUser);
  const noSpreadSymbols = useSelector(
    (st: State) => (st as any).auth.noSpreadSymbols ?? DEFAULT_NO_SPREAD_SYMBOLS
  );

  const cryptoDepositFee = useSelector(
  (st: State) => (st as any).auth.cryptoDepositFee ?? null
);
 console.log("fee", user?.crypto_deposit_fee, user?.crypto_deposit_fee_type);
  // Same list, same order as the deposit / withdraw screens.
  const cryptoAssets = useMemo(() => user?.crypto_assets ?? [], [user?.crypto_assets]);

  // ── State ──────────────────────────────────────────────────────────────────
  const [tab, setTab]                   = useState<"rates" | "calculator">("rates");
 const [showSellRate, setShowSellRate] = useState(false); // buy rate by default
  const [secondsLeft, setSecondsLeft]   = useState(secondsToNextSlot);
  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [amount, setAmount]             = useState("");

  // Rates list search
  const [listSearch, setListSearch]     = useState("");

  // Calculator asset dropdown + its search
  const [pickerOpen, setPickerOpen]         = useState(false);
  const [showPickerSearch, setShowPickerSearch] = useState(false);
  const [pickerSearch, setPickerSearch]     = useState("");

  // ── Refresh timer ──────────────────────────────────────────────────────────
  // Counts down; at zero it re-fetches the app config (rates) and restarts.
  useEffect(() => {
  let prev = secondsToNextSlot();
  const id = setInterval(() => {
    const next = secondsToNextSlot();
    // The clock just crossed a 5-minute mark: pull the new rates.
    // Small delay so the server has time to publish them.
    if (next > prev) {
      setTimeout(() => dispatch(authSliceActions.fetchAppConfig()), 3000);
    }
    prev = next;
    setSecondsLeft(next);
  }, 1000);
  return () => clearInterval(id);
}, []);

  // Fresh rates every time the screen is opened.
  useFocusEffect(
    useCallback(() => {
      dispatch(authSliceActions.fetchAppConfig());
      setSecondsLeft(secondsToNextSlot());
    }, [])
  );

  // ── Default calculator asset: USDT, else first asset ──────────────────────
  useEffect(() => {
    if (selectedSymbol || cryptoAssets.length === 0) return;
    const usdt = cryptoAssets.find((a) => a.symbol.toUpperCase() === "USDT");
    setSelectedSymbol((usdt ?? cryptoAssets[0]).symbol);
  }, [cryptoAssets, selectedSymbol]);

  // ── Prices / spread (same inputs the Convert screen uses) ─────────────────
  const livePrices = useMemo(() => {
    const map: Record<string, number> = {};
    cryptoAssets.forEach((a) => {
      if (a.price_usd) map[a.symbol.toUpperCase()] = a.price_usd;
    });
    // live context prices win when available
    assets.forEach((a) => {
      if (a.price_usd) map[a.symbol.toUpperCase()] = a.price_usd;
    });
    return map;
  }, [cryptoAssets, assets]);

  const spreadConfig = useMemo(
    () => (ngnRate ? { spreadType: ngnRate.spreadType, spread: ngnRate.spread } : undefined),
    [ngnRate]
  );

  const rateParams = (symbol: string) => ({
    fromSymbol:  showSellRate ? symbol : "NGN",
    toSymbol:    showSellRate ? "NGN" : symbol,
    livePrices,
    liveNgnUsdt: ngnRate,
    spreadConfig,
    noSpreadSymbols,
  });

  // "1 BTC = ₦X" — sell: crypto → NGN, buy: NGN → crypto.
  const rateText = (symbol: string) => {
    const text = getPairRateDisplay(rateParams(symbol));
    return text ? text.replace("≈", "=") : "—";
  };

  // "₦X" only (used in the list rows, with "per 1 BTC" underneath).
  const compactRate = (symbol: string) => getCompactRateDisplay(rateParams(symbol)) || "—";

  const changeMode = (sell: boolean) => {
    if (sell === showSellRate) return;
    setShowSellRate(sell);
    setAmount(""); // the send currency flips, so clear the old amount
    closePicker();
  };

  const closePicker = () => {
    setPickerOpen(false);
    setShowPickerSearch(false);
    setPickerSearch("");
  };

  // ── Rates list (server order, optional search) ────────────────────────────
  const showListSearch = cryptoAssets.length > RATES_SEARCH_THRESHOLD;

  const visibleRates = useMemo(() => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return cryptoAssets;
    return cryptoAssets.filter(
      (a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
    );
  }, [cryptoAssets, listSearch]);

  // ── Calculator dropdown list ──────────────────────────────────────────────
  const showPickerSearchIcon = cryptoAssets.length > PICKER_SEARCH_THRESHOLD;

  const visiblePickerAssets = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return cryptoAssets;
    return cryptoAssets.filter(
      (a) => a.name.toLowerCase().includes(q) || a.symbol.toLowerCase().includes(q)
    );
  }, [cryptoAssets, pickerSearch]);

  // ── Calculator maths ───────────────────────────────────────────────────────
  const selectedAsset = cryptoAssets.find(
    (a) => a.symbol.toUpperCase() === selectedSymbol.toUpperCase()
  );
 const parsed = parseFloat(amount) || 0;

// ── Crypto deposit fee (sell mode only) ───────────────────────────────────
// Percent fee = % of the coins sent. Flat fee = a USD amount, converted to coins.
// The fee comes out of the coins first, then the rest is converted to naira,
// which is what the backend does when the deposit is credited.
const feeKnown     = cryptoDepositFee != null;
const feeType      = cryptoDepositFee?.type;
const feeValue     = Number(cryptoDepositFee?.value ?? 0);
const feeIsPercent = feeType === "percent" || feeType === "percentage";
const feeIsFree    = feeKnown && feeValue <= 0;

const symbolUpper   = selectedSymbol.toUpperCase();
const assetPriceUsd = symbolUpper === "USDT" ? 1 : (livePrices[symbolUpper] ?? 0);

let feeCrypto = 0;
if (showSellRate && feeKnown && feeValue > 0 && parsed > 0) {
  feeCrypto = feeIsPercent
    ? (parsed * feeValue) / 100
    : assetPriceUsd > 0 ? feeValue / assetPriceUsd : 0;
  if (feeCrypto >= parsed) feeCrypto = 0; // a fee never swallows the whole deposit
}
const feeUsd    = feeCrypto * assetPriceUsd;
const netCrypto = Math.max(parsed - feeCrypto, 0);

const conversion = useMemo(() => {
  if (!ngnRate || !selectedSymbol || parsed <= 0) return { finalAmount: null as number | null };
  return calculateConversion(
    showSellRate ? selectedSymbol : "ngn",
    showSellRate ? "ngn" : selectedSymbol,
    showSellRate ? netCrypto : parsed,
    livePrices,
    ngnRate,
    spreadConfig,
    noSpreadSymbols,
  );
}, [ngnRate, selectedSymbol, parsed, netCrypto, showSellRate, livePrices, spreadConfig, noSpreadSymbols]);

// Percent shows as "0.9%" (plus its dollar value once an amount is typed),
// flat shows as a dollar amount, e.g. "$0.10".
const feeLabel = !feeKnown
  ? "—"
  : feeIsPercent
    ? `${feeValue}%${parsed > 0 && assetPriceUsd > 0 ? ` = $${formattedBalance(feeUsd, "", 2)}` : ""}`
    : `$${formattedBalance(feeValue, "", 2)}`;

const receiveAmount = conversion.finalAmount ?? 0;
const receiveText   = showSellRate
  ? formattedBalance(receiveAmount, "", 2)
  : formattedBalance(receiveAmount, "", 8);

  // ── Small pieces ───────────────────────────────────────────────────────────
  const assetPill = (
    <TouchableOpacity
      style={s.pill}
      onPress={() => (pickerOpen ? closePicker() : setPickerOpen(true))}
      activeOpacity={0.8}
    >
      <AssetIcon uri={selectedAsset?.icon_url} size={24} />
      <Text style={s.pillText}>{selectedSymbol ? selectedSymbol.toUpperCase() : "Select"}</Text>
      <MaterialCommunityIcons name={pickerOpen ? "chevron-up" : "chevron-down"} size={18} color="#111827" />
    </TouchableOpacity>
  );

  const nairaPill = (
    <View style={s.pill}>
      <View style={s.nairaDot}><Text style={s.nairaDotText}>₦</Text></View>
      <Text style={s.pillText}>Naira</Text>
    </View>
  );

  const picker = pickerOpen ? (
    <View style={s.picker}>
      {showPickerSearchIcon && (
        <View style={s.pickerSearchRow}>
          {showPickerSearch ? (
            <TextInput
              style={s.pickerSearchInput}
              placeholder="Search by name or symbol"
              placeholderTextColor="#9ca3af"
              value={pickerSearch}
              onChangeText={setPickerSearch}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
          ) : (
            <Text style={s.pickerSearchHint}>Select asset</Text>
          )}
          <TouchableOpacity
            onPress={() => {
              if (showPickerSearch) setPickerSearch("");
              setShowPickerSearch((v) => !v);
            }}
            style={s.pickerSearchBtn}
          >
            <MaterialCommunityIcons
              name={showPickerSearch ? "close" : "magnify"}
              size={18}
              color="#6b7280"
            />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={{ maxHeight: 300 }} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {visiblePickerAssets.length === 0 && (
          <Text style={s.emptyInline}>No assets found</Text>
        )}
        {visiblePickerAssets.map((a) => (
          <TouchableOpacity
            key={a.id}
            style={s.pickerItem}
            onPress={() => { setSelectedSymbol(a.symbol); closePicker(); }}
          >
            <AssetIcon uri={a.icon_url} size={30} />
            <View style={{ flex: 1 }}>
              <Text style={s.pickerSymbol}>{a.symbol.toUpperCase()}</Text>
              <Text style={s.pickerName}>{a.name}</Text>
            </View>
            {selectedSymbol.toUpperCase() === a.symbol.toUpperCase() && (
              <MaterialCommunityIcons name="check-circle" size={16} color={BLUE} />
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  ) : null;

  const progressPct = Math.max(0, Math.min(100, (secondsLeft / REFRESH_SECONDS) * 100));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View style={[s.root, { paddingTop: insets.top + 12 }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Tabs (underline style) */}
        <View style={s.tabs}>
          {(["rates", "calculator"] as const).map((t) => (
            <TouchableOpacity key={t} style={s.tab} onPress={() => setTab(t)} activeOpacity={0.8}>
              <Text style={[s.tabText, tab === t && s.tabTextActive]}>
                {t === "rates" ? "Rates" : "Calculator"}
              </Text>
              <View style={[s.tabUnderline, tab === t && s.tabUnderlineActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Live-rates timer card */}
        <LinearGradient
          colors={[GRAD_START, GRAD_END]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.timerCard}
        >
          <View style={s.timerTop}>
            <View style={s.liveDot} />
            <Text style={s.timerLabel}>Live rates · next update in</Text>
          </View>
          <Text style={s.timerTime}>
            {pad(Math.floor(secondsLeft / 60))}:{pad(secondsLeft % 60)}
          </Text>
          <View style={s.timerTrack}>
            <View style={[s.timerFill, { width: `${progressPct}%` }]} />
          </View>
        </LinearGradient>

        {/* Sell / Buy toggle — shared by both tabs */}
        <View style={s.modeRow}>
          <TouchableOpacity
            style={[s.modeChip, !showSellRate && s.modeChipActive]}
            onPress={() => changeMode(false)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arrow-up-circle-outline"
              size={16}
              color={!showSellRate ? BLUE : "#6b7280"}
            />
            <Text style={[s.modeText, !showSellRate && s.modeTextActive]}>Buy Rate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[s.modeChip, showSellRate && s.modeChipActive]}
            onPress={() => changeMode(true)}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="arrow-down-circle-outline"
              size={16}
              color={showSellRate ? BLUE : "#6b7280"}
            />
            <Text style={[s.modeText, showSellRate && s.modeTextActive]}>Sell Rate</Text>
          </TouchableOpacity>

        </View>
        <Text style={s.modeCaption}>
          {showSellRate
            ? "What you receive in naira when you send crypto."
            : "What you pay in naira to buy crypto."}
        </Text>

        {/* ── Rates tab ── */}
        {tab === "rates" && (
          <>
            {showListSearch && (
              <View style={s.searchBox}>
                <MaterialCommunityIcons name="magnify" size={18} color="#9ca3af" />
                <TextInput
                  style={s.searchInput}
                  placeholder="Search assets"
                  placeholderTextColor="#9ca3af"
                  value={listSearch}
                  onChangeText={setListSearch}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {listSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setListSearch("")}>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#9ca3af" />
                  </TouchableOpacity>
                )}
              </View>
            )}

            {cryptoAssets.length === 0 ? (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="chart-line" size={44} color="#d1d5db" />
                <Text style={s.emptyText}>No rates to show</Text>
              </View>
            ) : visibleRates.length === 0 ? (
              <View style={s.emptyState}>
                <MaterialCommunityIcons name="magnify" size={40} color="#d1d5db" />
                <Text style={s.emptyText}>No assets found</Text>
              </View>
            ) : (
              visibleRates.map((a) => (
                <View key={a.id} style={s.rateRow}>
                  <View style={s.rateLeft}>
                    <AssetIcon uri={a.icon_url} size={40} />
                    <View>
                      <Text style={s.rateName}>{a.name}</Text>
                      <Text style={s.rateSymbol}>{a.symbol.toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={s.rateRight}>
                    <Text style={s.rateValue}>{compactRate(a.symbol)}</Text>
                    <Text style={s.ratePer}>per 1 {a.symbol.toUpperCase()}</Text>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── Calculator tab ── */}
        {tab === "calculator" && (
          <>
            <View style={s.calcCard}>
              {/* You Send */}
              <View style={s.calcSection}>
                <View style={s.calcRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.calcLabel}>You Send</Text>
                    <TextInput
                      style={s.calcInput}
                      value={amount}
                      onChangeText={(v) => setAmount(v.replace(/[^0-9.]/g, ""))}
                      placeholder="0.00"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                    />
                  </View>
                  {showSellRate ? assetPill : nairaPill}
                </View>
                {showSellRate && picker}
              </View>

              {/* Rate + fee */}
              <View style={s.metaSection}>
                <View style={s.metaRow}>
                  <View style={s.metaLeft}>
                    <View style={s.metaIcon}>
                      <MaterialCommunityIcons name="cash" size={14} color="#111827" />
                    </View>
                    <Text style={s.metaLabel}>Exchange Rate</Text>
                  </View>
                  <Text style={s.metaValue}>
                    {selectedSymbol ? rateText(selectedSymbol) : "—"}
                  </Text>
                </View>

                {showSellRate && (
                  <View style={s.metaRow}>
                    <View style={s.metaLeft}>
                      <View style={s.metaIcon}>
                        <MaterialCommunityIcons name="swap-vertical" size={14} color="#111827" />
                      </View>
                      <Text style={s.metaLabel}>Fee</Text>
                    </View>
                    {feeIsFree ? (
                      <View style={s.freeBadge}>
                        <MaterialCommunityIcons name="check-decagram" size={14} color="#16a34a" />
                        <Text style={s.freeBadgeText}>Free</Text>
                      </View>
                    ) : (
                      <Text style={s.metaValue}>{feeLabel}</Text>
                    )}
                  </View>
                )}
              </View>

              {/* You Receive */}
              <View style={s.receiveSection}>
                <View style={s.calcRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.calcLabel}>You Receive</Text>
                    <Text style={s.receiveAmount}>{receiveText}</Text>
                  </View>
                  {showSellRate ? nairaPill : assetPill}
                </View>
                {!showSellRate && picker}
              </View>
            </View>

            <View style={s.infoBox}>
              <MaterialCommunityIcons name="clock-check-outline" size={20} color={BRAND} />
              <Text style={s.infoText}>
                Prices refresh every 5 minutes, so what you see here stays close to the live market.
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

export default function RatesScreen() {
  return (
    <CryptoProvider>
      <RatesContent />
      
    </CryptoProvider>
  );
}

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },

  // Tabs (underline)
  tabs:            { flexDirection: "row", marginBottom: 14 },
  tab:             { flex: 1, alignItems: "center", paddingTop: 8 },
  tabText:         { fontSize: 15, fontWeight: "600", color: "#9ca3af", paddingBottom: 8 },
  tabTextActive:   { color: BRAND },
  tabUnderline:    { height: 3, alignSelf: "stretch", borderRadius: 2, backgroundColor: "#e5e7eb" },
  tabUnderlineActive: { backgroundColor: BLUE },

  // Timer card
  timerCard:       { borderRadius: 18, padding: 18, marginBottom: 14, shadowColor: BRAND, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  timerTop:        { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: "#86efac" },
  timerLabel:      { fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: "500" },
  timerTime:       { fontSize: 34, fontWeight: "800", color: "#fff", letterSpacing: 1, marginTop: 6 },
  timerTrack:      { height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.25)", marginTop: 12, overflow: "hidden" },
  timerFill:       { height: 4, borderRadius: 2, backgroundColor: "#fff" },

  // Sell / Buy toggle
  modeRow:         { flexDirection: "row", gap: 10 },
  modeChip:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#f0f0f0" },
  modeChipActive:  { backgroundColor: "#EEF3FF", borderColor: BLUE },
  modeText:        { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  modeTextActive:  { color: BLUE },
  modeCaption:     { fontSize: 11, color: "#9ca3af", textAlign: "center", marginTop: 8, marginBottom: 14 },

  // Rates search
  searchBox:       { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#f0f0f0", paddingHorizontal: 12, marginBottom: 12 },
  searchInput:     { flex: 1, fontSize: 14, color: "#111827", paddingVertical: 11 },

  // Rates list
  rateRow:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#f0f0f0", padding: 14, marginBottom: 8 },
  rateLeft:        { flexDirection: "row", alignItems: "center", gap: 12, flexShrink: 1 },
  rateName:        { fontSize: 14, fontWeight: "600", color: "#111827" },
  rateSymbol:      { fontSize: 12, color: "#6b7280", marginTop: 2 },
  rateRight:       { alignItems: "flex-end", marginLeft: 8 },
  rateValue:       { fontSize: 15, fontWeight: "700", color: "#111827" },
  ratePer:         { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  emptyState:      { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText:       { fontSize: 14, color: "#9ca3af" },
  emptyInline:     { fontSize: 12, color: "#9ca3af", textAlign: "center", padding: 16 },

  // Calculator
  calcCard:        { borderWidth: 1, borderColor: "#f0f0f0", borderRadius: 16, overflow: "hidden", backgroundColor: "#fff" },
  calcSection:     { padding: 16 },
  calcRow:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
  calcLabel:       { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  calcInput:       { fontSize: 30, fontWeight: "700", color: "#111827", paddingVertical: 2 },
  pill:            { flexDirection: "row", alignItems: "center", gap: 8, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 24, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: "#fff" },
  pillText:        { fontSize: 15, fontWeight: "600", color: "#111827" },
  nairaDot:        { width: 24, height: 24, borderRadius: 12, backgroundColor: "#16a34a", justifyContent: "center", alignItems: "center" },
  nairaDotText:    { fontSize: 13, fontWeight: "700", color: "#fff" },

  metaSection:     { borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingHorizontal: 16, paddingVertical: 10 },
  metaRow:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8 },
  metaLeft:        { flexDirection: "row", alignItems: "center", gap: 10 },
  metaIcon:        { width: 26, height: 26, borderRadius: 13, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  metaLabel:       { fontSize: 14, color: "#6b7280" },
  metaValue:       { fontSize: 14, fontWeight: "600", color: "#111827", flexShrink: 1, textAlign: "right", marginLeft: 8 },

  freeBadge:       { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#dcfce7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  freeBadgeText:   { fontSize: 13, fontWeight: "800", color: "#16a34a" },

  receiveSection:  { backgroundColor: "#f3f4f6", padding: 16 },
  receiveAmount:   { fontSize: 30, fontWeight: "700", color: "#111827", marginTop: 2 },

  picker:          { marginTop: 10, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", overflow: "hidden" },
  pickerSearchRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  pickerSearchHint:{ flex: 1, fontSize: 11, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 },
  pickerSearchInput:{ flex: 1, fontSize: 13, color: "#111827", paddingVertical: 6 },
  pickerSearchBtn: { padding: 6 },
  pickerItem:      { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  pickerSymbol:    { fontSize: 14, fontWeight: "600", color: "#111827" },
  pickerName:      { fontSize: 11, color: "#6b7280", marginTop: 1 },

  infoBox:         { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#EEF3FF", borderRadius: 14, padding: 14, marginTop: 16 },
  infoText:        { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },
});
