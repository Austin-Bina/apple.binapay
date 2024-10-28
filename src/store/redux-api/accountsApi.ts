
import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { DVA } from "@type/user";

type ListAccountResponse = {
    accounts: DVA[];
    canCreateMore: boolean;
};

export const accountsApi = createApi({
    reducerPath: "accountsApi",
    baseQuery: axiosBaseQuery(),
    tagTypes: ["Account"],
    endpoints: (builder) => ({
        listAccounts: builder.query<ListAccountResponse, void>({
            query: () => ({ url: route("bank.listDedicatedAccounts") }),
            providesTags: ["Account"],
        }),
        createAccount: builder.mutation({
            query: () => ({
                url: route("bank.createDedicatedAccounts"),
                method: "POST",
            }),
            invalidatesTags: ["Account"],
        }),
    }),
});

export const { useListAccountsQuery, useCreateAccountMutation } = accountsApi;
