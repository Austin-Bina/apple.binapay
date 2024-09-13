import { env } from "@env";
import { route } from "@helpers/route";
import { getAuthToken } from "@lib/security";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ReferralReward } from "@type/user";

type ReferralRewardsResponse = {
  data: ReferralReward[];
  meta: { has_more: boolean, total_earnings: number };
};

type ReferralRewardBody = {
  page: number;
  per_page: number;
};

export const referralQueryApi = createApi({
  reducerPath: "referralApi",
  baseQuery: fetchBaseQuery({
    baseUrl: env.BASE_URL,
    prepareHeaders: async (headers) => {
      headers.set("Content-Type", "application/json");
      headers.set("Accept", "application/json");
      headers.set("Authorization", `Bearer ${await getAuthToken()}`);

      return headers;
    },
  }),
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
      transformResponse: (response: any) => ({
        data: response.data ?? [],
        meta: response.meta ?? { has_more: false },
      }),
      merge: (currentCache, newItems) => {
        return {
          ...newItems,
          data: {
            ...currentCache.data,
            ...newItems.data,
          },
        };
      },
    }),
  }),
});

export const { useGetReferralRewardsQuery } = referralQueryApi;
