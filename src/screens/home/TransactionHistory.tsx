import { TransactionEmptyState } from "@components/ui/empty-states/transaction-list";
import TransactionLoader from "@components/ui/loaders/transaction-loader";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import { navigateToTransaction, getTransactionStatus } from "@helpers/transaction";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import { useFetchCompleteTransactionsQuery } from "@store/redux-api/accountTransactionsApi";
import { WalletTransaction } from "@type/transaction";
import { getTransactionIcon } from "@utils/index";
import { convertToNaira } from "@utils/money";
import { format } from "date-fns";
import React, { Fragment, useCallback, useMemo, useState } from "react";
import { FlatList, TouchableOpacity, View } from "react-native";
import { ActivityIndicator, Avatar, Divider, Text } from "react-native-paper";
import StatusBadge from "@components/ui/transaction/StatusBadge";

type Props = HomeStackScreenProps<"Transaction History">;

export default function TransactionHistoryScreen({}: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [page, setPage] = useState(1);

  const { data: queryData, isLoading, isFetching, refetch } = useFetchCompleteTransactionsQuery({ page });

  const transactionsData = useMemo(() => {
    if (!queryData) {
      return {
        transactions: {},
        meta: {
          has_more: false,
        },
      };
    }

    return queryData;
  }, [queryData]);

  const onEndReached = useCallback(() => {
    if (!isFetching && transactionsData.meta.has_more) {
      setPage((prevPage) => prevPage + 1);
    }
  }, [isFetching, transactionsData]);

  const dynamicContent = useMemo(() => {
    if (isLoading) {
      return <TransactionLoader />;
    }

    if (Object.entries(transactionsData.transactions).length === 0) {
      return <TransactionEmptyState />;
    }

    const renderMoreLoader = () => {
      return (
        <View style={tw`items-center h-full pt-2 bg-white`}>
          {transactionsData.meta.has_more ? (
            <View style={tw`flex-row items-center gap-2`}>
              <ActivityIndicator size="small" color={"gray"} animating={true} />
              <Text style={tw`text-gray-300`}>Loading more transactions...</Text>
            </View>
          ) : (
            <Text style={tw`text-gray-300`}>All Transactions loaded 🎉</Text>
          )}
        </View>
      );
    };

    const onSelectTransaction = async (item: WalletTransaction) => {
      navigateToTransaction({
        transactionId: item.id,
        onStart: () => {
          setIsProcessing(true);
        },
        onFinish: () => {
          setIsProcessing(false);
        },
      });
    };

    return (
      <Fragment>
        <FlatList
          keyExtractor={([group]) => group}
          data={Object.entries(transactionsData.transactions)}
          renderItem={({ item: [group, transactions] }) => (
            <View key={group}>
              <Text variant="titleMedium" style={tw`text-gray-900`}>
                {group}
              </Text>

              {transactions.map((transaction, index) => (
                <Fragment key={transaction.id}>
                  <TransactionItem key={transaction.id} item={transaction} onSelectTransaction={onSelectTransaction} />
                  {index !== transactions.length - 1 && <Divider />}
                </Fragment>
              ))}
            </View>
          )}
          contentInsetAdjustmentBehavior="automatic"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tw`pb-4`}
          refreshing={false}
          onRefresh={refetch}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderMoreLoader}
          onEndReached={onEndReached}
        />
        <PleaseWaitModal visible={isProcessing} />
      </Fragment>
    );
  }, [transactionsData, isProcessing, isLoading, refetch, onEndReached]);

  return (
    <Screen style={tw`pb-0`}>
      <Text variant="titleLarge" style={tw`text-gray-800 font-bold px-4 py-5`}>
        Transaction History
      </Text>
      <View style={tw`px-4 flex-1`}>{dynamicContent}</View>
    </Screen>
  );
}

type TransactionItemProps = {
  item: WalletTransaction;
  onSelectTransaction: (transaction: WalletTransaction) => void;
};

const TransactionItem = React.memo<TransactionItemProps>(({ item, onSelectTransaction }) => (
  <TouchableOpacity
    onPress={() => onSelectTransaction(item)}
    style={tw`flex-row items-center gap-2 p-2 my-2 bg-white`}>
    <Fragment>
      <Avatar.Image
        size={40}
        source={{
          uri: getTransactionIcon(item),
        }}
        style={tw`bg-transparent`}
      />
      <View style={tw`flex-1 mx-3`}>
        <Text style={tw`text-gray-900 text-sm`}>{item.meta.description}</Text>
        <View style={tw`flex-row items-center gap-2`}>
          <Text style={tw`text-gray-500 text-xs`}>{format(item.created_at, "MMM dd, yyyy h:mm a")}</Text>
          <StatusBadge status={getTransactionStatus(item)} />
        </View>
      </View>
      <Text style={tw`text-gray-900 font-semibold`}>{convertToNaira(item.amount, true)}</Text>
    </Fragment>
  </TouchableOpacity>
));
