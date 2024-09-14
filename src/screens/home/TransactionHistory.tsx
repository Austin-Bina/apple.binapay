import { TransactionEmptyState } from "@components/ui/empty-states/transaction-list";
import NotificationItemLoader from "@components/ui/loaders/notification-item";
import TransactionLoader from "@components/ui/loaders/transaction-loader";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import { useFetchCompleteTransactionsQuery } from "@store/redux-api/accountTransactionsApi";
import { convertToNaira } from "@utils/money";
import { format } from "date-fns";
import React, { Fragment, useMemo } from "react";
import {  TouchableOpacity, View } from "react-native";
import { Avatar, Divider, Text } from "react-native-paper";

type Props = HomeStackScreenProps<"Transaction History">;

export default function TransactionHistoryScreen({}: Props) {
  const { data: queryData, isLoading } = useFetchCompleteTransactionsQuery({
    page: 1,
    per_page: 10,
  });

  const { data: transactions } = queryData || {};

  const dynamicContent = useMemo(() => {
    if (isLoading) {
      return <TransactionLoader />;
    }

    if (!transactions || Object.entries(transactions).length === 0) {
      return <TransactionEmptyState />;
    }

    return (
      <View>
        {Object.entries(transactions).map(([group, transactions]) => (
          <View key={group}>
            <Text variant="titleMedium" style={tw`text-gray-900`}>
              {group}
            </Text>

            {transactions.map((transaction, index) => (
              <Fragment key={transaction.id}>
                <TouchableOpacity
                  key={transaction.id}
                  onPress={() => {}}
                  style={tw`flex-row items-center justify-between gap-2 p-2 my-2`}>
                  <Fragment>
                    <Avatar.Image
                      size={40}
                      source={{
                        uri: "url",
                      }}
                      style={tw`bg-gray-300`}
                    />
                    <View style={tw`flex-1 mx-3`}>
                      <Text style={tw`text-gray-900 text-sm`}>{transaction.meta.description}</Text>
                      <Text style={tw`text-gray-500 text-xs`}>
                        {format(transaction.created_at, "MMM dd, yyyy h:mm a")}
                      </Text>
                    </View>
                    <Text style={tw`text-gray-900 font-semibold`}>{convertToNaira(transaction.amount, true)}</Text>
                  </Fragment>
                </TouchableOpacity>
                {index !== transactions.length - 1 && <Divider />}
              </Fragment>
            ))}
          </View>
        ))}
      </View>
    );
  }, [transactions, isLoading]);

  return (
    <Screen>
      <ScrollableView style={tw`px-4`} showsVerticalScrollIndicator={false}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold mt-5 `}>
          Transaction History
        </Text>
        {dynamicContent}
      </ScrollableView>
    </Screen>
  );
}
