import { Colors } from "@constants/theme/colors";
import { HomeStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { getPendingTransaction } from "@store/slice/transactionSlice";
import { resetNavigationToDashboard, getNavigate } from "@utils/navigation";
import {
  defaultTransactionResponse,
  getTransactionDetails,
  viewTransactionHelper,
  viewTransactionResponse,
} from "@helpers/transaction";
import React, { useMemo, useState } from "react";
import {
  View, ScrollView, Alert, TouchableOpacity, StyleSheet,
} from "react-native";
import { Image } from "react-native-element-image";
import { Text } from "react-native-paper";
import { match } from "ts-pattern";
import { SCREENS } from "@constants/screens";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useShareTransactionReceipt } from "@hooks/transaction";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { format } from "date-fns";
import * as Clipboard from "expo-clipboard";
import Button from "@components/ui/form/button";
import EpinCardSample from "@components/screens/transactions/epin-sample-card";
import { TransactionStatus } from "@enum/transaction";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { generateEpinsTemplate } from "@helpers/templates/generateEpinsTemplate";
import { MaterialCommunityIcons } from "@expo/vector-icons";

type Props = HomeStackScreenProps<typeof SCREENS.VIEW_TRANSACTION>;

const BRAND     = "#0d1b4b";
const BRAND_MID = "#1a3a8a";
const BLUE      = "#2563EB";
const SUCCESS   = "#16a34a";
const SUCCESS_BG= "#dcfce7";
const WARN      = "#d97706";
const WARN_BG   = "#fef3c7";
const FAIL      = "#dc2626";
const FAIL_BG   = "#fee2e2";

const fieldIcon = (label: string): string => {
  const l = label.toLowerCase();
  if (l.includes("account"))                                          return "bank-outline";
  if (l.includes("beneficiary name") || l.includes("received by"))   return "account-outline";
  if (l.includes("sender"))                                           return "send-outline";
  if (l.includes("bank"))                                             return "bank";
  if (l.includes("narration"))                                        return "chat-outline";
  if (l.includes("date") || l.includes("time"))                       return "calendar-outline";
  if (l.includes("reference") || l.includes("session") || l.includes("id")) return "pound";
  if (l.includes("amount"))                                           return "cash-multiple";
  if (l.includes("fee"))                                              return "percent";
  if (l.includes("description"))                                      return "text-box-outline";
  if (l.includes("destination"))                                      return "map-marker-outline";
  if (l.includes("provider") || l.includes("network"))               return "signal-variant";
  if (l.includes("phone") || l.includes("recipient"))                return "phone-outline";
  if (l.includes("type"))                                             return "swap-horizontal";
  return "information-outline";
};

