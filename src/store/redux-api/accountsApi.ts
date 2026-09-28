
import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { DVA } from "@type/user";


export type FundingAccount = DVA & {
    funding_reference?: string | null;
    display_funding_reference?: boolean;
};

type ListAccountResponse = {
    accounts: FundingAccount[];
    canCreateMore: boolean;
    how_it_works?: string[];
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
