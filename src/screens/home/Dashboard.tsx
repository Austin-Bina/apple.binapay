import React, { Fragment, useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  Pressable, RefreshControl, TouchableOpacity, View,
  StyleSheet, FlatList, Platform, StatusBar,
} from "react-native";
import { Text, Divider } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import { HomeStackScreenProps } from "@navigators/types";
import UserAppbar from "@components/UserAppbar";
import { getNavigate } from "@utils/navigation";
import Banner from "@components/ui/banner";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { formatToNaira } from "@utils/money";
import {
  selectHasFetchError,
  selectIsAccountVerified,
  selectIsFetchingProfile,
  selectUser,
} from "@store/selectors/auth";
import {
  accountTransactionsApi,
  useFetchRecentTransactionsQuery,
} from "@store/redux-api/accountTransactionsApi";
import { TransactionEmptyState } from "@components/ui/empty-states/transaction-list";
import TransactionLoader from "@components/ui/loaders/transaction-loader";
import * as Ably from "ably";
import { AccountUpdateEventPayload } from "@type/event";
import { authSliceActions } from "@store/slice/auth";
import API from "@lib/api";
import { route } from "@helpers/route";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { useNotificationsPrefetch } from "@store/redux-api/notificationApi";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SCREENS } from "@constants/screens";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { navigateToTransaction } from "@helpers/transaction";
import TransactionRow from "@components/ui/transaction/TransactionRow";
import { formattedBalance } from "@utils/transactionutils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CryptoProvider } from "./CryptoContext";
import FundAccountSheet from "@components/ui/modals/fund-account";
import { WalletTransaction } from "@type/transaction";
import tw from "@lib/tailwind";

// ─── Tokens ──────────────────────────────────────────────────────────────────
const BRAND          = "#1E3A8A";
const GRADIENT_START = "#2563EB";
const GRADIENT_END   = "#1E3A8A";
const BG             = "#F2F2F7";   // iOS systemGroupedBackground
const SURFACE        = "#FFFFFF";
const SEPARATOR      = "#E5E7EB";
const LABEL          = "#111827";
const SUBLABEL       = "#6B7280";
const BLUE_LIGHT     = "#EEF3FF";

const IOS_CARD_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

type Props = HomeStackScreenProps<typeof SCREENS.DASHBOARD>;

