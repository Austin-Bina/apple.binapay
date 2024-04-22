import Screen from "@components/shared/Screen";
import ScrollableView from "@components/shared/ScrollableView";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React from "react";
import { Text } from "react-native-paper";

type Props = ServicesStackScreenProps<"Data Purchase">;

export default function DataPurchaseScreen({}: Props) {
  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Buy Data Bundle
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Stay connected with our data bundles! Select your preferred options
          below to purchase a data bundle.
        </Text>
      </ScrollableView>
    </Screen>
  );
}
