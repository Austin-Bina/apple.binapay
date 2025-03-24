import React from "react";
import { View, Text } from "react-native";
import { TransactionStatus } from "@enum/transaction";
import { getStatusColor, getStatusLabel } from "@helpers/transaction-status";
import { IconButton } from "react-native-paper";
import tw from "@lib/tailwind";

type StatusBadgeProps = {
  status: TransactionStatus;
  showIcon?: boolean;
  size?: "small" | "medium" | "large";
};

const StatusBadge: React.FC<StatusBadgeProps> = ({ 
  status, 
  showIcon = false, 
  size = "small" 
}) => {
  const iconName = {
    [TransactionStatus.Pending]: "clock-outline",
    [TransactionStatus.Failed]: "close-circle-outline",
    [TransactionStatus.Successful]: "check-circle-outline",
    [TransactionStatus.Cancelled]: "power-cycle",
    [TransactionStatus.Initiated]: "arrow-right-circle-outline",
    [TransactionStatus.Refunded]: "cash-refund",
  }[status] || "help-circle-outline";

  const sizeStyles = {
    small: tw`text-xs px-2 py-0.5`,
    medium: tw`text-sm px-3 py-1`,
    large: tw`text-base px-4 py-1.5`,
  }[size];

  return (
    <View style={[getStatusColor(status), tw`rounded-full flex-row items-center`]}>
      {showIcon && (
        <IconButton
          icon={iconName}
          size={size === "small" ? 12 : size === "medium" ? 16 : 20}
          style={tw`p-0 m-0`}
        />
      )}
      <Text style={[sizeStyles, tw`font-medium`]}>
        {getStatusLabel(status)}
      </Text>
    </View>
  );
};

export default StatusBadge; 
