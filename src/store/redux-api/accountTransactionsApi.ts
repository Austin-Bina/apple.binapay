import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { WalletTransaction } from "@type/transaction";

type RecentTransactionsResponse = {
  transactions: {
    [group: string]: WalletTransaction[];
  };
};

type TransactionResponse = {
  transactions: {
    [group: string]: WalletTransaction[];
  };
  meta: {
    has_more: boolean;
  };
};

type TransactionBody = {
  page: number;
};

export const accountTransactionsApi = createApi({
  reducerPath: "accountTransactions",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Transactions Summary", "Transactions"],
  endpoints: (builder) => ({
    fetchRecentTransactions: builder.query<RecentTransactionsResponse, void>({
      query: () => ({
        url: route("account.recentTransactions"),
      }),
      providesTags: [{ type: "Transactions Summary" }],
    }),
    fetchCompleteTransactions: builder.query<TransactionResponse, TransactionBody>({
      query: (params) => ({
        url: route("account.transactions"),
        params,
      }),
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      transformResponse: (response: TransactionResponse) => ({
        transactions: response.transactions ?? {},
        meta: response.meta ?? { has_more: false },
      }),
      providesTags: ["Transactions"],
      merge: (currentCache, newItems) => {
        const newGroupedTransactions = newItems.transactions;

        const mergedTransactions = { ...currentCache.transactions };

        Object.entries(newGroupedTransactions).forEach(([group, newTransactions]) => {
          if (!mergedTransactions[group]) {
            mergedTransactions[group] = [];
          }
          // Create a Set of existing transaction IDs in the current group
          const existingTransactionIds = new Set(mergedTransactions[group].map((t) => t.id));
          const uniqueNewTransactions = newTransactions.filter(
            (newTransaction) => !existingTransactionIds.has(newTransaction.id),
          );
          mergedTransactions[group] = [...mergedTransactions[group], ...uniqueNewTransactions];
        });

        return {
          ...newItems,
          transactions: mergedTransactions,
        };
      },
    }),
  }),
});

export const { useFetchRecentTransactionsQuery, useFetchCompleteTransactionsQuery } = accountTransactionsApi;
