import { TransactionEmptyState } from "@components/ui/empty-states/transaction-list";
import TransactionLoader from "@components/ui/loaders/transaction-loader";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { navigateToTransaction } from "@helpers/transaction";
import {
  useFetchCompleteTransactionsQuery,
  useFetchTransactionSummaryQuery,
} from "@store/redux-api/accountTransactionsApi";
import { useListAccountsQuery } from "@store/redux-api/accountsApi";
import { WalletTransaction } from "@type/transaction";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import React, { Fragment, useCallback, useMemo, useState } from "react";
import {
  FlatList, Modal, ScrollView,
  StyleSheet, TouchableOpacity, View, TextInput,
} from "react-native";
import { ActivityIndicator, Divider, Text } from "react-native-paper";
import TransactionRow from "@components/ui/transaction/TransactionRow";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import { formatTransactionAmount } from "@utils/transactionutils";
import { useNavigation } from "@react-navigation/native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SCREENS } from "@constants/screens";

const BRAND     = "#0d1b4b";
const BRAND_MID = "#1a3a8a";
const BLUE      = "#2563EB";

const CATEGORY_TABS = [
  { label: "All",           value: "",                  icon: "view-grid-outline" },
  { label: "Money Transfer",value: "naira_withdrawal",  icon: "bank-transfer" },
  { label: "Crypto",        value: "crypto_withdrawal", icon: "bitcoin" },
  { label: "Bills",         value: "electricity_bill",  icon: "lightning-bolt-outline" },
  { label: "Data",          value: "data_purchase",     icon: "wifi" },
  { label: "Airtime",       value: "airtime_purchase",  icon: "phone-outline" },
];

