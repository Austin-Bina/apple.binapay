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

type SummaryParams = {
  period?: "today" | "week" | "month" | "all";
  from_date?: string;
  to_date?: string;
};

type SummaryResponse = {
  period: string;
  from: string | null;
  to: string | null;
  total_credit: string;
  total_debit: string;
  net_flow: string;
  credit_count: number;
  debit_count: number;
  total_count: number;
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

    // Inside endpoints:
fetchTransactionSummary: builder.query<SummaryResponse, SummaryParams>({
  query: (params) => ({
    url: route("account.transactionSummary"),
    params,
  }),
  providesTags: ["Transactions Summary"],
}),

  }),
});

export const { useFetchRecentTransactionsQuery, useFetchCompleteTransactionsQuery, useFetchTransactionSummaryQuery } = accountTransactionsApi;