// =============================================================================
export default function HomeScreen({ navigation }: Props) {
  // ── All original state + logic — untouched ────────────────────────────────
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [loaderMode, setLoaderMode]         = useState<"none" | "profile" | "action">("none");

  const user            = useTypedSelector(selectUser);
  const isVerified      = useTypedSelector(selectIsAccountVerified);
  const hasProfileError = useTypedSelector(selectHasFetchError);
  const dispatch        = useTypedDispatch();
  const insets          = useSafeAreaInsets();
  const [showFundSheet, setShowFundSheet] = useState(false);

  const prefetchSettings      = useSystemSettingsPrefetch("getSystemSettings", { ifOlderThan: MAX_CACHE_AGE_SEC });
  const prefetchNotifications = useNotificationsPrefetch("fetchNotifications", { ifOlderThan: 5 });
  const syncIntervalRef       = useRef<ReturnType<typeof setInterval> | null>(null);

  const nairaWalletBalance = user?.wallet_balances?.naira?.balance   ?? "0";
  const cryptoUsdBalance   = user?.wallet_balances?.crypto_usd?.balance ?? 0;

  const initCable = useCallback(() => {
    if (!user?.id) return;
    const client = new Ably.Realtime({
      authCallback: async (tokenParams, callback) => {
        try {
          const response = await API.get(route("auth.getAblyToken"), { params: tokenParams });
          callback(null, response.data.token);
        } catch (err: any) {
          callback(err, null);
          if (err.response?.status === 401) dispatch(authSliceActions.logout());
        }
      },
      authParams: { client: "mobile" },
    });

    const channel = client.channels.get(`private:user-updates.${user.id}`);
    channel.attach().then(() => {
      channel.subscribe((message: Ably.Message) => {
        const { name, data } = message;
        if (name === "account.updated") {
          const { payload } = data as AccountUpdateEventPayload;
          if (payload.account?.user) dispatch(authSliceActions.updateUser(payload.account.user));
          if (payload.refreshFlags?.transactions) {
            dispatch(accountTransactionsApi.util.invalidateTags(["Transactions Summary"]));
          }
        }
      });
    }).catch(console.log);
  }, [user?.id]);

  const initProfile = useCallback(async () => {
    await dispatch(authSliceActions.fetchUserProfile());
    prefetchNotifications({ page: 1 });
    prefetchSettings();
  }, [dispatch]);

  const isMounted = useRef(false);

  useEffect(() => {
    if (!user?.id || isMounted.current) return;
    isMounted.current = true;

    let mounted = true;
    const initialize = async () => {
      setLoaderMode("action");
      try {
        await initProfile();
        initCable();
        dispatch(authSliceActions.fetchAppConfig());
        dispatch(authSliceActions.fetchUserProfileSilent());
        syncIntervalRef.current = setInterval(() => {
          dispatch(authSliceActions.fetchAppConfig());
          dispatch(authSliceActions.fetchUserProfileSilent());
        }, 60000);
      } finally {
        if (mounted) setLoaderMode("none");
      }
    };

    initialize();
    return () => {
      mounted = false;
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [user?.id]);

  const onRefresh = async () => {
    if (loaderMode !== "none") return;
    setLoaderMode("profile");
    try { await initProfile(); }
    finally { setLoaderMode("none"); }
  };

  const handleVerifyAccount = async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.MAIN, {
      screen: SCREENS.MENU,
      params: { screen: SCREENS.VERIFY_ACCOUNT, params: { screen: SCREENS.VERIFICATION_HUB } },
    });
  };

  // ── Quick actions — untouched ────────────────────────────────────────────
  const quickActions = [
    { icon: "phone",        label: "Airtime", onPress: async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Services", params: { screen: "Airtime Purchase" } }); } },
    { icon: "wifi",         label: "Data",    onPress: async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Services", params: { screen: "Data Purchase" } }); } },
    { icon: "lightning-bolt",label: "Bills",  onPress: async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Services", params: { screen: "Electricity Bill" } }); } },
    { icon: "dots-grid",    label: "More",    onPress: async () => { const { navigate } = await getNavigate(); navigate("Main", { screen: "Services", params: { screen: "List" } }); } },
  ];

  // ── FlatList header ────────────────────────────────────────────────────────
  const renderHeader = () => (
    <View>
      {/* ── Balance card (gradient — same design as AssetsOverview) ── */}
      <LinearGradient
        colors={[GRADIENT_START, GRADIENT_END]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.card}>

        {/* Top row: label + eye toggle */}
        <View style={s.cardTopRow}>
          <Text style={s.cardLabel}>Available Balance</Text>
          <TouchableOpacity onPress={() => setBalanceVisible(v => !v)} style={s.eyeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialCommunityIcons
              name={balanceVisible ? "eye-outline" : "eye-off-outline"}
              size={20}
              color="rgba(255,255,255,0.8)"
            />
          </TouchableOpacity>
        </View>

        {/* Primary balance */}
        <Text style={s.balanceText}>
          {balanceVisible ? formatToNaira(nairaWalletBalance) : "₦ ••••••"}
        </Text>

        {/* USD wallet + Account Details */}
        <View style={s.cardMidRow}>
          <View>
            <Text style={s.usdLabel}>USD Wallet</Text>
            <Text style={s.usdValue}>
              {balanceVisible ? `$${formattedBalance(cryptoUsdBalance, "", 2)}` : "$ ••••"}
            </Text>
          </View>
          <TouchableOpacity
            style={s.accountDetailsBtn}
            onPress={() => navigation.navigate(SCREENS.ADD_MONEY, { screen: SCREENS.FUND_WITH_BANK })}
            activeOpacity={0.8}>
            <MaterialCommunityIcons name="content-copy" size={13} color="#fff" />
            <Text style={s.accountDetailsBtnText}>Account Details</Text>
          </TouchableOpacity>
        </View>

        {/* Action buttons */}
        <View style={s.cardActions}>
          <TouchableOpacity
            style={s.cardActionBtn}
            onPress={() => navigation.navigate(SCREENS.WITHDRAW_MONEY, { screen: SCREENS.WITHDRAW_NAIRA })}
            activeOpacity={0.85}>
            <MaterialCommunityIcons name="send" size={18} color={GRADIENT_START} />
            <Text style={s.cardActionText}>Send Money</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.cardActionBtn}
            onPress={() => setShowFundSheet(true)}
            activeOpacity={0.85}>
            <MaterialCommunityIcons name="plus" size={18} color={GRADIENT_START} />
            <Text style={s.cardActionText}>Add Money</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Banners ── */}
      <View style={s.bannerWrap}>
        {hasProfileError && (
          <Pressable onPress={onRefresh} style={s.bannerItem}>
            <Banner title="Network Error" content="We couldn't load your account details. Tap to retry." />
          </Pressable>
        )}
        {!isVerified && (
          <Pressable onPress={handleVerifyAccount} style={s.bannerItem}>
            <Banner title="Account Verification" content="Verify your account to unlock all features." />
          </Pressable>
        )}
      </View>

      {/* ── Quick Actions ── */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={s.seeAll}>Edit</Text>
          </TouchableOpacity>
        </View>
        {/* iOS grouped card for quick actions */}
        <View style={[s.quickActionsCard, IOS_CARD_SHADOW]}>
          {quickActions.map((action, i) => (
            <React.Fragment key={action.label}>
              {i > 0 && <View style={s.quickActionDivider} />}
              <TouchableOpacity style={s.quickAction} onPress={action.onPress} activeOpacity={0.7}>
                <View style={s.quickActionIcon}>
                  <MaterialCommunityIcons name={action.icon as any} size={22} color={GRADIENT_START} />
                </View>
                <Text style={s.quickActionLabel}>{action.label}</Text>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Recent Transactions header ── */}
      <View style={[s.sectionHeader, s.txHeader]}>
        <Text style={s.sectionTitle}>Recent Transactions</Text>
        <TouchableOpacity onPress={() => navigation.navigate("Transaction History", {})} activeOpacity={0.7}>
          <Text style={s.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <CryptoProvider>
      <View style={[s.root, { paddingTop: insets.top }]}>
        <StatusBar barStyle="dark-content" />
        <UserAppbar />
        <RecentTransactions
          navigation={navigation}
          renderHeader={renderHeader}
          refreshing={loaderMode === "profile"}
          onRefresh={onRefresh}
        />
      </View>

      <FundAccountSheet
        show={showFundSheet}
        hide={() => setShowFundSheet(false)}
        navigation={{
          handleDepositCrypto: () => {
            setShowFundSheet(false);
            setTimeout(() => navigation.navigate(SCREENS.ADD_MONEY, { screen: SCREENS.DEPOSIT_CRYPTO }), 200);
          },
          handleFundWithBank: () => {
            setShowFundSheet(false);
            setTimeout(() => navigation.navigate(SCREENS.ADD_MONEY, { screen: SCREENS.FUND_WITH_BANK }), 200);
          },
        }}
      />
    </CryptoProvider>
  );
}

// =============================================================================
// RecentTransactions — all logic untouched
// =============================================================================
type RecentTransactionsProps = {
  navigation: any;
  renderHeader: () => React.ReactElement;
  refreshing: boolean;
  onRefresh: () => void;
};

const RecentTransactions: React.FC<RecentTransactionsProps> = ({
  navigation, renderHeader, refreshing, onRefresh,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: queryData, isLoading } = useFetchRecentTransactionsQuery(undefined, { refetchOnFocus: true });
  const { transactions = {} } = queryData || {};

  const onTransactionPress = async (transactionId: string | number) => {
    navigateToTransaction({
      transactionId,
      onStart: () => setIsProcessing(true),
      onFinish: () => setIsProcessing(false),
    });
  };

  type TransactionItem =
    | { key: string; type: "loader" }
    | { key: string; type: "empty" }
    | { key: string; type: "group"; group: string; txs: WalletTransaction[] };

  const transactionContent = useMemo((): TransactionItem[] => {
    if (isLoading) return [{ key: "loader", type: "loader" }];
    if (!transactions || Object.entries(transactions).length === 0) {
      return [{ key: "empty", type: "empty" }];
    }
    return Object.entries(transactions).map(([group, txs]) => ({
      key: group, type: "group" as const, group, txs,
    }));
  }, [transactions, isLoading]);

  return (
    <>
      <FlatList<TransactionItem>
        data={transactionContent}
        keyExtractor={(item) => item.key}
        ListHeaderComponent={renderHeader}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={GRADIENT_START} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          if (item.type === "loader") return <View style={tw`px-4`}><TransactionLoader groups={["Today"]} /></View>;
          if (item.type === "empty")  return <View style={tw`px-4`}><TransactionEmptyState /></View>;
          if (item.type === "group") {
            return (
              <View style={s.txGroupWrap}>
                <Text style={s.groupLabel}>{item.group}</Text>
                <View style={[s.groupCard, IOS_CARD_SHADOW]}>
                  {item.txs.map((transaction, index) => (
                    <Fragment key={transaction.id}>
                      <TransactionRow
                        transaction={transaction}
                        compact
                        onPress={() => onTransactionPress(transaction.id)}
                      />
                      {index !== item.txs.length - 1 && (
                        <View style={s.txDivider} />
                      )}
                    </Fragment>
                  ))}
                </View>
              </View>
            );
          }
          return null;
        }}
      />
      <PleaseWaitModal visible={isProcessing} />
    </>
  );
};

// =============================================================================
const s = StyleSheet.create({
  root:                 { flex: 1, backgroundColor: BG },

  // ── Balance card ─────────────────────────────────────────────────────────
  card: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 22,
    padding: 20,
    ...Platform.select({
      ios:     { shadowColor: BRAND, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16 },
      android: { elevation: 8 },
    }),
  },
  cardTopRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardLabel:            { fontSize: 13, color: "rgba(255,255,255,0.75)", fontWeight: "500" },
  eyeBtn:               { padding: 4 },
  balanceText:          { fontSize: 32, fontWeight: "800", color: "#fff", letterSpacing: -0.5, marginBottom: 4 },
  cardMidRow:           { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 6, marginBottom: 20 },
  usdLabel:             { fontSize: 12, color: "rgba(255,255,255,0.65)" },
  usdValue:             { fontSize: 16, color: "#fff", fontWeight: "600", marginTop: 2 },
  accountDetailsBtn:    { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  accountDetailsBtnText:{ fontSize: 12, color: "#fff", fontWeight: "600" },
  cardActions:          { flexDirection: "row", gap: 12 },
  cardActionBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#fff", paddingVertical: 13, borderRadius: 13 },
  cardActionText:       { fontSize: 14, fontWeight: "700", color: BRAND },

  // ── Banners ───────────────────────────────────────────────────────────────
  bannerWrap:           { paddingHorizontal: 16 },
  bannerItem:           { marginTop: 12 },

  // ── Sections ─────────────────────────────────────────────────────────────
  section:              { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader:        { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle:         { fontSize: 16, fontWeight: "700", color: LABEL },
  seeAll:               { fontSize: 13, color: GRADIENT_START, fontWeight: "600" },

  // ── Quick actions — iOS grouped card style ────────────────────────────────
  quickActionsCard:     { flexDirection: "row", backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  quickAction:          { flex: 1, alignItems: "center", paddingVertical: 16, gap: 6 },
  quickActionDivider:   { width: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, alignSelf: "stretch" },
  quickActionIcon:      { width: 48, height: 48, borderRadius: 14, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  quickActionLabel:     { fontSize: 12, color: "#374151", fontWeight: "500" },

  // ── Transaction list ──────────────────────────────────────────────────────
  txHeader:             { paddingHorizontal: 16, marginTop: 8 },
  txGroupWrap:          { paddingHorizontal: 16, marginBottom: 12 },
  groupLabel:           { fontSize: 12, fontWeight: "700", color: SUBLABEL, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 8, paddingHorizontal: 2 },
  groupCard:            { backgroundColor: SURFACE, borderRadius: 16, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR },
  txDivider:            { height: StyleSheet.hairlineWidth, backgroundColor: SEPARATOR, marginLeft: 64 },
});
