import { SadFace } from "@components/icons/svg";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import React from "react";
import { View } from "react-native";
import { Card, Text } from "react-native-paper";
import { scale } from "react-native-size-matters";

export const TransactionEmptyState = () => {
  return (
    <Card mode="contained" style={tw`bg-transparent`}>
      <Card.Content style={tw`items-center`}>
        <View style={tw`justify-center h-16 w-16 items-center p-4 bg-secondary-50 rounded-3xl`}>
          <SadFace fill={Colors.secondary[500]} width={scale(30)} height={scale(30)} />
        </View>
        <Text style={tw`font-medium text-lg text-gray-500 text-center`}>No Transactions!</Text>
        <Text style={tw`text-xs text-gray-400 text-center`}>
          No recent transactions. Your financial world is quiet at the moment.
        </Text>
      </Card.Content>
    </Card>
  );
};
