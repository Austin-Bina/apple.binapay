import { env } from "@env";
import { route } from "@helpers/route";
import { getAuthToken } from "@lib/security";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { CustomPagination } from "@type/app";
import { Transaction } from "@type/transaction";

type RecentTransactionsResponse = {
  transactions: {
    [group: string]: Transaction[];
  };
};

type TransactionResponse = {
  data: {
    [group: string]: Transaction[];
  };
  current_page: number;
  from: number | null;
  to: number | null;
  per_page: number;
  total: number;
};

type TransactionBody = {
  page: number;
  per_page: number;
};

export const accountTransactionsApi = createApi({
  reducerPath: "accountTransactions",
  baseQuery: fetchBaseQuery({
    baseUrl: env.BASE_URL,
    prepareHeaders: async (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      headers.set("Authorization", `Bearer ${await getAuthToken()}`);

      return headers;
    },
  }),
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
      providesTags: ["Transactions"],
      merge: (currentCache, newItems) => {
        return {
          ...newItems,
          transactions: {
            ...currentCache,
            ...newItems,
          },
        };
      },
    }),
  }),
});

export const { useFetchRecentTransactionsQuery, useFetchCompleteTransactionsQuery } = accountTransactionsApi;
