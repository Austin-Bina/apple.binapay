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
          <Image source={require("@assets/images/money-and-coins.png")} width={245} style={tw`mx-auto mb-8`} />
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
