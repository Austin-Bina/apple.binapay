import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { ReferralReward, ReferralMeta, ReferralLeaderboardItem } from "@type/user";

type ReferralRewardsResponse = {
  data: ReferralReward[];
  meta: ReferralMeta;
};

type ReferralRewardBody = {
  page: number;
  per_page: number;
};

type WithdrawRewardResponse = {
  success: boolean;
  message: string;
  amount: number;
};

export const referralQueryApi = createApi({
  reducerPath: "referralApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Referral Rewards"],
  endpoints: (builder) => ({
    getReferralRewards: builder.query<ReferralRewardsResponse, ReferralRewardBody>({
      query: ({ page, per_page }) => ({
        url: route("account.referralActivities"),
        params: { page, per_page },
      }),
      serializeQueryArgs: ({ endpointName }) => endpointName,
      forceRefetch({ currentArg, previousArg }) {
        return currentArg !== previousArg;
      },
      transformResponse: (response: any) => ({
        data: response.data ?? [],
        meta: response.meta ?? { has_more: false, total: 0, total_earnings: 0 },
      }),
      merge: (currentCache, newItems) => {
        const mergedData = [
          ...currentCache.data,
          ...newItems.data.filter(
            (newItem) => !currentCache.data.some((existingItem) => existingItem.id === newItem.id)
          ),
        ];
        return { ...newItems, data: mergedData };
      },
    }),

    // NEW: leaderboard endpoint
   getReferralLeaderboard: builder.query<ReferralLeaderboardItem[], { limit?: number; filter?: string }>({
  query: ({ limit = 20, filter = "overall" }) => ({
    url: "/api/v1/account/referrals/leaderboard",
    params: { limit, filter },
  }),
  transformResponse: (response: any) => response.data ?? [],
}),


withdrawRewardBalance: builder.mutation<WithdrawRewardResponse, void>({
      query: () => ({
        url: "/api/v1/withdraw/reward",
        method: "POST",
      }),
      invalidatesTags: ["Referral Rewards"],
    }),
  }),
});

export const { useGetReferralRewardsQuery, useGetReferralLeaderboardQuery, useWithdrawRewardBalanceMutation } = referralQueryApi;


