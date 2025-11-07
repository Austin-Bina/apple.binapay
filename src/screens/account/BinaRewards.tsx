import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import tw from "@lib/tailwind";
import { route } from "@helpers/route";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { useGetReferralRewardsQuery } from "@store/redux-api/referralQueryApi";
import React from "react";
import { View, Image } from "react-native";
import { Text, Button, ActivityIndicator } from "react-native-paper";
import { formatToNaira } from "@utils/money";

type Props = AccountStackScreenProps<"BinaPay Rewards">;

export default function BinaRewardsScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const { data, isFetching } = useGetReferralRewardsQuery({ page: 1, per_page: 1 });

  const reward = data?.data?.[0];
  const totalRewardCap =
    data?.meta?.max_reward_cap ?? reward?.max_reward_cap ?? 0;
  const rewardPerTrade =
    data?.meta?.reward_per_withdrawal ?? reward?.reward_per_withdrawal ?? 0;

  return (
    <Screen style={tw`flex-1 bg-white`}>
      <ScrollableView contentContainerStyle={tw`px-4 pt-6 pb-8`}>
        <View style={tw`items-center mb-5`}>
        {/*}  <Image
            source={require("@assets/images/money-and-coins.png")}
            style={[tw`mb-5`, { width: 230, height: 230, resizeMode: "contain" }]}
          />
*/}
          <Text variant="titleLarge" style={tw`text-gray-900 font-bold text-center`}>
            Earn Rewards on BinaPay
          </Text>

          <Text style={tw`text-gray-500 text-center mt-2 leading-6`}>
            Invite your friends to BinaPay and earn rewards when they trade with us.
            The more they trade, the more you earn!
          </Text>
        </View>

        {isFetching ? (
          <View style={tw`my-6`}>
            <ActivityIndicator animating color={tw.color("blue-600")} />
          </View>
        ) : (
          <View style={tw`bg-blue-600 rounded-2xl p-3 mb-3 shadow-md`}>
  <Text style={tw`text-2xl text-white font-extrabold text-center`}>
    Earn {formatToNaira(totalRewardCap)} Per Referral 🎉
  </Text>
  <Text style={tw`text-white/80 text-sm text-center mt-2`}>
    Get {formatToNaira(rewardPerTrade)} each time your referral completes a trade —
    until you reach {formatToNaira(totalRewardCap)} in total rewards per referral.
  </Text>
</View>

        )}

        <View style={tw`border border-gray-200 rounded-xl bg-gray-50 p-4 mb-5`}>
          <Text style={tw`text-sm font-semibold text-gray-700 mb-1`}>
            How It Works
          </Text>
          <Text style={tw`text-xs text-gray-500 leading-relaxed`}>
            • Share your referral link with friends.{"\n"}
            • When they sign up and complete a trade, you earn {formatToNaira(rewardPerTrade)} instantly.{"\n"}
            • Keep earning until you reach {formatToNaira(totalRewardCap)} on each referral.{"\n"}
            • Track your rewards anytime in the “View Earnings” page.
          </Text>
        </View>

        {user?.affiliate_id && (
          <View style={tw`items-center gap-3`}>
            {/* Referral Link */}
            <CopyReferralCode
              referralCode={`${route("auth.register", { type: "web" })}?ref=${user.affiliate_id}`}
              labelText="Copy Referral Link"
            />

            {/* Referral Code */}
            <CopyReferralCode
              referralCode={user.affiliate_id}
              labelText="Copy Code Only"
            />
          </View>
        )}

        <Button
          mode="contained"
          onPress={() => navigation.navigate("Earning Summary")}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-base font-bold`}
          style={tw`w-full rounded-full mt-6 bg-blue-600`}
        >
          View Earnings
        </Button>
      </ScrollableView>
    </Screen>
  );
}


/*

import Screen from "@components/ui/shared/Screen";
import tw from "@lib/tailwind";
import { AccountStackScreenProps } from "@navigators/types";
import React from "react";
import { View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { route } from "@helpers/route";

type Props = AccountStackScreenProps<"BinaPay Rewards">;

export default function BinaRewardsScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);

  
  return (
    <Screen style={tw`pb-5`}>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View>
          <Image source={require("@assets/images/money-and-coins.png")} width={245} style={tw`mx-auto mb-5`} />
          <Text variant="titleLarge" style={tw`text-center text-gray-800 font-bold`}>
            Get Reward on BinaPay
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-500 text-center mt-2`}>
            Our referral program allows you to earn exciting benefits for every successful referral you make. Spread the
            word and reap the rewards together!
          </Text>
          {user?.affiliate_id && (
            <CopyReferralCode
              referralCode={`${route("auth.register", { type: "web" })}?ref=${user.affiliate_id}`}
              labelText="Copy Link"
            />
          )}
          {user?.affiliate_id && <CopyReferralCode referralCode={user.affiliate_id} />}
        </View>

        <Button
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-center text-base font-bold`}
          onPress={() => {
            navigation.navigate("Earning Summary");
          }}
          mode="contained">
          View Earnings
        </Button>
      </ScrollableView>
    </Screen>
  );
}
*/
