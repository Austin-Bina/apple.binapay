import React, { useState, useMemo, useCallback } from "react";
import {
  View, ScrollView, TouchableOpacity, Image,
  StyleSheet, Switch, Platform, StatusBar,
} from "react-native";
import { Text } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSelector } from "react-redux";
import { useNavigation } from "@react-navigation/native";
import { CryptoProvider, useCrypto } from "@screens/home/CryptoContext";
import { selectNgnUsdtRateWithSpread, selectUser } from "@store/selectors/auth";
import { formattedBalance } from "@utils/transactionutils";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";
import { useFocusEffect } from "@react-navigation/native";
import { useTypedDispatch } from "@store/common";
import { authSliceActions } from "@store/slice/auth";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const LABEL      = "#111827";
const SUBLABEL   = "#6B7280";

const GRAD_START = "#4F46E5";
const GRAD_END   = "#1E3A8A";

const MOCK_SPARKLINE = [0, 5, 3, 8, 6, 12, 9, 15, 11, 18, 14, 20];

const IOS_CARD = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

// ── Sparkline — untouched ─────────────────────────────────────────────────────
function Sparkline({ data, color = "#a5f3fc", width = 120, height = 40 }: {
  data: number[]; color?: string; width?: number; height?: number;
}) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = width / (data.length - 1);
  return (
    <View style={{ width, height, overflow: "hidden" }}>
      {data.slice(0, -1).map((v, i) => {
        const x1 = i * stepX;
        const y1 = height - ((v - min) / range) * (height * 0.8) - height * 0.1;
        const x2 = (i + 1) * stepX;
        const y2 = height - ((data[i + 1] - min) / range) * (height * 0.8) - height * 0.1;
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle  = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        return (
          <View key={i} style={{
            position: "absolute", left: x1, top: y1, width: length, height: 2,
            backgroundColor: color, borderRadius: 1,
            transform: [{ rotate: `${angle}deg` }], transformOrigin: "0 50%",
          }} />
        );
      })}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function AssetsContent() {
  const { assets, totalUsd } = useCrypto();
  const ngnRate    = useSelector(selectNgnUsdtRateWithSpread);
  const user       = useSelector(selectUser);
  const insets     = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch   = useTypedDispatch();

  // ── All original state + derived — untouched ─────────────────────────────
  const [hideSmall,       setHideSmall]       = useState(false);
  const [balanceVisible,  setBalanceVisible]   = useState(true);
  const [currency,        setCurrency]         = useState<"NGN" | "USD">("NGN");

  const totalNgn = useMemo(() => { if (!ngnRate?.sell) return 0; return totalUsd * ngnRate.sell; }, [totalUsd, ngnRate]);
  const nairaBalance  = Number(user?.wallet_balances?.naira?.balance ?? 0);
  const nairaUsd      = nairaBalance / (ngnRate?.sell ?? 1);
  const grandTotalNgn = totalNgn + nairaBalance;
  const grandTotalUsd = totalUsd + nairaUsd;

  const portfolioChange = useMemo(() => {
    const withChange = assets.filter(a => a.price_change_24h != null && (a.balance ?? 0) * (a.price_usd ?? 0) > 0);
    if (!withChange.length) return null;
    const totalWeight = withChange.reduce((acc, a) => acc + (a.balance ?? 0) * (a.price_usd ?? 0), 0);
    const weighted = withChange.reduce((acc, a) => acc + (a.price_change_24h! * ((a.balance ?? 0) * (a.price_usd ?? 0))) / totalWeight, 0);
    return parseFloat(weighted.toFixed(2));
  }, [assets]);

  const portfolioPositive = (portfolioChange ?? 0) >= 0;

  const portfolioSparkline = useMemo(() => {
    const topAsset = [...assets]
      .sort((a, b) => (b.balance ?? 0) * (b.price_usd ?? 0) - (a.balance ?? 0) * (a.price_usd ?? 0))
      .find(a => (a.price_history_24h?.length ?? 0) >= 2);
    return topAsset?.price_history_24h ?? MOCK_SPARKLINE;
  }, [assets]);

  useFocusEffect(useCallback(() => { dispatch(authSliceActions.fetchAppConfig()); }, []));

  const visibleAssets = useMemo(() => {
    if (!hideSmall) return assets;
    return assets.filter(a => (a.balance ?? 0) * (a.price_usd ?? 0) >= 1);
  }, [assets, hideSmall]);

  const handleBuy     = async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Services", params: { screen: "Convert Crypto" } }); };
  const handleSell    = async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Services", params: { screen: "Convert Crypto" } }); };
  const handleDeposit = async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Home", params: { screen: SCREENS.ADD_MONEY, params: { screen: SCREENS.DEPOSIT_CRYPTO } } }); };
  const handleWithdraw = async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Home", params: { screen: SCREENS.WITHDRAW_MONEY, params: { screen: SCREENS.WITHDRAW_CRYPTO } } }); };

  const ACTIONS = [
    { icon: "cash-plus",   label: "Buy",      action: handleBuy      },
    { icon: "cash-minus",  label: "Sell",     action: handleSell     },
    { icon: "arrow-down",  label: "Deposit",  action: handleDeposit  },
    { icon: "arrow-up",    label: "Withdraw", action: handleWithdraw },
  ];

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>My Assets</Text>
          <Text style={s.headerSub}>Your crypto portfolio</Text>
        </View>
        <View style={s.headerRight}>
          <TouchableOpacity style={s.iconBtn} onPress={() => setBalanceVisible(v => !v)} activeOpacity={0.7}>
            <MaterialCommunityIcons name={balanceVisible ? "eye-outline" : "eye-off-outline"} size={20} color={BRAND} />
          </TouchableOpacity>
          <TouchableOpacity style={s.iconBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="magnify" size={20} color={BRAND} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Total Value Card (gradient — kept identical) ── */}
        <LinearGradient colors={[GRAD_START, GRAD_END]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.card}>
          <View style={s.currencyToggle}>
            {(["NGN", "USD"] as const).map(c => (
              <TouchableOpacity key={c} style={[s.toggleBtn, currency === c && s.toggleBtnActive]} onPress={() => setCurrency(c)} activeOpacity={0.8}>
                <Text style={[s.toggleText, currency === c && s.toggleTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.cardLabel}>Total Asset Value</Text>
          <Text style={s.cardBalance}>
            {balanceVisible
              ? currency === "NGN" ? `₦${formattedBalance(grandTotalNgn, "", 2)}` : `$${formattedBalance(grandTotalUsd, "", 2)}`
              : "••••••"}
          </Text>
          <View style={s.sparkRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <MaterialCommunityIcons name={portfolioPositive ? "trending-up" : "trending-down"} size={14} color={portfolioPositive ? "#86efac" : "#fca5a5"} />
              <Text style={[s.changeText, { color: portfolioPositive ? "#86efac" : "#fca5a5" }]}>
                {portfolioChange != null ? `${portfolioPositive ? "+" : ""}${portfolioChange}% Today` : "— Today"}
              </Text>
            </View>
            <Sparkline data={portfolioSparkline} color={portfolioPositive ? "rgba(134,239,172,0.8)" : "rgba(252,165,165,0.8)"} width={100} height={32} />
          </View>
          <View style={s.cardActions}>
            {ACTIONS.map(({ icon, label, action }) => (
              <TouchableOpacity key={label} style={s.cardAction} onPress={action} activeOpacity={0.75}>
                <View style={s.cardActionIcon}>
                  <MaterialCommunityIcons name={icon as any} size={20} color="#fff" />
                </View>
                <Text style={s.cardActionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </LinearGradient>

        {/* ── Asset List ── */}
        <View style={s.listSection}>
          <View style={s.listHeader}>
            <Text style={s.listTitle}>My Assets</Text>
            <View style={s.hideRow}>
              <Text style={s.hideLabel}>Hide small</Text>
              <Switch value={hideSmall} onValueChange={setHideSmall} trackColor={{ true: BRAND, false: SEPARATOR }} thumbColor={SURFACE} />
            </View>
          </View>

          {visibleAssets.length === 0 ? (
            <View style={s.emptyState}>
              <MaterialCommunityIcons name="wallet-outline" size={48} color="#D1D5DB" />
              <Text style={s.emptyText}>No assets to show</Text>
            </View>
          ) : (
            visibleAssets.map((item) => {
              const usdValue   = (item.balance ?? 0) * (item.price_usd ?? 0);
              const ngnValue   = usdValue * (ngnRate?.sell ?? 0);
              const change     = item.price_change_24h ?? null;
              const isPositive = (change ?? 0) >= 0;
              const sparkData  = (item.price_history_24h?.length ?? 0) >= 2 ? item.price_history_24h! : [];

              return (
                <View key={item.id} style={[s.assetRow, IOS_CARD]}>
                  <View style={s.assetLeft}>
                    <Image source={item.icon_url ? { uri: item.icon_url } : require("@assets/images/oops.png")} style={s.assetIcon} resizeMode="contain" />
                    <View>
                      <Text style={s.assetName}>{item.name}</Text>
                      <Text style={s.assetSymbol}>{item.symbol}</Text>
                    </View>
                  </View>
                  <View style={s.assetRight}>
                    <Text style={s.assetBalance}>
                      {balanceVisible ? formattedBalance(item.balance ?? 0, item.symbol, item.decimal_places ?? 8) : "••••"}
                    </Text>
                    <Text style={s.assetValue}>
                      {balanceVisible
                        ? currency === "NGN" ? `₦${formattedBalance(ngnValue, "", 2)}` : `$${formattedBalance(usdValue, "", 2)}`
                        : "••••"}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 }}>
                      {sparkData.length >= 2 && <Sparkline data={sparkData} color={isPositive ? "#16A34A" : "#DC2626"} width={44} height={18} />}
                      <Text style={[s.assetChange, { color: isPositive ? "#16A34A" : "#DC2626" }]}>
                        {change != null ? `${isPositive ? "+" : ""}${change.toFixed(2)}%` : "—"}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* Naira wallet row */}
          <View style={[s.assetRow, IOS_CARD]}>
            <View style={s.assetLeft}>
              <View style={[s.assetIcon, s.nairaIconBg]}>
                <Text style={s.nairaIconText}>₦</Text>
              </View>
              <View>
                <Text style={s.assetName}>Naira</Text>
                <Text style={s.assetSymbol}>NGN</Text>
              </View>
            </View>
            <View style={s.assetRight}>
              <Text style={s.assetBalance}>{balanceVisible ? `₦${formattedBalance(nairaBalance, "", 2)}` : "••••"}</Text>
              <Text style={s.assetValue}>
                {balanceVisible ? currency === "USD" ? `$${formattedBalance(nairaUsd, "", 2)}` : "" : "••••"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

export default function AssetsOverviewScreen() {
  return (
    <CryptoProvider>
      <AssetsContent />
    </CryptoProvider>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  header:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: BG },
  headerTitle:      { fontSize: 24, fontWeight: "800", color: BRAND, letterSpacing: -0.4 },
  headerSub:        { fontSize: 13, color: SUBLABEL, marginTop: 2 },
  headerRight:      { flexDirection: "row", gap: 8 },
  iconBtn:          { width: 38, height: 38, borderRadius: 19, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  card:             { marginHorizontal: 16, marginTop: 8, borderRadius: 20, padding: 20, ...Platform.select({ ios: { shadowColor: BRAND, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 }, android: { elevation: 8 } }) },
  currencyToggle:   { flexDirection: "row", alignSelf: "flex-end", backgroundColor: "rgba(255,255,255,0.15)", borderRadius: 20, padding: 3, marginBottom: 16 },
  toggleBtn:        { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 18 },
  toggleBtnActive:  { backgroundColor: "#fff" },
  toggleText:       { fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: "600" },
  toggleTextActive: { color: BRAND },
  cardLabel:        { fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 },
  cardBalance:      { fontSize: 30, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  sparkRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 20 },
  changeText:       { fontSize: 13, fontWeight: "600" },
  cardActions:      { flexDirection: "row", justifyContent: "space-between" },
  cardAction:       { alignItems: "center", gap: 6 },
  cardActionIcon:   { width: 44, height: 44, borderRadius: 22, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  cardActionLabel:  { fontSize: 12, color: "#fff", fontWeight: "600" },
  listSection:      { paddingHorizontal: 16, marginTop: 20 },
  listHeader:       { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  listTitle:        { fontSize: 17, fontWeight: "700", color: LABEL },
  hideRow:          { flexDirection: "row", alignItems: "center", gap: 8 },
  hideLabel:        { fontSize: 12, color: SUBLABEL },
  assetRow:         { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: SURFACE, borderRadius: 16, padding: 14, marginBottom: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  assetLeft:        { flexDirection: "row", alignItems: "center", gap: 12 },
  assetIcon:        { width: 40, height: 40, borderRadius: 20, backgroundColor: BG },
  assetName:        { fontSize: 14, fontWeight: "600", color: LABEL },
  assetSymbol:      { fontSize: 12, color: SUBLABEL, marginTop: 2 },
  assetRight:       { alignItems: "flex-end" },
  assetBalance:     { fontSize: 14, fontWeight: "600", color: LABEL },
  assetValue:       { fontSize: 12, color: SUBLABEL, marginTop: 2 },
  assetChange:      { fontSize: 12, fontWeight: "600" },
  nairaIconBg:      { justifyContent: "center", alignItems: "center", backgroundColor: "#DCFCE7" },
  nairaIconText:    { fontSize: 18, fontWeight: "700", color: "#16A34A" },
  emptyState:       { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText:        { fontSize: 14, color: "#9CA3AF" },
});
