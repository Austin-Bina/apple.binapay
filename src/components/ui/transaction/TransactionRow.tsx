import React from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { format } from "date-fns";
import { WalletTransaction } from "@type/transaction";
import { getTransactionIcon } from "@utils/index";
import { getTransactionStatus, formatDescription } from "@helpers/transaction";
import { formatTransactionAmount } from "@utils/transactionutils";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";
import { Image } from "react-native-element-image";
import { TransactionStatus } from "@enum/transaction";
import { Avatar } from "react-native-paper";

const BRAND = "#0d1b4b";
const BLUE  = "#2563EB";

type Props = {
  transaction: WalletTransaction;
  onPress?: () => void;
  compact?: boolean;
};

const getAmountColor = (transaction: WalletTransaction, status: string) => {
  if (transaction.type === "deposit") return "#16a34a";
  if (status === TransactionStatus.Failed || status === "failed") return "#dc2626";
  return "#111827"; // dark for normal withdrawals
};



const statusDot = (status: string) => {
  if (status === TransactionStatus.Pending || ["pending", "processing", "submitted"].includes(status))
    return "#d97706";
  if (status === TransactionStatus.Failed || status === "failed")
    return "#dc2626";
  return "#16a34a";
};

const statusLabel = (status: string) => {
  if (status === TransactionStatus.Pending || ["pending", "processing", "submitted"].includes(status))
    return "Processing";
  if (status === TransactionStatus.Failed || status === "failed")
    return "Failed";
  return "Successful";
};

const TransactionRow: React.FC<Props> = ({ transaction, onPress, compact = false }) => {
  const user         = useSelector(selectUser);
  const cryptoAssets = user?.crypto_assets ?? [];

  const status      = getTransactionStatus(transaction);
  const icon        = getTransactionIcon(transaction, cryptoAssets);
  const imageSource = typeof icon === "string" ? { uri: icon } : icon;
  const amountColor = getAmountColor(transaction, status);
  const dotColor    = statusDot(status);
  const label       = statusLabel(status);

  // Subtitle: show relevant context based on transaction form
  const form = transaction.meta?.form ?? "";
  const getSubtitle = () => {
    const meta = transaction.meta ?? {};
    if (form === "naira_withdrawal" || form === "naira_deposit") {
      return meta.transfer_details?.bank_name ?? meta.description ?? "";
    }
    if (form === "data_purchase")     return meta.data_amount ? `${meta.data_amount} Data` : meta.description ?? "";
    if (form === "airtime_purchase")  return meta.phone ?? meta.description ?? "";
    if (form === "electricity_bill")  return meta.meter_number ?? meta.description ?? "";
    if (form === "p2p_auto_payment")  return "P2P Trade";
    if (form?.includes("crypto"))     return meta.crypto_asset_symbol ?? meta.description ?? "";
    return meta.description ?? "";
  };

  const subtitle = getSubtitle();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[s.row, compact && s.rowCompact]}
    >
      {/* Icon */}
      <Avatar.Image
  size={44}
  source={imageSource as any}
  style={{ backgroundColor: "#EEF3FF" }}
/>

      {/* Title + subtitle */}
      <View style={s.middle}>
        <Text numberOfLines={1} style={s.title}>
          {formatDescription(transaction.meta?.description)}
        </Text>
        {!!subtitle && subtitle !== transaction.meta?.description && (
          <Text numberOfLines={1} style={s.subtitle}>{subtitle}</Text>
        )}
        <Text style={s.date}>
          {format(new Date(transaction.created_at), "MMM dd · h:mm a")}
        </Text>
      </View>

      {/* Amount + status */}
      <View style={s.right}>
        <Text style={[s.amount, { color: amountColor }]}>
          {formatTransactionAmount(transaction)}
        </Text>
        <View style={s.statusRow}>
          <View style={[s.dot, { backgroundColor: dotColor }]} />
          <Text style={[s.statusText, { color: dotColor }]}>{label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  row:        { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#fff", gap: 12 },
  rowCompact: { paddingVertical: 10 },

 
  middle:     { flex: 1 },
  title:      { fontSize: 14, fontWeight: "600", color: "#111827", marginBottom: 2 },
  subtitle:   { fontSize: 12, color: "#6b7280", marginBottom: 2 },
  date:       { fontSize: 11, color: "#9ca3af" },

  right:      { alignItems: "flex-end", gap: 4 },
  amount:     { fontSize: 14, fontWeight: "700" },
  statusRow:  { flexDirection: "row", alignItems: "center", gap: 4 },
  dot:        { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: "600" },
});

export default TransactionRow;
