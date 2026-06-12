import { TransactionEmptyState } from "@components/ui/empty-states/transaction-list";
import TransactionLoader from "@components/ui/loaders/transaction-loader";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { navigateToTransaction } from "@helpers/transaction";
import { useFetchCompleteTransactionsQuery } from "@store/redux-api/accountTransactionsApi";
import { useListAccountsQuery } from "@store/redux-api/accountsApi";
import { WalletTransaction } from "@type/transaction";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import React, { Fragment, useCallback, useMemo, useState } from "react";
import {
  FlatList, Modal, Platform, ScrollView,
  StyleSheet, TouchableOpacity, View,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ActivityIndicator, Divider, Text } from "react-native-paper";
import TransactionRow from "@components/ui/transaction/TransactionRow";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { formatTransactionAmount } from "@utils/transactionutils";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { formattedBalance } from "@utils/transactionutils";
import { LinearGradient } from "expo-linear-gradient";

const BRAND     = "#0d1b4b";
const BRAND_MID = "#1a3a8a";
const BLUE      = "#2563EB";

// ── Category tabs matching the mockup ─────────────────────────────────────
const CATEGORY_TABS = [
  { label: "All",      value: "",                  icon: "view-grid-outline" },
  { label: "Deposit",  value: "naira_deposit",      icon: "arrow-down-circle-outline" },
  { label: "Withdraw", value: "naira_withdrawal",   icon: "arrow-up-circle-outline" },
  { label: "Crypto",   value: "crypto_withdrawal",  icon: "bitcoin" },
  { label: "Bills",    value: "electricity_bill",   icon: "lightning-bolt-outline" },
  { label: "P2P",      value: "p2p_auto_payment",   icon: "swap-horizontal" },
];

const STATUS_FILTERS = [
  { label: "All Status",  value: "" },
  { label: "Successful",  value: "successful" },
  { label: "Processing",  value: "pending" },
  { label: "Failed",      value: "failed" },
];

const ALL_CATEGORY_FILTERS = [
  { label: "All",         value: "" },
  { label: "Deposits",    value: "naira_deposit" },
  { label: "Withdrawals", value: "naira_withdrawal" },
  { label: "Data",        value: "data_purchase" },
  { label: "Airtime",     value: "airtime_purchase" },
  { label: "Electricity", value: "electricity_bill" },
  { label: "Cable",       value: "tv_subscription_change" },
  { label: "Crypto",      value: "crypto_withdrawal" },
  { label: "Conversion",  value: "conversion" },
  { label: "P2P",         value: "p2p_auto_payment" },
];

