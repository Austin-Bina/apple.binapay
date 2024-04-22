import Screen from "@components/shared/Screen";
import ScrollableView from "@components/shared/ScrollableView";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React from "react";
import { Text } from "react-native-paper";

type Props = ServicesStackScreenProps<"Airtime Purchase">;

export default function AirtimePurchaseScreen({}: Props) {
  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text
          variant="titleLarge"
          style={tw`text-gray-800 mb-2 font-bold`}
        >
          Buy Airtime
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Top up your mobile credit instantly! Enter the details below to
          purchase airtime for your mobile phone
        </Text>
      </ScrollableView>
    </Screen>
  );
}