const STATUS_FILTERS = [
  { label: "All Status", value: "" },
  { label: "Successful", value: "successful" },
  { label: "Processing", value: "pending" },
  { label: "Failed",     value: "failed" },
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

const PERIOD_OPTIONS = [
  { label: "This Month", value: "month" },
  { label: "This Week",  value: "week" },
  { label: "Today",      value: "today" },
  { label: "All Time",   value: "all" },
];

// ── Modal date picker (no-close-on-iOS issue fixed) ───────────────────────────
function DatePickerModal({
  visible, value, title, minimumDate, maximumDate, onConfirm, onClose,
}: {
  visible: boolean; value: Date; title: string;
  minimumDate?: Date; maximumDate?: Date;
  onConfirm: (d: Date) => void; onClose: () => void;
}) {
  const [tempDate, setTempDate] = useState(value);
  React.useEffect(() => { if (visible) setTempDate(value); }, [visible]);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={dp.overlay} activeOpacity={1} onPress={onClose} />
      <View style={dp.sheet}>
        <View style={dp.handle} />
        <View style={dp.header}>
          <Text style={dp.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={dp.cancelBtn}>
            <Text style={dp.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { onConfirm(tempDate); onClose(); }} style={dp.doneBtn}>
            <Text style={dp.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={tempDate} mode="date" display="spinner"
          minimumDate={minimumDate} maximumDate={maximumDate}
          onChange={(_, d) => { if (d) setTempDate(d); }}
          style={{ height: 200 }}
        />
      </View>
    </Modal>
  );
}
const dp = StyleSheet.create({
  overlay:    { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  sheet:      { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 32 },
  handle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginTop: 10, marginBottom: 4 },
  header:     { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  title:      { flex: 1, fontSize: 15, fontWeight: "700", color: BRAND },
  cancelBtn:  { paddingHorizontal: 12, paddingVertical: 6 },
  cancelText: { fontSize: 14, color: "#6b7280" },
  doneBtn:    { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: BLUE, borderRadius: 8, marginLeft: 8 },
  doneText:   { fontSize: 14, fontWeight: "700", color: "#fff" },
});

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
      </tr>`).join("");
    return groupHeader + txRows;
  }).join("");
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,sans-serif;padding:24px;color:#111;}.header{text-align:center;margin-bottom:20px;padding-bottom:16px;border-bottom:2px solid #0d1b4b;}.logo-text{font-size:22px;font-weight:800;color:#0d1b4b;}.subtitle{font-size:12px;color:#6b7280;margin-top:4px;}.account-box{background:#f8f9fb;border:1px solid #e5e7eb;border-radius:8px;padding:12px 16px;margin-bottom:20px;}.account-row{display:flex;justify-content:space-between;padding:4px 0;font-size:12px;}.account-label{color:#6b7280;}.account-value{font-weight:600;color:#111;}table{width:100%;border-collapse:collapse;}th{background:#0d1b4b;color:#fff;padding:10px 12px;font-size:12px;text-align:left;}tr:nth-child(even) td{background:#f9fafb;}td{border-bottom:1px solid #f0f0f0;}.footer{margin-top:24px;text-align:center;font-size:11px;color:#9ca3af;}</style>
  </head><body>
  <div class="header"><div class="logo-text">BinaPay</div><div class="subtitle">Transaction History — Generated ${format(new Date(), "MMM dd, yyyy h:mm a")}</div></div>
  ${accountBlock}
  <table><thead><tr><th>Description</th><th>Date</th><th style="text-align:right;">Amount</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="footer">© ${new Date().getFullYear()} BinaPay Financial Services</div>
  </body></html>`;
  const { uri } = await Print.printToFileAsync({ html });
  await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
};

export default function TransactionHistoryScreen({ navigation: navProp }: any) {
  const insets     = useSafeAreaInsets();
  const navigation = navProp ?? useNavigation();
  const canGoBack  = navigation?.canGoBack?.() ?? false;

  const [isProcessing, setIsProcessing]     = useState(false);
  const [isDownloading, setIsDownloading]   = useState(false);
  const [page, setPage]                     = useState(1);
  const [activeTab, setActiveTab]           = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [activeStatus, setActiveStatus]     = useState("");
  const [showFilters, setShowFilters]       = useState(false);
  const [showPeriod, setShowPeriod]         = useState(false);
  const [activePeriod, setActivePeriod]     = useState<"today" | "week" | "month" | "all">("month");
  const [dateFrom, setDateFrom]             = useState<Date | null>(null);
  const [dateTo, setDateTo]                 = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker]     = useState(false);
  const [searchQuery, setSearchQuery]       = useState("");
  const [showSearch, setShowSearch]         = useState(false);

  const { data: queryData, isLoading, isFetching, refetch } =
    useFetchCompleteTransactionsQuery({ page });
  const { data: accountsData } = useListAccountsQuery(undefined, { refetchOnMountOrArgChange: false });
  const firstAccount = accountsData?.accounts?.[0] ?? null;

  // ── Backend summary — changes when period or custom dates change ───────────
  const summaryParams = useMemo(() => {
    if (dateFrom && dateTo) {
      return {
        from_date: format(dateFrom, "yyyy-MM-dd"),
        to_date:   format(dateTo,   "yyyy-MM-dd"),
      };
    }
    return { period: activePeriod };
  }, [activePeriod, dateFrom, dateTo]);

  const { data: summaryData, isFetching: isSummaryFetching } =
    useFetchTransactionSummaryQuery(summaryParams, {
      refetchOnMountOrArgChange: true,
    });

  // DEBUG — remove once summary is confirmed correct
  React.useEffect(() => {
    if (summaryData) {
      console.log("SUMMARY RESPONSE:", JSON.stringify(summaryData));
      console.log("SUMMARY PARAMS:", JSON.stringify(summaryParams));
    }
  }, [summaryData]);

  const transactionsData = useMemo(() => {
    if (!queryData) return { transactions: {}, meta: { has_more: false } };
    return queryData;
  }, [queryData]);

  const effectiveCategory = activeCategory || activeTab;

  // ── Filtered transactions for list display only ───────────────────────────
  const filteredTransactions = useMemo(() => {
    const hasFilter = effectiveCategory || activeStatus || dateFrom || dateTo || searchQuery;
    if (!hasFilter) return transactionsData.transactions;

    const result: Record<string, WalletTransaction[]> = {};
    Object.entries(transactionsData.transactions).forEach(([group, txs]) => {
      const filtered = txs.filter(tx => {
        const form = tx.meta?.form ?? "";

        const matchCategory = !effectiveCategory || form === effectiveCategory ||
          (effectiveCategory === "tv_subscription_change" && (form === "tv_subscription_change" || form === "tv_subscription_renew")) ||
          (effectiveCategory === "naira_withdrawal" && (form === "naira_withdrawal" || form === "naira_deposit")) ||
          (effectiveCategory === "crypto_withdrawal" && (form === "crypto_withdrawal" || form === "crypto_deposit"));

        let txStatus = "successful";
        if (tx.payment_transaction?.utilityTransaction?.status) {
          txStatus = tx.payment_transaction.utilityTransaction.status.toLowerCase();
        }
        const matchStatus = !activeStatus || txStatus === activeStatus;

        let matchDate = true;
        if (dateFrom || dateTo) {
          try {
            const txDate = new Date(tx.created_at);
            if (dateFrom && dateTo) matchDate = isWithinInterval(txDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) });
            else if (dateFrom) matchDate = txDate >= startOfDay(dateFrom);
            else if (dateTo)   matchDate = txDate <= endOfDay(dateTo);
          } catch { matchDate = true; }
        }

        const matchSearch = !searchQuery ||
          (tx.meta?.description ?? "").toLowerCase().includes(searchQuery.toLowerCase());

        return matchCategory && matchStatus && matchDate && matchSearch;
      });
      if (filtered.length > 0) result[group] = filtered;
    });
    return result;
  }, [transactionsData.transactions, effectiveCategory, activeStatus, dateFrom, dateTo, searchQuery]);

  // ── Format helpers for backend summary values ─────────────────────────────
  // Backend returns number_format strings like "18,157,142.44" — strip commas
  // before parsing, otherwise parseFloat("18,157,142.44") returns 18.
  const fmtAmount = (v: string | undefined) => {
    if (!v) return "₦0.00";
    const num = parseFloat(v.replace(/,/g, ""));
    return `₦${num.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
  };

  const netIsPositive = parseFloat((summaryData?.net_flow ?? "0").replace(/,/g, "")) >= 0;

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

  const clearDateRange = () => { setDateFrom(null); setDateTo(null); };
  const activeFilterCount = [activeCategory, activeStatus, dateFrom || dateTo ? "date" : ""].filter(Boolean).length;
  const formatDateLabel   = (d: Date | null) => d ? format(d, "MMM dd, yyyy") : "Select";
  const periodLabel = PERIOD_OPTIONS.find(p => p.value === activePeriod)?.label ?? "This Month";

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
          <TouchableOpacity style={s.headerBtn} onPress={() => setShowSearch(v => !v)}>
            <MaterialCommunityIcons name={showSearch ? "close" : "magnify"} size={18} color={BRAND} />
          </TouchableOpacity>
         {/*} <TouchableOpacity
            style={[s.headerBtn, activeFilterCount > 0 && s.headerBtnActive]}
            onPress={() => setShowFilters(true)}
          >
            <MaterialCommunityIcons name="filter-variant" size={18} color={activeFilterCount > 0 ? "#fff" : BRAND} />
            {activeFilterCount > 0 && (
              <View style={s.filterBadge}><Text style={s.filterBadgeText}>{activeFilterCount}</Text></View>
            )}
          </TouchableOpacity>*/}
          <TouchableOpacity 
  style={s.headerBtn} 
  onPress={() => navigation.navigate(SCREENS.MAIN, {
    screen: SCREENS.MENU,
    params: {
      screen: SCREENS.STATEMENT,
    },
  })}
>
  <MaterialCommunityIcons name="download-outline" size={18} color={BRAND} />
</TouchableOpacity>
        </View>
      </View>

      {/* ── Search bar ── */}
      {showSearch && (
        <View style={s.searchBar}>
          <MaterialCommunityIcons name="magnify" size={16} color="#9ca3af" />
          <TextInput
            style={s.searchInput} value={searchQuery} onChangeText={setSearchQuery}
            placeholder="Search transactions..." placeholderTextColor="#9ca3af" autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* ── Summary card — data from backend ── */}
      <View style={s.summaryCard}>
        <View style={s.summaryHeader}>
          <TouchableOpacity style={s.periodBtn} onPress={() => setShowPeriod(true)}>
            <Text style={s.periodBtnText}>{periodLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={14} color={BRAND_MID} />
          </TouchableOpacity>
          {isSummaryFetching
            ? <ActivityIndicator size={14} color={BRAND_MID} />
            : <TouchableOpacity style={s.eyeBtn}><MaterialCommunityIcons name="eye-outline" size={18} color="#9ca3af" /></TouchableOpacity>}
        </View>

        <View style={s.summaryGrid}>
          <View style={s.summaryItem}>
            <Text style={s.summaryItemLabel}>Total Inflow</Text>
            <View style={s.summaryAmountRow}>
              <Text style={s.summaryInflow}>{fmtAmount(summaryData?.total_credit)}</Text>
              <MaterialCommunityIcons name="arrow-up" size={14} color="#16a34a" />
            </View>
          </View>
          <View style={s.summaryDividerV} />
          <View style={s.summaryItem}>
            <Text style={s.summaryItemLabel}>Total Outflow</Text>
            <View style={s.summaryAmountRow}>
              <Text style={s.summaryOutflow}>{fmtAmount(summaryData?.total_debit)}</Text>
              <MaterialCommunityIcons name="arrow-down" size={14} color="#dc2626" />
            </View>
          </View>
        </View>

        <View style={s.summaryDividerH} />

        <View style={s.summaryGrid}>
          <View style={s.summaryItem}>
            <Text style={s.summaryItemLabel}>Transactions</Text>
            <Text style={s.summaryCount}>{summaryData?.total_count ?? "—"}</Text>
          </View>
          <View style={s.summaryDividerV} />
          <View style={s.summaryItem}>
            <Text style={s.summaryItemLabel}>Net Flow</Text>
            <Text style={[s.summaryNet, { color: netIsPositive ? "#16a34a" : "#dc2626" }]}>
              {netIsPositive ? "+" : ""}{fmtAmount(summaryData?.net_flow)}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Category tabs ── */}
      <View style={s.tabsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.tabsScroll}>
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.value;
            return (
              <TouchableOpacity
                key={tab.value} style={[s.tab, isActive && s.tabActive]}
                onPress={() => { setActiveTab(tab.value); setActiveCategory(""); }} activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={tab.icon as any} size={14} color={isActive ? "#fff" : "#6b7280"} />
                <Text style={[s.tabText, isActive && s.tabTextActive]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {isLoading ? (
        <View style={{ padding: 16 }}><TransactionLoader groups={["Today", "Yesterday"]} /></View>
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
                    <TransactionRow transaction={transaction} onPress={() => onSelectTransaction(transaction)} />
                    {index !== transactions.length - 1 && <Divider style={{ marginHorizontal: 16 }} />}
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
                ? <View style={s.loadingMore}><ActivityIndicator size="small" color="#9ca3af" /><Text style={s.loadingText}>Loading more...</Text></View>
                : <Text style={s.allLoadedText}>All transactions loaded 🎉</Text>}
            </View>
          )}
        />
      )}

      {/* ── Period picker modal ── */}
      <Modal visible={showPeriod} transparent animationType="fade" onRequestClose={() => setShowPeriod(false)}>
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setShowPeriod(false)} />
        <View style={s.periodSheet}>
          <View style={s.filterHandle} />
          <Text style={s.filterTitle}>Select Period</Text>
          {PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.value} style={s.periodOption}
              onPress={() => {
                setActivePeriod(opt.value as any);
                clearDateRange(); // clear custom dates when selecting a preset
                setShowPeriod(false);
              }}
            >
              <Text style={[s.periodOptionText, activePeriod === opt.value && s.periodOptionTextActive]}>
                {opt.label}
              </Text>
              {activePeriod === opt.value && <MaterialCommunityIcons name="check" size={16} color={BLUE} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

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
                <Text style={[s.datePickerText, !dateFrom && s.datePickerPlaceholder]}>{formatDateLabel(dateFrom)}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.dateSeparator} />
            <View style={s.dateField}>
              <Text style={s.dateFieldLabel}>To</Text>
              <TouchableOpacity style={s.datePicker} onPress={() => setShowToPicker(true)}>
                <MaterialCommunityIcons name="calendar-outline" size={15} color={BRAND_MID} />
                <Text style={[s.datePickerText, !dateTo && s.datePickerPlaceholder]}>{formatDateLabel(dateTo)}</Text>
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
              <TouchableOpacity key={f.value}
                style={[s.filterChip, activeCategory === f.value && s.filterChipActive]}
                onPress={() => { setActiveCategory(f.value); setActiveTab(""); }}
              >
                <Text style={[s.filterChipText, activeCategory === f.value && s.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.filterSectionLabel}>Status</Text>
          <View style={s.filterOptions}>
            {STATUS_FILTERS.map(f => (
              <TouchableOpacity key={f.value}
                style={[s.filterChip, activeStatus === f.value && s.filterChipActive]}
                onPress={() => setActiveStatus(f.value)}
              >
                <Text style={[s.filterChipText, activeStatus === f.value && s.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={s.filterActions}>
            <TouchableOpacity style={s.clearBtn}
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

      {/* ── Date pickers with modal (fixed iOS close) ── */}
      <DatePickerModal
        visible={showFromPicker}
        value={dateFrom ?? new Date()}
        title="Select Start Date"
        maximumDate={dateTo ?? new Date()}
        onConfirm={(d) => setDateFrom(d)}
        onClose={() => setShowFromPicker(false)}
      />
      <DatePickerModal
        visible={showToPicker}
        value={dateTo ?? new Date()}
        title="Select End Date"
        minimumDate={dateFrom ?? undefined}
        maximumDate={new Date()}
        onConfirm={(d) => setDateTo(d)}
        onClose={() => setShowToPicker(false)}
      />

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
  searchBar:      { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  searchInput:    { flex: 1, fontSize: 14, color: "#111827" },
  summaryCard:      { backgroundColor: "#fff", marginHorizontal: 16, marginTop: 14, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  summaryHeader:    { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  periodBtn:        { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEF3FF", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  periodBtnText:    { fontSize: 12, fontWeight: "700", color: BRAND_MID },
  eyeBtn:           { padding: 4 },
  summaryGrid:      { flexDirection: "row" },
  summaryItem:      { flex: 1 },
  summaryItemLabel: { fontSize: 11, color: "#9ca3af", marginBottom: 4 },
  summaryAmountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  summaryInflow:    { fontSize: 15, fontWeight: "800", color: "#16a34a" },
  summaryOutflow:   { fontSize: 15, fontWeight: "800", color: "#dc2626" },
  summaryCount:     { fontSize: 16, fontWeight: "800", color: BRAND },
  summaryNet:       { fontSize: 15, fontWeight: "700" },
  summaryDividerV:  { width: 1, backgroundColor: "#f0f0f0", marginHorizontal: 12 },
  summaryDividerH:  { height: 1, backgroundColor: "#f0f0f0", marginVertical: 12 },
  tabsWrap:       { backgroundColor: "#fff", marginTop: 12, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  tabsScroll:     { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab:            { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  tabActive:      { backgroundColor: BRAND, borderColor: BRAND },
  tabText:        { fontSize: 12, fontWeight: "600", color: "#6b7280" },
  tabTextActive:  { color: "#fff" },
  list:           { padding: 16, gap: 14, paddingBottom: 40 },
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
  periodSheet:    { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  periodOption:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  periodOptionText:     { fontSize: 15, color: "#374151", fontWeight: "500" },
  periodOptionTextActive: { color: BLUE, fontWeight: "700" },
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
