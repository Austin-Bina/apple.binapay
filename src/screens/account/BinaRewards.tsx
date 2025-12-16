import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import tw from "@lib/tailwind";
import { route } from "@helpers/route";
import { AccountStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { useGetReferralRewardsQuery } from "@store/redux-api/referralQueryApi";
import React, { useMemo } from "react";
import { View, FlatList, Image } from "react-native";
import { Text, Button, ActivityIndicator, Card } from "react-native-paper";
import { formatToNaira } from "@utils/money";

type Props = AccountStackScreenProps<"BinaPay Rewards">;

export default function BinaRewardsScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const { data, isFetching } = useGetReferralRewardsQuery({ page: 1, per_page: 1 });

  const reward = data?.data?.[0];
  const rewardPercentage = data?.meta?.reward_percentage ?? reward?.reward_percentage ?? 0;

  const sampleTradesUSD = [100, 2500, 10000];
  const nairaConversion = 1500;

  const rewardExamples = useMemo(
    () =>
      sampleTradesUSD.map((usd) => {
        const tradeNaira = usd * nairaConversion;
        const rewardEarned = tradeNaira * rewardPercentage;
        return {
          tradeUSD: usd,
          tradeNaira,
          reward: rewardEarned,
        };
      }),
    [rewardPercentage]
  );

  return (
    <Screen style={tw`flex-1 bg-white`}>
      <ScrollableView contentContainerStyle={tw`px-4 pt-6 pb-8`}>
        {/* Header Section */}
        <View style={tw`items-center mb-6`}>
         {/*} <Image
            source={require("@assets/images/money-and-coins.png")}
            style={[tw`mb-5`, { width: 180, height: 180, resizeMode: "contain" }]}
          /> */}
          <Text variant="titleLarge" style={tw`text-gray-900 font-bold text-center text-2xl`}>
            Earn Rewards on BinaPay
          </Text>
          <Text style={tw`text-gray-500 text-center mt-2 leading-6`}>
            Invite your friends to BinaPay and earn{" "}
            <Text style={tw`font-bold text-blue-600`}>{(rewardPercentage * 100).toFixed(2)}%</Text> of every trade they make!
          </Text>
        </View>

 {/* Reward Card */}
{isFetching ? (
  <View style={tw`my-6`}>
    <ActivityIndicator animating color={tw.color("blue-600")} size="large" />
  </View>
) : (
  <Card style={tw`bg-blue-700 rounded-3xl p-6 mb-6 shadow-lg`}>
    {/* Header */}
    <Text style={tw`text-white text-center text-2xl font-extrabold mb-4`}>
      Earn {formatToNaira(rewardPercentage * nairaConversion)} for every $1 your friend trades!
    </Text>

    {/* Examples */}
    <Text style={tw`text-white font-semibold mb-2`}>Examples:</Text>
    {rewardExamples.slice(0, 2).map((ex, index) => (
      <Text
        key={ex.tradeUSD}
        style={tw`text-white/90 text-xs mb-1`}
      >
         💰 Your referral trades ${ex.tradeUSD} (₦{ex.tradeNaira.toLocaleString()}). 
        You earn {(rewardPercentage * 100).toFixed(2)}% of this amount, which is 
        <Text style={tw`text-yellow-300 font-bold`}> ₦{ex.reward.toLocaleString()}</Text>.
      </Text>
    ))}
  </Card>
)}



        {/* How It Works Section */}
        <Card style={tw`rounded-2xl bg-gray-50 p-4 mb-5 shadow-md`}>
          <Text style={tw`text-gray-700 font-semibold text-base mb-2`}>How It Works</Text>
          <View style={tw`space-y-1`}>
            <Text style={tw`text-gray-500 text-sm leading-relaxed`}>
              • Share your referral link with friends.
            </Text>
            <Text style={tw`text-gray-500 text-sm leading-relaxed`}>
              • When they sign up and trade, you earn {(rewardPercentage * 100).toFixed(2)}% of their trade(sell) volume instantly.
            </Text>
            <Text style={tw`text-gray-500 text-sm leading-relaxed`}>
              • Track your progress anytime on the “View Earnings” page.
            </Text>
          </View>
        </Card>

        {/* Referral Links */}
        {user?.affiliate_id && (
          <View style={tw`items-center gap-3 mb-5`}>
            <CopyReferralCode
              referralCode={`${route("auth.register", { type: "web" })}?ref=${user.affiliate_id}`}
              labelText={`Copy Link: ${user.affiliate_id}`}
            />
            <CopyReferralCode referralCode={user.affiliate_id} labelText="Copy Code Only" />
          </View>
        )}

        {/* View Earnings Button */}
        <Button
          mode="contained"
          onPress={() => navigation.navigate("Earning Summary")}
          contentStyle={tw`py-3`}
          labelStyle={tw`text-white text-base font-bold`}
          style={tw`w-full rounded-full bg-blue-600`}
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
