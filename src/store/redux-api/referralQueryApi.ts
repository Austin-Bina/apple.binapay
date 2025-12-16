// src/store/redux-api/referralQueryApi.ts
import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { ReferralReward } from "@type/user";
import { ReferralLeaderboardItem } from "@type/user";

type ReferralRewardsResponse = {
  data: ReferralReward[];
  meta: {
    has_more: boolean;
    total: number;
    total_earnings: number;
    max_reward_cap: number;
    reward_per_withdrawal: number;
    reward_percentage: number;
    total_trading_volume: number;
    total_volume: number;
  };
};

type ReferralRewardBody = {
  page: number;
  per_page: number;
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

  }),
});

export const { useGetReferralRewardsQuery, useGetReferralLeaderboardQuery } = referralQueryApi;



/*
import { route } from "@helpers/route";
import { axiosBaseQuery } from "@lib/api";
import { createApi } from "@reduxjs/toolkit/query/react";
import { ReferralReward } from "@type/user";

type ReferralRewardsResponse = {
  data: ReferralReward[];
  meta: { has_more: boolean; total: number; total_earnings: number, 
    max_reward_cap: number, reward_per_withdrawal: number, reward_percentage: number, total_trading_volume: number, total_volume: number, };
};

type ReferralRewardBody = {
  page: number;
  per_page: number;
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
      serializeQueryArgs: ({ endpointName }) => {
        return endpointName;
      },
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
                (newItem) => !currentCache.data.some((existingItem) => existingItem.id === newItem.id),
            ),
        ];

        return {
            ...newItems,
            data: mergedData,
        };
    },
    }),
  }),
  
});

export const { useGetReferralRewardsQuery } = referralQueryApi;
*/
