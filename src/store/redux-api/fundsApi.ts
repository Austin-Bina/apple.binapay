import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";

export type Bank = {
  name: string;
  code: string;
};

export type ResolveAccountResponse = {
  is_valid: boolean;
  account_name?: string;
  message?: string;
};

export type WithdrawalFeeSettings = {
  fee_type: "flat" | "percent";
  fee_amount: number;
  min_withdrawal: number;
  max_withdrawal: number;
};

export type SendMoneyPayload = {
  amount: number;
  account_number: string;
  bank_code: string;
  account_name: string;
  bank_name: string;
  narration?: string;
  otp?: string;
  biometric?: boolean;
  biometric_token?: string;
  idempotency_key?: string;
};

// ── Crypto withdrawal types ───────────────────────────────────────────────────

export type CryptoWithdrawalOtpPayload = {
  asset_id: string;
  network_id: string;
  amount: string;
};

export type CryptoWithdrawalPayload = {
  crypto_type: string;
  crypto_asset_id: string;
  crypto_network_id: string;
  wallet_address: string;
  network_slug: string;
  amount: string;
  otp?: string;
  biometric?: boolean;
  biometric_token?: string;
  idempotency_key?: string;
};

export type CryptoDepositPayload = {
  crypto_asset_id: number;
  crypto_network_id: string;
  tx_hash: string;
  amount?: number | null;
};

export const fundsApi = createApi({
  reducerPath: "fundsApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["BankList", "FeeSettings"],
  endpoints: (builder) => ({

    getBankList: builder.query<{ success: boolean; data: Bank[] }, void>({
      query: () => ({ url: "/api/v1/user/banks", method: "GET" }),
      providesTags: ["BankList"],
      keepUnusedDataFor: 86400,
    }),

    resolveAccount: builder.mutation<ResolveAccountResponse, { account_number: string; bank_code: string }>({
      query: (body) => ({ url: "/api/v1/user/banks/resolve", method: "POST", data: body }),
    }),

    getFeeSettings: builder.query<WithdrawalFeeSettings, void>({
      query: () => ({ url: "/api/v1/user/wallet", method: "GET" }),
      transformResponse: (res: any) => ({
        fee_type:       res.fee_type,
        fee_amount:     res.fee_amount,
        min_withdrawal: res.min_withdrawal,
        max_withdrawal: res.max_withdrawal,
      }),
      providesTags: ["FeeSettings"],
      keepUnusedDataFor: 0,
    }),

    sendWithdrawalOtp: builder.mutation<{ success: boolean; message: string }, void>({
      query: () => ({ url: "/api/v1/withdraw/naira/send-otp", method: "POST" }),
    }),

    submitWithdrawal: builder.mutation<{ success: boolean; message?: string; error?: string }, SendMoneyPayload>({
      query: (body) => ({ url: "/api/v1/withdraw/naira", method: "POST", data: body }),
    }),

    // ── Crypto ──────────────────────────────────────────────────────────────

    sendCryptoWithdrawalOtp: builder.mutation<{ success: boolean; message: string }, CryptoWithdrawalOtpPayload>({
      query: (body) => ({ url: "/api/v1/withdraw/crypto/send-otp", method: "POST", data: body }),
    }),

    submitCryptoWithdrawal: builder.mutation<{ success: boolean; message?: string; error?: string }, CryptoWithdrawalPayload>({
      query: (body) => ({ url: "/api/v1/withdraw/crypto", method: "POST", data: body }),
    }),

    submitCryptoDeposit: builder.mutation<{ success: boolean; message?: string }, CryptoDepositPayload>({
  query: (body) => ({ url: "/api/v1/crypto-deposits", method: "POST", data: body }),
}),
  }),
});

export const {
  useGetBankListQuery,
  useResolveAccountMutation,
  useGetFeeSettingsQuery,
  useSendWithdrawalOtpMutation,
  useSubmitWithdrawalMutation,
  useSendCryptoWithdrawalOtpMutation,
  useSubmitCryptoWithdrawalMutation,
  useSubmitCryptoDepositMutation,
} = fundsApi;
