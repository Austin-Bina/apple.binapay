import Screen from "@components/shared/Screen";
import ScrollableView from "@components/shared/ScrollableView";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import React from "react";
import { Text } from "react-native-paper";

type Props = HomeStackScreenProps<"Notification">;

export default function NotificationScreen({}: Props) {
  return (
    <Screen>
      <Text
        variant="titleLarge"
        style={tw`text-gray-800 mb-2 font-bold px-4 mt-10 `}
      >
        Notification
      </Text>
      <ScrollableView style={tw`px-4 mt-5`}>
        <Text variant="bodySmall" style={tw`text-gray-400`}>Today</Text>
      </ScrollableView>
    </Screen>
  );
}
