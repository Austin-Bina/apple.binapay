import React, { useState, useMemo } from "react";
import {
  View, ScrollView, TouchableOpacity, StyleSheet,
  Modal, Alert,
} from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { format, startOfMonth, endOfMonth } from "date-fns";
import * as Print from "expo-print";
import { shareAsync } from "expo-sharing";
import * as FileSystem from "expo-file-system";
import {
  useGenerateStatementMutation,
  StatementPreviewResponse,
  StatementGenerateResponse,
  useSendStatementEmailMutation,
} from "@store/redux-api/statementApi";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import generateStatementHTML from "@helpers/templates/generateStatementHTML";

// Same logo used in ViewTransaction → receipt template
const APP_LOGO = "https://binapay.co/assets/icons/logo-black.svg";

const BRAND      = "#0d1b4b";
const BRAND_MID  = "#1a3a8a";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";

type StatementType   = "full" | "credit" | "debit";
type StatementFormat = "pdf" | "csv";
type DeliveryMethod  = "download" | "email";
type ScreenState     = "form" | "preview" | "success";

const TYPE_OPTIONS: { label: string; value: StatementType; icon: string; color: string }[] = [
  { label: "Full Statement", value: "full",   icon: "file-document-outline",    color: BLUE },
  { label: "Credit Only",   value: "credit", icon: "arrow-down-circle-outline", color: "#16a34a" },
  { label: "Debit Only",    value: "debit",  icon: "arrow-up-circle-outline",   color: "#dc2626" },
];

const FORMAT_OPTIONS: { label: string; value: StatementFormat; icon: string; color: string }[] = [
  { label: "PDF", value: "pdf", icon: "file-pdf-box",          color: "#dc2626" },
  { label: "CSV", value: "csv", icon: "file-delimited-outline", color: "#16a34a" },
];

const DELIVERY_OPTIONS: { label: string; value: DeliveryMethod; icon: string }[] = [
  { label: "Download Now",  value: "download", icon: "download-outline" },
  { label: "Send to Email", value: "email",    icon: "email-outline" },
];

const RANGE_OPTIONS = [
  { label: "This Month",    value: "this_month" },
  { label: "Last Month",    value: "last_month" },
  { label: "Last 3 Months", value: "last_3" },
  { label: "Custom Range",  value: "custom" },
];