export default function ViewTransaction({ route }: Props) {
  const [valueCopied, setValueCopied]   = useState(false);
  const [visibleEpins, setVisibleEpins] = useState(10);
  const { transactionId }               = route.params;
  const insets                          = useSafeAreaInsets();

  const { shareTransactionReceipt, isPrinting, stopSharing } = useShareTransactionReceipt();

  const pendingTransaction = useTypedSelector((state) =>
    getPendingTransaction(state.transaction, transactionId)
  );

  const utilityResponse = useMemo(() =>
    match(pendingTransaction)
      .with({ data: { response: { transaction_info: { transaction: {} } } } }, ({ data }) => data.response)
      .otherwise(() => null),
    [pendingTransaction]
  );

  const viewResponse = useMemo(() =>
    match(pendingTransaction)
      .with({ view: {} }, ({ view }) => view)
      .otherwise(() => null),
    [pendingTransaction]
  );

  const pageData = useMemo(() => {
    const data = utilityResponse
      ? viewTransactionResponse(utilityResponse)
      : viewTransactionHelper(viewResponse);
    return {
      ...defaultTransactionResponse,
      transactionTitle:       defaultTransactionResponse.title,
      transactionDescription: defaultTransactionResponse.description,
      transactionDetails:     [] as ReturnType<typeof getTransactionDetails>,
      transactionDate:        format(new Date(), "MMM dd, yyyy h:mm a"),
      appLogo:                "https://binapay.co/assets/icons/logo-black.svg",
      promotionalText:        "Unlock exclusive offers and rewards with BinaPay.",
      supportEmail:           "support@binapay.co",
      hasDetails:             false,
      logo:                   "",
      status:                 TransactionStatus.Successful,
      reference:              "",
      ...data,
    };
  }, [viewResponse, utilityResponse]);

  // ── Status config ──────────────────────────────────────────────────────────
  const sc = useMemo(() => {
    const s = pageData.paymentStatus ?? (pageData.status as string);
    if (s === TransactionStatus.Pending || ["pending","processing","submitted"].includes(s))
      return { color: WARN, bg: WARN_BG, icon: "clock-outline", label: "Processing", sub: "Your transaction is being processed" };
    if (s === TransactionStatus.Failed || s === "failed")
      return { color: FAIL, bg: FAIL_BG, icon: "close-circle-outline", label: "Failed", sub: "Your transaction could not be completed" };
    return { color: SUCCESS, bg: SUCCESS_BG, icon: "check-circle", label: "Transaction Successful", sub: "Your transaction was completed successfully" };
  }, [pageData.status, pageData.paymentStatus]);

  // ── Transfer rows ──────────────────────────────────────────────────────────
  const transferRows = useMemo(() => {
    const td = pageData.transferDetails;
    if (!td) return null;
    const form = (pageData as any).form as string | undefined;
    const isDeposit = form === "naira_deposit";
    return [
      isDeposit
        ? { label: "Received By",         value: td.beneficiary_name }
        : { label: "Beneficiary Account", value: td.beneficiary_account },
      isDeposit
        ? { label: "Sender Name",         value: td.sender_name }
        : { label: "Beneficiary Name",    value: td.beneficiary_name },
      { label: "Bank Name",               value: td.bank_name },
      isDeposit ? null : { label: "Sender Name", value: td.sender_name },
      ...(td.session_id ? [{ label: "Session ID", value: td.session_id }] : []),
      { label: "Narration",               value: td.narration },
      { label: "Date",                    value: pageData.transactionDate },
      ...(td.reference ? [{ label: "Reference ID", value: td.reference }] : []),
    ].filter((r): r is { label: string; value: string | null } => !!r && !!r.value);
  }, [pageData.transferDetails, pageData.transactionDate, (pageData as any).form]);

  // ── Amount ─────────────────────────────────────────────────────────────────
  const displayAmount = useMemo(() => {
    if (pageData.transferDetails?.amount) {
      return `₦${Number(pageData.transferDetails.amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
    }
    return pageData.transactionDetails.find(d => d.label.toLowerCase().includes("amount"))?.value ?? "";
  }, [pageData]);

  // ── Is transfer (bank transfer) ─────────────────────────────────────────
  const isTransfer = pageData.receiptType === "transfer";
  const td = pageData.transferDetails;

  const printData = {
    pageData: {
      ...pageData,
      supportEmail:    "",
      receiptType:     pageData.receiptType    ?? "generic",
      paymentStatus:   pageData.paymentStatus,
      transferDetails: pageData.transferDetails,
      amount:          pageData.transferDetails?.amount
                       ?? pageData.transactionDetails.find(d => d.label.toLowerCase().includes("amount"))?.value
                       ?? undefined,
      hasHighlighted:  pageData.hasHighlighted,
      providerLogo:    pageData.logo,
    },
  };

  const copyToken = async () => {
    if (pageData.hasHighlighted?.copyable) {
      await Clipboard.setStringAsync(pageData.hasHighlighted.value);
      setValueCopied(true);
      setTimeout(() => setValueCopied(false), 2000);
    }
  };

  const copyValue = async (value: string) => {
    await Clipboard.setStringAsync(value);
  };

  const handlePrintEpin = () => {
    if (!pageData.epins?.length) { Alert.alert("No E-PINs", "There are no epins to print."); return; }
    shareTransactionReceipt({ pageData: printData.pageData, getTemplate: generateEpinsTemplate });
  };

  const handleContactSupport = async () => {
    try {
      await AsyncStorage.setItem("SUPPORT_TRANSACTION_REFERENCE", pageData.reference || "unknown");
      await AsyncStorage.setItem("SUPPORT_INITIAL_MESSAGE", `I need help with transaction reference: ${pageData.reference || "unknown"}`);
      const { navigate } = await getNavigate();
      navigate(SCREENS.MAIN, { screen: SCREENS.MENU, params: { screen: SCREENS.SUPPORT_STACK, params: { screen: SCREENS.DEPARTMENT_AND_HISTORY_TAB, params: undefined } } });
    } catch {}
  };

  const showReceipt = pageData.hasDetails || !!pageData.transferDetails;
  // For transfers, skip beneficiary name/account from detail rows 
// since recipient card already shows them
const TRANSFER_EXCLUDED = ["beneficiary account", "beneficiary name", "received by", "bank name"];

const detailRows = useMemo(() => {
  const rows = transferRows ?? (pageData.hasDetails ? pageData.transactionDetails : []);
  if (!isTransfer) return rows;
  return rows.filter(r => !TRANSFER_EXCLUDED.includes(r.label.toLowerCase()));
}, [transferRows, pageData.hasDetails, pageData.transactionDetails, isTransfer]);

  // Identify which rows are copyable (reference, session id, account)
  const isCopyableRow = (label: string) => {
    const l = label.toLowerCase();
    return l.includes("reference") || l.includes("session") || l.includes("account");
  };

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={resetNavigationToDashboard} style={s.backBubble} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Transaction Details</Text>
        <TouchableOpacity
          style={s.shareTopBtn}
          onPress={() => showReceipt && shareTransactionReceipt(printData)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="share-variant-outline" size={20} color={BRAND_MID} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[s.scroll, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Hero status ── */}
        <View style={s.hero}>
          <View style={[s.heroBadge, { backgroundColor: sc.bg }]}>
            <MaterialCommunityIcons name={sc.icon as any} size={36} color={sc.color} />
          </View>
          <Text style={[s.heroStatus, { color: sc.color }]}>{sc.label}</Text>
          {!!displayAmount && <Text style={s.heroAmount}>{displayAmount}</Text>}
        </View>

        {/* ── Transfer recipient card (for bank transfers) ── */}
        {isTransfer && td?.beneficiary_name && (
          <View style={s.recipientCard}>
            <Text style={s.recipientCardLabel}>Recipient Details</Text>
            <View style={s.recipientRow}>
              <View style={s.recipientAvatar}>
                <MaterialCommunityIcons name="account" size={20} color={BRAND_MID} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.recipientName}>{td.beneficiary_name}</Text>
                <Text style={s.recipientMeta}>
                  {td.bank_name}
                  {td.beneficiary_account ? ` · ${td.beneficiary_account}` : ""}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Detail rows ── */}
        {detailRows.length > 0 && (
          <View style={s.detailSection}>
            <Text style={s.detailSectionTitle}>Transaction Details</Text>
            <View style={s.detailCard}>
              {detailRows.map((row, i) => {
                const copyable = isCopyableRow(row.label);
                return (
                  <View key={row.label} style={[s.detailRow, i < detailRows.length - 1 && s.detailBorder]}>
                    <Text style={s.detailLabel}>{row.label}</Text>
                    <TouchableOpacity
                      style={s.detailValueRow}
                      onPress={copyable ? () => copyValue(row.value ?? "") : undefined}
                      activeOpacity={copyable ? 0.6 : 1}
                    >
                      <Text style={[s.detailValue, copyable && s.detailValueCopyable]} numberOfLines={2}>
                        {row.value}
                      </Text>
                      {copyable && (
                        <MaterialCommunityIcons name="content-copy" size={14} color="#9ca3af" style={{ marginLeft: 6 }} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Electricity token ── */}
        {pageData.hasHighlighted && (
          <TouchableOpacity onPress={copyToken} style={s.tokenCard} activeOpacity={0.7}>
            <View style={s.tokenHeader}>
              <MaterialCommunityIcons name="lightning-bolt" size={16} color="#d97706" />
              <Text style={s.tokenHeaderText}>Electricity Token</Text>
              <MaterialCommunityIcons
                name={valueCopied ? "check-circle" : "content-copy"}
                size={16} color={valueCopied ? SUCCESS : "#9ca3af"}
              />
            </View>
            <Text style={s.tokenValue}>{pageData.hasHighlighted.value}</Text>
            <Text style={s.tokenHint}>{valueCopied ? "Copied!" : "Tap to copy token"}</Text>
          </TouchableOpacity>
        )}

        {/* ── Epins ── */}
        {pageData.epins && pageData.epins.length > 0 && (
          <View style={s.epinsWrap}>
            {pageData.epins.slice(0, visibleEpins).map((epin, i) => (
              <EpinCardSample key={i} values={epin} />
            ))}
            {visibleEpins < pageData.epins.length && (
              <Button mode="contained-tonal" onPress={() => setVisibleEpins(p => p + 10)}>
                Load More E-Pins
              </Button>
            )}
          </View>
        )}

      </ScrollView>

      {/* ── Bottom action buttons ── */}
      <View style={[s.bottomActions, { paddingBottom: insets.bottom + 12 }]}>
        {showReceipt && (
  <TouchableOpacity
    style={s.shareBtn}
    onPress={() => pageData.epins?.length
      ? shareTransactionReceipt({ pageData: printData.pageData, getTemplate: generateEpinsTemplate })
      : shareTransactionReceipt(printData)
    }
    activeOpacity={0.8}
  >
    <MaterialCommunityIcons name="share-variant-outline" size={18} color={BRAND_MID} />
    <Text style={s.shareBtnText}>Share Receipt</Text>
  </TouchableOpacity>
)}
{showReceipt && (
  <TouchableOpacity
    style={s.downloadBtn}
    onPress={() => pageData.epins?.length
      ? shareTransactionReceipt({ pageData: printData.pageData, getTemplate: generateEpinsTemplate })
      : shareTransactionReceipt(printData)
    }
    activeOpacity={0.8}
  >
    <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
    <Text style={s.downloadBtnText}>Download Receipt</Text>
  </TouchableOpacity>
)}
        {pageData.epins && pageData.epins.length > 0 && (
          <TouchableOpacity style={s.downloadBtn} onPress={handlePrintEpin} activeOpacity={0.8}>
            <MaterialCommunityIcons name="file-pdf-box" size={18} color="#fff" />
            <Text style={s.downloadBtnText}>Download E-Pins PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      <PleaseWaitModal visible={isPrinting} dismissable onDismiss={stopSharing} />
    </View>
  );
}

const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#f8f9fb" },

  topBar:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBubble: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  topTitle:   { fontSize: 16, fontWeight: "700", color: BRAND },
  shareTopBtn:{ width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },

  scroll:     { padding: 16, gap: 14 },

  // Hero
  hero:       { alignItems: "center", paddingVertical: 20, gap: 8 },
  heroBadge:  { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  heroStatus: { fontSize: 16, fontWeight: "700" },
  heroAmount: { fontSize: 32, fontWeight: "800", color: BRAND, letterSpacing: -1 },

  // Recipient card (transfers)
  recipientCard:      { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  recipientCardLabel: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 12 },
  recipientRow:       { flexDirection: "row", alignItems: "center", gap: 12 },
  recipientAvatar:    { width: 44, height: 44, borderRadius: 22, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  recipientName:      { fontSize: 15, fontWeight: "700", color: BRAND },
  recipientMeta:      { fontSize: 13, color: "#6b7280", marginTop: 2 },

  // Detail section
  detailSection:      { gap: 10 },
  detailSectionTitle: { fontSize: 11, fontWeight: "700", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 0.5, paddingLeft: 4 },
  detailCard:         { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#f0f0f0" },
  detailRow:          { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 13 },
  detailBorder:       { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  detailLabel:        { fontSize: 13, color: "#6b7280", flex: 1 },
  detailValueRow:     { flexDirection: "row", alignItems: "center", flex: 1.4, justifyContent: "flex-end" },
  detailValue:        { fontSize: 13, fontWeight: "600", color: "#111827", textAlign: "right" },
  detailValueCopyable:{ color: BRAND_MID },

  // Token
  tokenCard:    { backgroundColor: "#fffbeb", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#fde68a" },
  tokenHeader:  { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  tokenHeaderText: { flex: 1, fontSize: 12, fontWeight: "700", color: "#92400e", textTransform: "uppercase", letterSpacing: 0.5 },
  tokenValue:   { fontSize: 18, fontWeight: "800", color: "#92400e", letterSpacing: 2, marginBottom: 6 },
  tokenHint:    { fontSize: 12, color: "#b45309" },

  epinsWrap:    { gap: 10 },

  // Bottom actions
  bottomActions:  { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0", gap: 10 },
  shareBtn:       { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 13 },
  shareBtnText:   { fontSize: 15, fontWeight: "700", color: BRAND_MID },
  downloadBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 13 },
  downloadBtnText:{ fontSize: 15, fontWeight: "700", color: "#fff" },
});
