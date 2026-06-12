import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Avatar, Text } from "react-native-paper";
import { format } from "date-fns";
import tw from "@lib/tailwind";
import StatusBadge from "./StatusBadge";
import { WalletTransaction } from "@type/transaction";
import { getTransactionIcon } from "@utils/index";
import { getTransactionStatus, formatDescription } from "@helpers/transaction";
import { formatTransactionAmount } from "../../../utils/transactionutils";
import { useSelector } from "react-redux";
import { selectUser } from "@store/selectors/auth";

type Props = {
  transaction: WalletTransaction;
  onPress?: () => void;
  compact?: boolean;
};

const getAmountStyle = (transaction: WalletTransaction) => {
  if (transaction.type === "deposit")  return { color: tw.color("black-100"), prefix: "" };
  if (transaction.type === "withdraw") return { color: tw.color("red-600"),   prefix: "" };
  return { color: tw.color("gray-900"), prefix: "" };
};

const TransactionRow: React.FC<Props> = ({ transaction, onPress, compact = false }) => {
  const user = useSelector(selectUser);
  const cryptoAssets = user?.crypto_assets ?? [];
  
  const status     = getTransactionStatus(transaction);
  const amountMeta = getAmountStyle(transaction);
  const icon       = getTransactionIcon(transaction, cryptoAssets);
  const imageSource = typeof icon === "string" ? { uri: icon } : icon;
console.log('provider:', transaction.payment_transaction?.utilityTransaction?.details?.provider);
console.log('meta:', JSON.stringify(transaction.meta));
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={tw.style(
        "flex-row justify-between items-start bg-white rounded-lg",
        compact ? "p-3" : "p-4",
        !compact && "shadow-sm"
      )}
    >
      <View style={tw`flex-row flex-1 items-start gap-3`}>
        <Avatar.Image
          size={compact ? 36 : 40}
          source={imageSource as any}
          style={tw`bg-transparent`}
        />
        <View style={tw`flex-1`}>
          <Text numberOfLines={1} style={tw`text-gray-900 font-medium text-sm`}>
          {formatDescription(transaction.meta?.description)}
          </Text>
          <Text style={tw`text-gray-500 text-xs mt-1`}>
            {format(transaction.created_at, "MMM dd, yyyy h:mm a")}
          </Text>
        </View>
      </View>

      <View style={tw`items-end ml-3`}>
        <Text style={[tw`font-semibold text-sm`, { color: amountMeta.color }]}>
          {amountMeta.prefix}{formatTransactionAmount(transaction)}
        </Text>
        <View style={tw`mt-1`}>
          <StatusBadge status={status} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default TransactionRow;
