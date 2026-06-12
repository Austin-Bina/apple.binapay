import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";

export type KycLimits = {
  kyc_tier: number;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  is_bvn_verified: boolean;
  is_nin_verified: boolean;
  is_face_verified: boolean;
  is_address_verified: boolean;
  daily_transfer_limit: number;
  per_txn_limit: number;
  wallet_balance_limit: number;
  tier_limits: Record<number, {
    daily_transfer_limit: number;
    per_txn_limit: number;
    wallet_balance_limit: number;
  }>;
};

export const kycApi = createApi({
  reducerPath: "kycApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["KycLimits"],
  endpoints: (builder) => ({

    getLimits: builder.query<{ success: boolean; data: KycLimits }, void>({
      query: () => ({ url: "/api/v1/kyc/limits", method: "GET" }),
      providesTags: ["KycLimits"],
      keepUnusedDataFor: 0,
    }),

    sendPhoneOtp: builder.mutation<{ message: string }, { phone: string }>({
      query: (body) => ({ url: "/api/v1/kyc/phone/send-otp", method: "POST", data: body }),
    }),

    verifyPhoneOtp: builder.mutation<any, { otp: string }>({
      query: (body) => ({ url: "/api/v1/kyc/phone/verify-otp", method: "POST", data: body }),
      invalidatesTags: ["KycLimits"],
    }),

    verifyBvn: builder.mutation<any, { bvn: string; account_number: string; bank_code: string }>({
      query: (body) => ({ url: "/api/v1/kyc/verify-bvn", method: "POST", data: body }),
      invalidatesTags: ["KycLimits"],
    }),

    verifyNin: builder.mutation<any, { nin: string }>({
      query: (body) => ({ url: "/api/v1/kyc/verify-nin", method: "POST", data: body }),
      invalidatesTags: ["KycLimits"],
    }),

    submitTier2: builder.mutation<any, { bvn: string; selfie: string }>({
      query: (body) => ({ url: "/api/v1/kyc/tier2", method: "POST", data: body }),
      invalidatesTags: ["KycLimits"],
    }),

    submitTier3: builder.mutation<any, { address: string; proof: string }>({
      query: (body) => ({ url: "/api/v1/kyc/tier3", method: "POST", data: body }),
      invalidatesTags: ["KycLimits"],
    }),
  }),
});

export const {
  useGetLimitsQuery,
  useSendPhoneOtpMutation,
  useVerifyPhoneOtpMutation,
  useVerifyBvnMutation,
  useVerifyNinMutation,
  useSubmitTier2Mutation,
  useSubmitTier3Mutation,
} = kycApi;