// ── PDF generator (unchanged) ──────────────────────────────────────────────
const generateHistoryPDF = async (
  transactions: Record<string, WalletTransaction[]>,
  account?: { account_name?: string; account_number?: string; bank_name?: string } | null,
  dateFrom?: Date | null,
  dateTo?: Date | null,
) => {
  const periodLabel = dateFrom && dateTo
    ? `${format(dateFrom, "MMM dd, yyyy")} – ${format(dateTo, "MMM dd, yyyy")}`
    : "All time";

  const accountBlock = account ? `
    <div class="account-box">
      <div class="account-row"><span class="account-label">Account Holder</span><span class="account-value">${account.account_name ?? "—"}</span></div>
      <div class="account-row"><span class="account-label">Bank</span><span class="account-value">${account.bank_name ?? "—"}</span></div>
      <div class="account-row"><span class="account-label">Account Number</span><span class="account-value">${account.account_number ?? "—"}</span></div>
      <div class="account-row"><span class="account-label">Period</span><span class="account-value">${periodLabel}</span></div>
    </div>
  ` : `<div class="account-box"><div class="account-row"><span class="account-label">Period</span><span class="account-value">${periodLabel}</span></div></div>`;

  const rows = Object.entries(transactions).map(([group, txs]) => {
    const groupHeader = `<tr><td colspan="3" style="background:#f3f4f6;padding:8px 12px;font-weight:700;font-size:12px;color:#6b7280;">${group}</td></tr>`;
    const txRows = txs.map(tx => `
      <tr>
        <td style="padding:10px 12px;font-size:12px;color:#111;">${tx.meta?.description ?? "—"}</td>
        <td style="padding:10px 12px;font-size:12px;color:#6b7280;">${format(new Date(tx.created_at), "MMM dd, yyyy h:mm a")}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:right;font-weight:600;color:${tx.type === "deposit" ? "#16a34a" : "#dc2626"};">${formatTransactionAmount(tx)}</td>
      </tr>
    `).join("");
    return groupHeader + txRows;
  }).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>
    * { box-sizing:border-box;margin:0;padding:0; }
    body { font-family:Arial,sans-serif;padding:24px;color:#111; }
    .header { text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #0d1b4b; }
    .logo-text { font-size:22px;font-weight:800;color:#0d1b4b; }
    .subtitle { font-size:12px;color:#6b7280;margin-top:4px; }
    .account-box { background:#f8f9fb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:20px; }
    .account-row { display:flex;justify-content:space-between;padding:4px 0;font-size:12px; }
    .account-label { color:#6b7280; } .account-value { font-weight:600;color:#111; }
    table { width:100%;border-collapse:collapse; }
    th { background:#0d1b4b;color:#fff;padding:10px 12px;font-size:12px;text-align:left; }
    tr:nth-child(even) td { background:#f9fafb; }
    td { border-bottom:1px solid #f0f0f0; }
    .footer { margin-top:24px;text-align:center;font-size:11px;color:#9ca3af; }
  </style></head><body>
  <div class="header"><div class="logo-text">BinaPay</div>
  <div class="subtitle">Transaction History — Generated ${format(new Date(), "MMM dd, yyyy h:mm a")}</div></div>
  ${accountBlock}
  <table><thead><tr><th>Description</th><th>Date</th><th style="text-align:right;">Amount</th></tr></thead>
  <tbody>${rows}</tbody></table>
  <div class="footer">© ${new Date().getFullYear()} BinaPay Financial Services</div>
  </body></html>`;

  const { uri } = await Print.printToFileAsync({ html });
  await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
};

// ── Main Screen ────────────────────────────────────────────────────────────
export default function TransactionHistoryScreen({ navigation: navProp }: any) {
  const insets     = useSafeAreaInsets();
  const navigation = navProp ?? useNavigation();
  const user       = useSelector(selectUser);

  // Check if we're inside a stack (has a back button) or used as tab
  const canGoBack  = navigation?.canGoBack?.() ?? false;

  const [isProcessing, setIsProcessing]     = useState(false);
  const [isDownloading, setIsDownloading]   = useState(false);
  const [page, setPage]                     = useState(1);
  const [activeTab, setActiveTab]           = useState("");       // category tab
  const [activeCategory, setActiveCategory] = useState("");       // filter sheet category
  const [activeStatus, setActiveStatus]     = useState("");
  const [showFilters, setShowFilters]       = useState(false);
  const [dateFrom, setDateFrom]             = useState<Date | null>(null);
  const [dateTo, setDateTo]                 = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker]     = useState(false);

  const { data: queryData, isLoading, isFetching, refetch } =
    useFetchCompleteTransactionsQuery({ page });

  const { data: accountsData } = useListAccountsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });
  const firstAccount = accountsData?.accounts?.[0] ?? null;

  const nairaBalance  = user?.wallet_balances?.naira?.balance  ?? "0";
  const cryptoBalance = user?.wallet_balances?.crypto_usd?.balance ?? "0";

  const transactionsData = useMemo(() => {
    if (!queryData) return { transactions: {}, meta: { has_more: false } };
    return queryData;
  }, [queryData]);

  // Effective category = tab OR filter sheet selection
  const effectiveCategory = activeCategory || activeTab;

  const filteredTransactions = useMemo(() => {
    const hasFilter = effectiveCategory || activeStatus || dateFrom || dateTo;
    if (!hasFilter) return transactionsData.transactions;

    const result: Record<string, WalletTransaction[]> = {};
    Object.entries(transactionsData.transactions).forEach(([group, txs]) => {
      const filtered = txs.filter(tx => {
        const form = tx.meta?.form ?? "";
        const matchCategory = !effectiveCategory || form === effectiveCategory ||
          (effectiveCategory === "tv_subscription_change" &&
            (form === "tv_subscription_change" || form === "tv_subscription_renew")) ||
          (effectiveCategory === "crypto_withdrawal" &&
            (form === "crypto_withdrawal" || form === "crypto_deposit"));

        let txStatus = "successful";
        if (tx.payment_transaction?.utilityTransaction?.status) {
          txStatus = tx.payment_transaction.utilityTransaction.status.toLowerCase();
        }
        const matchStatus = !activeStatus || txStatus === activeStatus;

        let matchDate = true;
        if (dateFrom || dateTo) {
          try {
            const txDate = new Date(tx.created_at);
            if (dateFrom && dateTo) {
              matchDate = isWithinInterval(txDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
            } else if (dateFrom) {
              matchDate = txDate >= startOfDay(dateFrom);
            } else if (dateTo) {
              matchDate = txDate <= endOfDay(dateTo);
            }
          } catch { matchDate = true; }
        }

        return matchCategory && matchStatus && matchDate;
      });
      if (filtered.length > 0) result[group] = filtered;
    });
    return result;
  }, [transactionsData.transactions, effectiveCategory, activeStatus, dateFrom, dateTo]);

  const onEndReached = useCallback(() => {
    if (!isFetching && transactionsData.meta.has_more) setPage(p => p + 1);
  }, [isFetching, transactionsData]);

  const onSelectTransaction = async (item: WalletTransaction) => {
    navigateToTransaction({
      transactionId: item.id,
      onStart:  () => setIsProcessing(true),
      onFinish: () => setIsProcessing(false),
    });
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      await generateHistoryPDF(filteredTransactions, firstAccount, dateFrom, dateTo);
    } catch (e) { console.error("PDF failed", e); }
    finally { setIsDownloading(false); }
  };

  const clearDateRange = () => { setDateFrom(null); setDateTo(null); };
  const activeFilterCount = [activeCategory, activeStatus, dateFrom || dateTo ? "date" : ""].filter(Boolean).length;
  const formatDateLabel = (d: Date | null) => d ? format(d, "MMM dd, yyyy") : "Select";

  // Total transaction count across all groups
  const totalCount = Object.values(filteredTransactions).reduce((acc, txs) => acc + txs.length, 0);

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          {canGoBack && (
            <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
            </TouchableOpacity>
          )}
          <View>
            <Text style={s.headerTitle}>Transaction History</Text>
            <Text style={s.headerSub}>Track all your account activities</Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <TouchableOpacity
            style={[s.headerBtn, activeFilterCount > 0 && s.headerBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            <MaterialCommunityIcons
              name="filter-variant"
              size={18}
              color={activeFilterCount > 0 ? "#fff" : BRAND}
            />
            {activeFilterCount > 0 && (
              <View style={s.filterBadge}>
                <Text style={s.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={s.headerBtn} onPress={handleDownload} disabled={isDownloading}>
            {isDownloading
              ? <ActivityIndicator size={16} color={BRAND} />
              : <MaterialCommunityIcons name="download-outline" size={18} color={BRAND} />
            }
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Category tabs ── */}
      <View style={s.tabsWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabsScroll}
        >
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value}
                style={[s.tab, isActive && s.tabActive]}
                onPress={() => { setActiveTab(tab.value); setActiveCategory(""); }}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name={tab.icon as any}
                  size={16}
                  color={isActive ? "#fff" : "#6b7280"}
                />
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Filter row: Date Range + All Status + Export ── */}
      <View style={s.filterRow}>
        <TouchableOpacity style={s.filterPill} onPress={() => setShowFilters(true)}>
          <MaterialCommunityIcons name="calendar-outline" size={14} color={BRAND_MID} />
          <Text style={s.filterPillText}>
            {dateFrom || dateTo
              ? `${dateFrom ? format(dateFrom, "MMM dd") : "..."} – ${dateTo ? format(dateTo, "MMM dd") : "..."}`
              : "Date Range"}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color={BRAND_MID} />
        </TouchableOpacity>

        <TouchableOpacity style={s.filterPill} onPress={() => setShowFilters(true)}>
          <Text style={s.filterPillText}>
            {activeStatus
              ? STATUS_FILTERS.find(f => f.value === activeStatus)?.label
              : "All Status"}
          </Text>
          <MaterialCommunityIcons name="chevron-down" size={14} color={BRAND_MID} />
        </TouchableOpacity>

        <TouchableOpacity style={s.exportBtn} onPress={handleDownload} disabled={isDownloading}>
          {isDownloading
            ? <ActivityIndicator size={14} color={BLUE} />
            : <MaterialCommunityIcons name="export-variant" size={14} color={BLUE} />
          }
          <Text style={s.exportBtnText}>Export</Text>
        </TouchableOpacity>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={{ padding: 16 }}>
          <TransactionLoader groups={["Today", "Yesterday"]} />
        </View>
      ) : Object.keys(filteredTransactions).length === 0 ? (
        <TransactionEmptyState />
      ) : (
        <FlatList
          keyExtractor={([group]) => group}
          data={Object.entries(filteredTransactions)}
          renderItem={({ item: [group, transactions] }) => (
            <View style={s.group}>
              <View style={s.groupHeaderRow}>
                <Text style={s.groupLabel}>{group}</Text>
                <Text style={s.groupCount}>{transactions.length} Transaction{transactions.length !== 1 ? "s" : ""}</Text>
              </View>
              <View style={s.groupCard}>
                {transactions.map((transaction, index) => (
                  <Fragment key={transaction.id}>
                    <TransactionRow
                      transaction={transaction}
                      onPress={() => onSelectTransaction(transaction)}
                    />
                    {index !== transactions.length - 1 && (
                      <Divider style={{ marginHorizontal: 16 }} />
                    )}
                  </Fragment>
                ))}
              </View>
            </View>
          )}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshing={false}
          onRefresh={refetch}
          onEndReachedThreshold={0.5}
          onEndReached={onEndReached}
          ListFooterComponent={() => (
            <View style={s.footerRow}>
              {transactionsData.meta.has_more
                ? <View style={s.loadingMore}>
                    <ActivityIndicator size="small" color="#9ca3af" />
                    <Text style={s.loadingText}>Loading more...</Text>
                  </View>
                : <Text style={s.allLoadedText}>All transactions loaded 🎉</Text>
              }
            </View>
          )}
        />
      )}

      {/* ── Filter sheet ── */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowFilters(false)} />
        <View style={[s.filterSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.filterHandle} />
          <Text style={s.filterTitle}>Filter Transactions</Text>

          <Text style={s.filterSectionLabel}>Date Range</Text>
          <View style={s.dateRow}>
            <View style={s.dateField}>
              <Text style={s.dateFieldLabel}>From</Text>
              <TouchableOpacity style={s.datePicker} onPress={() => setShowFromPicker(true)}>
                <MaterialCommunityIcons name="calendar-outline" size={15} color={BRAND_MID} />
                <Text style={[s.datePickerText, !dateFrom && s.datePickerPlaceholder]}>
                  {formatDateLabel(dateFrom)}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={s.dateSeparator} />
            <View style={s.dateField}>
              <Text style={s.dateFieldLabel}>To</Text>
              <TouchableOpacity style={s.datePicker} onPress={() => setShowToPicker(true)}>
                <MaterialCommunityIcons name="calendar-outline" size={15} color={BRAND_MID} />
                <Text style={[s.datePickerText, !dateTo && s.datePickerPlaceholder]}>
                  {formatDateLabel(dateTo)}
                </Text>
              </TouchableOpacity>
            </View>
            {(dateFrom || dateTo) && (
              <TouchableOpacity onPress={clearDateRange} style={s.clearDateBtn}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          <Text style={s.filterSectionLabel}>Category</Text>
          <View style={s.filterOptions}>
            {ALL_CATEGORY_FILTERS.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[s.filterChip, activeCategory === f.value && s.filterChipActive]}
                onPress={() => { setActiveCategory(f.value); setActiveTab(""); }}
              >
                <Text style={[s.filterChipText, activeCategory === f.value && s.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.filterSectionLabel}>Status</Text>
          <View style={s.filterOptions}>
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity
                key={f.value}
                style={[s.filterChip, activeStatus === f.value && s.filterChipActive]}
                onPress={() => setActiveStatus(f.value)}
              >
                <Text style={[s.filterChipText, activeStatus === f.value && s.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.filterActions}>
            <TouchableOpacity
              style={s.clearBtn}
              onPress={() => { setActiveCategory(""); setActiveStatus(""); clearDateRange(); setShowFilters(false); }}
            >
              <Text style={s.clearBtnText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.applyBtn} onPress={() => setShowFilters(false)}>
              <Text style={s.applyBtnText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {showFromPicker && (
        <DateTimePicker
          value={dateFrom ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          maximumDate={dateTo ?? new Date()}
          onChange={(_, date) => {
            if (date) setDateFrom(date);
            if (Platform.OS === "android") setShowFromPicker(false);
          }}
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={dateTo ?? new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={dateFrom ?? undefined}
          maximumDate={new Date()}
          onChange={(_, date) => {
            if (date) setDateTo(date);
            if (Platform.OS === "android") setShowToPicker(false);
          }}
        />
      )}

      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#f8f9fb" },

  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  headerLeft:     { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  backBtn:        { width: 34, height: 34, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:    { fontSize: 16, fontWeight: "800", color: BRAND },
  headerSub:      { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  headerActions:  { flexDirection: "row", gap: 8 },
  headerBtn:      { width: 36, height: 36, borderRadius: 11, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerBtnActive:{ backgroundColor: BRAND_MID },
  filterBadge:    { position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: 8, backgroundColor: "#dc2626", justifyContent: "center", alignItems: "center" },
  filterBadgeText:{ fontSize: 9, color: "#fff", fontWeight: "700" },

  balanceCard:    { marginHorizontal: 16, marginTop: 14, borderRadius: 18, padding: 18 },
  balanceCardInner:{ flexDirection: "row", alignItems: "center", gap: 14 },
  walletIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" },
  balanceCardLabel:{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginBottom: 4 },
  balanceCardAmount:{ fontSize: 22, fontWeight: "800", color: "#fff" },
  balanceCardUsd: { fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 4 },
  accountDetailsBtn:{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)" },
  accountDetailsBtnText:{ fontSize: 11, color: "#fff", fontWeight: "600" },

  tabsWrap:       { backgroundColor: "#fff", marginTop: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  tabsScroll:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab:            { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  tabActive:      { backgroundColor: BRAND, borderColor: BRAND },
  tabText:        { fontSize: 13, fontWeight: "600", color: "#6b7280" },
  tabTextActive:  { color: "#fff" },

  filterRow:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  filterPill:     { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: "#e5e7eb" },
  filterPillText: { fontSize: 12, color: BRAND_MID, fontWeight: "600" },
  exportBtn:      { flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" as any },
  exportBtnText:  { fontSize: 13, color: BLUE, fontWeight: "700" },

  list:           { padding: 16, gap: 16, paddingBottom: 40 },
  group:          { gap: 8 },
  groupHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4 },
  groupLabel:     { fontSize: 13, fontWeight: "700", color: "#374151" },
  groupCount:     { fontSize: 12, color: "#9ca3af" },
  groupCard:      { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#f0f0f0" },

  footerRow:      { paddingVertical: 16, alignItems: "center" },
  loadingMore:    { flexDirection: "row", gap: 8, alignItems: "center" },
  loadingText:    { fontSize: 13, color: "#9ca3af" },
  allLoadedText:  { fontSize: 13, color: "#9ca3af" },

  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  filterSheet:    { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  filterHandle:   { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 16 },
  filterTitle:    { fontSize: 17, fontWeight: "700", color: BRAND, marginBottom: 20 },
  filterSectionLabel: { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  dateRow:        { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 20 },
  dateField:      { flex: 1, gap: 4 },
  dateFieldLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  datePicker:     { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, borderWidth: 1, borderColor: "#e5e7eb" },
  datePickerText: { fontSize: 13, color: BRAND, fontWeight: "600", flex: 1 },
  datePickerPlaceholder: { color: "#9ca3af", fontWeight: "400" },
  dateSeparator:  { width: 16, height: 1, backgroundColor: "#d1d5db", marginTop: 18 },
  clearDateBtn:   { padding: 4, marginTop: 14 },
  filterOptions:  { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 },
  filterChip:     { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  filterChipActive: { backgroundColor: BRAND, borderColor: BRAND },
  filterChipText: { fontSize: 13, color: "#374151", fontWeight: "500" },
  filterChipTextActive: { color: "#fff" },
  filterActions:  { flexDirection: "row", gap: 12, marginTop: 4 },
  clearBtn:       { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", alignItems: "center" },
  clearBtnText:   { fontSize: 14, fontWeight: "600", color: "#374151" },
  applyBtn:       { flex: 2, paddingVertical: 12, borderRadius: 12, backgroundColor: BRAND, alignItems: "center" },
  applyBtnText:   { fontSize: 14, fontWeight: "700", color: "#fff" },
});