// ─────────────────────────────────────────────────────────────────────────────
// Modal date picker — spinner inside a bottom sheet with Cancel / Done
// ─────────────────────────────────────────────────────────────────────────────
function DatePickerModal({
  visible, value, title, minimumDate, maximumDate, onConfirm, onClose,
}: {
  visible: boolean;
  value: Date;
  title: string;
  minimumDate?: Date;
  maximumDate?: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}) {
  const [tempDate, setTempDate] = useState(value);

  React.useEffect(() => {
    if (visible) setTempDate(value);
  }, [visible]);

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
          <TouchableOpacity
            onPress={() => { onConfirm(tempDate); onClose(); }}
            style={dp.doneBtn}
          >
            <Text style={dp.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
        <DateTimePicker
          value={tempDate}
          mode="date"
          display="spinner"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
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

// ─────────────────────────────────────────────────────────────────────────────
// Main StatementScreen
// ─────────────────────────────────────────────────────────────────────────────
export default function StatementScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
  const user   = useSelector(selectUser);

  const [screenState, setScreenState]         = useState<ScreenState>("form");
  const [statementType, setStatementType]     = useState<StatementType>("full");
  const [statementFormat, setStatementFormat] = useState<StatementFormat>("pdf");
  const [deliveryMethod, setDeliveryMethod]   = useState<DeliveryMethod>("download");
  const [selectedRange, setSelectedRange]     = useState("this_month");
  const [showRangePicker, setShowRangePicker] = useState(false);
  const [showFromPicker, setShowFromPicker]   = useState(false);
  const [showToPicker, setShowToPicker]       = useState(false);
  const [isGenerating, setIsGenerating]       = useState(false);

  const now = new Date();
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(now));
  const [dateTo, setDateTo]     = useState<Date>(endOfMonth(now));

  const [preview, setPreview]         = useState<StatementPreviewResponse | null>(null);
  const [generatedData, setGenerated] = useState<StatementGenerateResponse | null>(null);
  const [fileSizeKb, setFileSizeKb]   = useState(0);

  const [generateStatement]  = useGenerateStatementMutation();
  const [sendStatementEmail] = useSendStatementEmailMutation();

  const fromStr    = format(dateFrom, "yyyy-MM-dd");
  const toStr      = format(dateTo,   "yyyy-MM-dd");
  const balance    = user?.wallet_balances?.naira?.balance ?? "0";
  const rangeLabel = useMemo(
    () => RANGE_OPTIONS.find(r => r.value === selectedRange)?.label ?? "Custom Range",
    [selectedRange],
  );

  const applyRange = (value: string) => {
    const n = new Date();
    if (value === "this_month") {
      setDateFrom(startOfMonth(n)); setDateTo(endOfMonth(n));
    } else if (value === "last_month") {
      const lm = new Date(n.getFullYear(), n.getMonth() - 1, 1);
      setDateFrom(startOfMonth(lm)); setDateTo(endOfMonth(lm));
    } else if (value === "last_3") {
      const d = new Date(n); d.setMonth(d.getMonth() - 3);
      setDateFrom(d); setDateTo(n);
    }
    setSelectedRange(value);
    setShowRangePicker(false);
  };

  const handlePreview = async () => {
    try {
      setIsGenerating(true);
      const result = await generateStatement({
        from_date: fromStr, to_date: toStr,
        type: statementType, format: statementFormat, delivery: "download",
      }).unwrap();

      setPreview({
        period:               result.period,
        opening_balance:      result.summary.opening_balance,
        closing_balance:      result.summary.closing_balance,
        total_credit:         result.summary.total_credit,
        total_debit:          result.summary.total_debit,
        total_transactions:   result.transactions.length,
        credit_transactions:  result.transactions.filter(t => t.is_credit).length,
        debit_transactions:   result.transactions.filter(t => !t.is_credit).length,
        recent_transactions:  result.transactions.slice(0, 5),
      });
      setGenerated(result);
      setScreenState("preview");
    } catch (e: any) {
      Alert.alert("Error", e?.data?.message ?? "Failed to fetch statement data.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedData) return;
    try {
      setIsGenerating(true);

      if (statementFormat === "csv") {
        const lines = [
          ["Date", "Time", "Description", "Reference", "Type", "Amount (NGN)"].join(","),
          ...generatedData.transactions.map(tx =>
            [tx.date, tx.time, `"${tx.description}"`, tx.reference, tx.type,
             (tx.is_credit ? "+" : "-") + tx.amount].join(",")
          ),
        ];
        const path = FileSystem.documentDirectory + generatedData.filename;
        await FileSystem.writeAsStringAsync(path, lines.join("\n"), {
          encoding: FileSystem.EncodingType.UTF8,
        });
        await shareAsync(path, { mimeType: "text/csv", UTI: ".csv" });
        setScreenState("success");
        return;
      }

      const html    = generateStatementHTML(generatedData, APP_LOGO);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      const info    = await FileSystem.getInfoAsync(uri);
      setFileSizeKb(Math.round(((info as any).size ?? 0) / 1024));

      if (deliveryMethod === "email") {
        const base64Pdf = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await sendStatementEmail({
          pdf_base64:   base64Pdf,
          filename:     generatedData.filename,
          statement_id: generatedData.statement_id,
          period:       generatedData.period,
        }).unwrap();
        await FileSystem.deleteAsync(uri, { idempotent: true });
        Alert.alert(
          "Statement Sent! 📧",
          `Your statement has been sent to ${generatedData.user.email}`,
          [{ text: "OK", onPress: () => setScreenState("success") }],
        );
      } else {
        await shareAsync(uri, { UTI: ".pdf", mimeType: "application/pdf" });
        setScreenState("success");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.data?.message ?? "Failed to generate statement.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (screenState === "success" && generatedData) {
    return <SuccessScreen data={generatedData} format={statementFormat} sizeKb={fileSizeKb}
      onShare={handleDownload} onBack={() => setScreenState("form")} insets={insets} />;
  }
  if (screenState === "preview" && preview && generatedData) {
    return <PreviewScreen preview={preview} format={statementFormat} onDownload={handleDownload}
      onBack={() => setScreenState("form")} isGenerating={isGenerating} insets={insets} />;
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation?.goBack?.()}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerTitle}>Statement of Account</Text>
          <Text style={s.headerSub}>View and download your account statement</Text>
        </View>
        <TouchableOpacity style={s.infoBtn}>
          <MaterialCommunityIcons name="information-outline" size={20} color={BRAND_MID} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* Wallet card 
        <View style={s.walletCard}>
          <View style={s.walletCardInner}>
            <MaterialCommunityIcons name="wallet-outline" size={20} color="#fff" style={{ opacity: 0.8 }} />
            <Text style={s.walletCardTitle}>BinaPay Main Wallet</Text>
            <MaterialCommunityIcons name="bank-outline" size={18} color="#fff" style={{ opacity: 0.6 }} />
          </View>
          <Text style={s.walletLabel}>Account Balance</Text>
          <View style={s.walletBalanceRow}>
            <Text style={s.walletBalance}>
              ₦{parseFloat(balance).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </Text>
            <TouchableOpacity>
              <MaterialCommunityIcons name="eye-outline" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          </View>
        </View>
*/}
        {/* Statement Type */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Select Statement Type</Text>
          <View style={s.typeGrid}>
            {TYPE_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value}
                style={[s.typeCard, statementType === opt.value && s.typeCardActive]}
                onPress={() => setStatementType(opt.value)} activeOpacity={0.7}
              >
                <View style={[s.typeIconWrap, {
                  backgroundColor: statementType === opt.value ? opt.color + "20" : "#f3f4f6",
                }]}>
                  <MaterialCommunityIcons name={opt.icon as any} size={22}
                    color={statementType === opt.value ? opt.color : "#6b7280"} />
                </View>
                <Text style={[s.typeLabel, statementType === opt.value && {
                  color: opt.color, fontWeight: "700",
                }]}>{opt.label}</Text>
                {statementType === opt.value && (
                  <View style={[s.typeCheck, { backgroundColor: opt.color }]}>
                    <MaterialCommunityIcons name="check" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Date Range */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Select Date Range</Text>

          {/* Preset range pill */}
          <TouchableOpacity style={s.rangeSelector} onPress={() => setShowRangePicker(true)}>
            <MaterialCommunityIcons name="calendar-range-outline" size={18} color={BRAND_MID} />
            <Text style={s.rangeSelectorText}>{rangeLabel}</Text>
            <MaterialCommunityIcons name="chevron-down" size={18} color={BRAND_MID} />
          </TouchableOpacity>

          {/* From / To pickers */}
          <View style={s.dateRow}>
            <View style={s.dateField}>
              <Text style={s.dateFieldLabel}>From</Text>
              <TouchableOpacity style={s.datePicker} onPress={() => setShowFromPicker(true)}>
                <MaterialCommunityIcons name="calendar-outline" size={15} color={BRAND_MID} />
                <Text style={s.datePickerText}>{format(dateFrom, "dd MMM yyyy")}</Text>
              </TouchableOpacity>
            </View>
            <View style={s.dateSeparator} />
            <View style={s.dateField}>
              <Text style={s.dateFieldLabel}>To</Text>
              <TouchableOpacity style={s.datePicker} onPress={() => setShowToPicker(true)}>
                <MaterialCommunityIcons name="calendar-outline" size={15} color={BRAND_MID} />
                <Text style={s.datePickerText}>{format(dateTo, "dd MMM yyyy")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Format */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Statement Format</Text>
          <View style={s.formatRow}>
            {FORMAT_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value}
                style={[s.formatCard, statementFormat === opt.value && s.formatCardActive]}
                onPress={() => setStatementFormat(opt.value)} activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={opt.icon as any} size={24}
                  color={statementFormat === opt.value ? opt.color : "#6b7280"} />
                <Text style={[s.formatLabel, statementFormat === opt.value && {
                  color: opt.color, fontWeight: "700",
                }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Delivery */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Delivery Method</Text>
          <View style={s.formatRow}>
            {DELIVERY_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value}
                style={[s.formatCard, deliveryMethod === opt.value && s.formatCardActive]}
                onPress={() => setDeliveryMethod(opt.value)} activeOpacity={0.7}
              >
                <MaterialCommunityIcons name={opt.icon as any} size={20}
                  color={deliveryMethod === opt.value ? BLUE : "#6b7280"} />
                <Text style={[s.formatLabel, deliveryMethod === opt.value && {
                  color: BLUE, fontWeight: "700",
                }]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Security note */}
        <View style={s.secureNote}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={BLUE} />
          <View style={{ flex: 1 }}>
            <Text style={s.secureTitle}>Secure &amp; Private</Text>
            <Text style={s.secureSub}>Your statement is encrypted and only you can access it.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Generate button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.generateBtn} onPress={handlePreview}
          disabled={isGenerating} activeOpacity={0.8}
        >
          {isGenerating
            ? <ActivityIndicator size={20} color="#fff" />
            : <MaterialCommunityIcons name="file-chart-outline" size={20} color="#fff" />}
          <Text style={s.generateBtnText}>
            {isGenerating ? "Generating..." : "Generate Statement"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Range preset modal ── */}
      <Modal visible={showRangePicker} transparent animationType="slide"
        onRequestClose={() => setShowRangePicker(false)}
      >
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1}
          onPress={() => setShowRangePicker(false)} />
        <View style={[s.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={s.sheetHandle} />
          <Text style={s.sheetTitle}>Select Range</Text>
          {RANGE_OPTIONS.map(opt => (
            <TouchableOpacity key={opt.value} style={s.rangeOption}
              onPress={() => applyRange(opt.value)}
            >
              <Text style={[s.rangeOptionText,
                selectedRange === opt.value && { color: BLUE, fontWeight: "700" }]}>
                {opt.label}
              </Text>
              {selectedRange === opt.value &&
                <MaterialCommunityIcons name="check" size={18} color={BLUE} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* ── From date — modal spinner with Done ── */}
      <DatePickerModal
        visible={showFromPicker}
        value={dateFrom}
        title="Select Start Date"
        maximumDate={dateTo}
        onConfirm={(d) => { setDateFrom(d); setSelectedRange("custom"); }}
        onClose={() => setShowFromPicker(false)}
      />

      {/* ── To date — modal spinner with Done ── */}
      <DatePickerModal
        visible={showToPicker}
        value={dateTo}
        title="Select End Date"
        minimumDate={dateFrom}
        maximumDate={new Date()}
        onConfirm={(d) => { setDateTo(d); setSelectedRange("custom"); }}
        onClose={() => setShowToPicker(false)}
      />
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Preview Screen
// ─────────────────────────────────────────────────────────────────────────────
function PreviewScreen({ preview, format, onDownload, onBack, isGenerating, insets }: any) {
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={BRAND} />
        </TouchableOpacity>
        <Text style={[s.headerTitle, { flex: 1 }]}>Statement Preview</Text>
        <View style={{ width: 36 }} />
      </View>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.previewCard}>
          <Text style={s.previewCardTitle}>Statement Summary</Text>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Period</Text>
            <Text style={s.previewValue}>{preview.period}</Text>
          </View>
          <View style={s.previewDivider} />
          <View style={s.previewGrid}>
            <View style={s.previewGridItem}>
              <Text style={s.previewLabel}>Opening Balance</Text>
              <Text style={s.previewValueLg}>₦{preview.opening_balance}</Text>
            </View>
            <View style={s.previewGridItem}>
              <Text style={s.previewLabel}>Closing Balance</Text>
              <Text style={s.previewValueLg}>₦{preview.closing_balance}</Text>
            </View>
          </View>
          <View style={s.previewGrid}>
            <View style={s.previewGridItem}>
              <Text style={s.previewLabel}>Total Credit</Text>
              <Text style={[s.previewValueLg, { color: "#16a34a" }]}>₦{preview.total_credit}</Text>
            </View>
            <View style={s.previewGridItem}>
              <Text style={s.previewLabel}>Total Debit</Text>
              <Text style={[s.previewValueLg, { color: "#dc2626" }]}>₦{preview.total_debit}</Text>
            </View>
          </View>
        </View>

        <View style={s.previewCard}>
          <Text style={s.previewCardTitle}>Transaction Summary</Text>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Total Transactions</Text>
            <Text style={s.previewValue}>{preview.total_transactions}</Text>
          </View>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Credit Transactions</Text>
            <Text style={[s.previewValue, { color: "#16a34a" }]}>{preview.credit_transactions}</Text>
          </View>
          <View style={s.previewRow}>
            <Text style={s.previewLabel}>Debit Transactions</Text>
            <Text style={[s.previewValue, { color: "#dc2626" }]}>{preview.debit_transactions}</Text>
          </View>
        </View>

        <View style={s.infoNote}>
          <MaterialCommunityIcons name="information-outline" size={16} color={BLUE} />
          <Text style={s.infoNoteText}>
            Preview showing first 5 transactions. Download full statement to view all.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>Recent Transactions</Text>
          <View style={s.recentCard}>
            {preview.recent_transactions.map((tx: any, i: number) => (
              <View key={i} style={[s.recentRow,
                i < preview.recent_transactions.length - 1 && s.recentBorder]}
              >
                <View style={[s.recentIcon, {
                  backgroundColor: tx.is_credit ? "#dcfce7" : "#fee2e2",
                }]}>
                  <MaterialCommunityIcons
                    name={tx.is_credit ? "arrow-down" : "arrow-up"} size={14}
                    color={tx.is_credit ? "#16a34a" : "#dc2626"} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.recentDesc} numberOfLines={1}>{tx.description}</Text>
                  <Text style={s.recentDate}>{tx.date} · {tx.time}</Text>
                </View>
                <Text style={[s.recentAmount, { color: tx.is_credit ? "#16a34a" : "#dc2626" }]}>
                  {tx.is_credit ? "+" : "-"}₦{tx.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.generateBtn} onPress={onDownload}
          disabled={isGenerating} activeOpacity={0.8}
        >
          {isGenerating
            ? <ActivityIndicator size={20} color="#fff" />
            : <MaterialCommunityIcons name="download-outline" size={20} color="#fff" />}
          <Text style={s.generateBtnText}>
            {isGenerating ? "Generating..." : "Download Full Statement"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Success Screen
// ─────────────────────────────────────────────────────────────────────────────
function SuccessScreen({ data, format, sizeKb, onShare, onBack, insets }: any) {
  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity style={s.backBtn} onPress={onBack}>
          <MaterialCommunityIcons name="close" size={20} color={BRAND} />
        </TouchableOpacity>
        <View style={{ width: 36 }} />
      </View>
      <View style={s.successContent}>
        <View style={s.successIconWrap}>
          <View style={s.successFileIcon}>
            <MaterialCommunityIcons
              name={format === "pdf" ? "file-pdf-box" : "file-delimited-outline"} size={52}
              color={format === "pdf" ? "#dc2626" : "#16a34a"} />
          </View>
          <View style={s.successCheckBadge}>
            <MaterialCommunityIcons name="check-circle" size={28} color="#16a34a" />
          </View>
          <View style={[s.successDot, { top: 10, right: 40, backgroundColor: "#2563EB" }]} />
          <View style={[s.successDot, { top: 30, left: 30, backgroundColor: "#f59e0b", width: 8, height: 8 }]} />
          <View style={[s.successDot, { bottom: 20, right: 20, backgroundColor: "#16a34a", width: 6, height: 6 }]} />
        </View>
        <Text style={s.successTitle}>Statement Generated!</Text>
        <Text style={s.successSub}>Your account statement has been successfully generated.</Text>
        <View style={s.fileCard}>
          <View style={[s.fileIconWrap, {
            backgroundColor: format === "pdf" ? "#fee2e2" : "#dcfce7",
          }]}>
            <MaterialCommunityIcons
              name={format === "pdf" ? "file-pdf-box" : "file-delimited-outline"} size={28}
              color={format === "pdf" ? "#dc2626" : "#16a34a"} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.fileName}>{data.filename}</Text>
            <Text style={s.fileMeta}>
              Generated on {data.generated_at}{sizeKb > 0 ? ` · ${sizeKb} KB` : ""}
            </Text>
          </View>
        </View>
        <View style={s.successActions}>
          <TouchableOpacity style={s.shareBtn} onPress={onShare} activeOpacity={0.8}>
            <MaterialCommunityIcons name="share-variant-outline" size={18} color={BRAND_MID} />
            <Text style={s.shareBtnText}>Share Statement</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.downloadBtn} onPress={onShare} activeOpacity={0.8}>
            <MaterialCommunityIcons name="download-outline" size={18} color="#fff" />
            <Text style={s.downloadBtnText}>Download Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:       { flex: 1, backgroundColor: "#f8f9fb" },
  header:     { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  infoBtn:    { width: 36, height: 36, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:{ fontSize: 16, fontWeight: "700", color: BRAND },
  headerSub:  { fontSize: 11, color: "#9ca3af", marginTop: 1 },
  scroll:     { padding: 16, gap: 16, paddingBottom: 100 },
  walletCard:       { backgroundColor: BLUE, borderRadius: 18, padding: 18 },
  walletCardInner:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  walletCardTitle:  { flex: 1, fontSize: 14, fontWeight: "700", color: "#fff", marginLeft: 8 },
  walletLabel:      { fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 4 },
  walletBalanceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  walletBalance:    { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -1 },
  section:      { gap: 10 },
  sectionLabel: { fontSize: 14, fontWeight: "700", color: "#111827" },
  typeGrid:      { flexDirection: "row", gap: 10 },
  typeCard:      { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 12, alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: "#e5e7eb" },
  typeCardActive:{ borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  typeIconWrap:  { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  typeLabel:     { fontSize: 11, color: "#6b7280", textAlign: "center", fontWeight: "500" },
  typeCheck:     { position: "absolute", top: 6, right: 6, width: 18, height: 18, borderRadius: 9, justifyContent: "center", alignItems: "center" },
  rangeSelector:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fff", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  rangeSelectorText: { flex: 1, fontSize: 14, color: BRAND, fontWeight: "600" },
  dateRow:       { flexDirection: "row", alignItems: "center", gap: 8 },
  dateField:     { flex: 1, gap: 4 },
  dateFieldLabel:{ fontSize: 11, color: "#9ca3af", fontWeight: "600" },
  datePicker:    { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fff", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: "#e5e7eb" },
  datePickerText:{ fontSize: 13, color: BRAND, fontWeight: "600", flex: 1 },
  dateSeparator: { width: 16, height: 1, backgroundColor: "#d1d5db", marginTop: 20 },
  formatRow:        { flexDirection: "row", gap: 12 },
  formatCard:       { flex: 1, backgroundColor: "#fff", borderRadius: 14, padding: 14, alignItems: "center", gap: 6, borderWidth: 1.5, borderColor: "#e5e7eb" },
  formatCardActive: { borderColor: BLUE, backgroundColor: BLUE_LIGHT },
  formatLabel:      { fontSize: 13, color: "#6b7280", fontWeight: "500" },
  secureNote:  { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: BLUE_LIGHT, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#BFDBFE" },
  secureTitle: { fontSize: 13, fontWeight: "700", color: BRAND },
  secureSub:   { fontSize: 11, color: "#6b7280", marginTop: 2 },
  footer:         { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  generateBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 14 },
  generateBtnText:{ fontSize: 15, fontWeight: "700", color: "#fff" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalSheet:   { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  sheetHandle:  { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 16 },
  sheetTitle:   { fontSize: 17, fontWeight: "700", color: BRAND, marginBottom: 16 },
  rangeOption:     { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  rangeOptionText: { fontSize: 15, color: "#374151", fontWeight: "500" },
  previewCard:      { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0" },
  previewCardTitle: { fontSize: 14, fontWeight: "700", color: BRAND, marginBottom: 14 },
  previewRow:       { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8 },
  previewLabel:     { fontSize: 13, color: "#6b7280" },
  previewValue:     { fontSize: 13, fontWeight: "700", color: "#111827" },
  previewDivider:   { height: 1, backgroundColor: "#f0f0f0", marginVertical: 8 },
  previewGrid:      { flexDirection: "row", gap: 12, marginTop: 8 },
  previewGridItem:  { flex: 1 },
  previewValueLg:   { fontSize: 16, fontWeight: "800", color: BRAND, marginTop: 4 },
  infoNote:     { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: BLUE_LIGHT, borderRadius: 10, padding: 12 },
  infoNoteText: { flex: 1, fontSize: 12, color: BRAND_MID },
  recentCard:   { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "#f0f0f0" },
  recentRow:    { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  recentBorder: { borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  recentIcon:   { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  recentDesc:   { fontSize: 13, fontWeight: "600", color: "#111827" },
  recentDate:   { fontSize: 11, color: "#9ca3af", marginTop: 2 },
  recentAmount: { fontSize: 13, fontWeight: "700" },
  successContent:   { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  successIconWrap:  { position: "relative", width: 120, height: 120, justifyContent: "center", alignItems: "center", marginBottom: 24 },
  successFileIcon:  { width: 80, height: 80, backgroundColor: "#f3f4f6", borderRadius: 20, justifyContent: "center", alignItems: "center" },
  successCheckBadge:{ position: "absolute", bottom: 0, right: 0, backgroundColor: "#fff", borderRadius: 14 },
  successDot:       { position: "absolute", width: 10, height: 10, borderRadius: 5 },
  successTitle:     { fontSize: 22, fontWeight: "800", color: BRAND, marginBottom: 8, textAlign: "center" },
  successSub:       { fontSize: 13, color: "#6b7280", textAlign: "center", marginBottom: 28 },
  fileCard:     { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#f8f9fb", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e5e7eb", width: "100%", marginBottom: 32 },
  fileIconWrap: { width: 48, height: 48, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  fileName:     { fontSize: 13, fontWeight: "700", color: "#111827" },
  fileMeta:     { fontSize: 11, color: "#9ca3af", marginTop: 3 },
  successActions:  { width: "100%", gap: 12 },
  shareBtn:        { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderWidth: 1.5, borderColor: "#e5e7eb", borderRadius: 14, paddingVertical: 13 },
  shareBtnText:    { fontSize: 15, fontWeight: "700", color: BRAND_MID },
  downloadBtn:     { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: BLUE, borderRadius: 14, paddingVertical: 13 },
  downloadBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
