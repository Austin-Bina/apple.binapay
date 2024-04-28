import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import React, { Fragment } from "react";
import { TouchableOpacity, View } from "react-native";
import { Image } from "react-native-element-image";
import { Text } from "react-native-paper";

type Props = HomeStackScreenProps<"Notification">;

const notifications = [
  {
    id: '3r7xefxtexvgdvdxe',
    title: "Transaction Completed",
    body: "Your airtime purchase was completed successfully",
    data: "Mar 12, 2024 4:01 PM",
    image: require("@assets/icons/logo-small.png"),
  },
  {
    id: 'yu5e378dguyxecee',
    title: "Transaction Completed",
    body: "Your wallet has been credited with ₦20,000.00",
    data: "Mar 12, 2024 4:01 PM",
    image: require("@assets/icons/logo-small.png"),
  },
  {
    id: '3r7b dbvtd7i8o9ydhxexec',
    title: "Referral Payout",
    body: "Your wallet has been credited with ₦200.00 of your referral earning",
    data: "Mar 12, 2024 4:01 PM",
    image: require("@assets/icons/logo-small.png"),
  },
];

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
        <Text variant="bodySmall" style={tw`text-gray-400`}>
          Today
        </Text>
        <View style={tw`mt-4`}>
          {notifications.map((data) => (
            <TouchableOpacity
              key={data.id}
              onPress={() => {}}
              style={tw`flex-row items-center gap-2 my-3 p-2 rounded-2xl border border-gray-100`}
            >
              <Fragment>
                <Image source={data.image} width={60} height={60} />
                <View>
                  <Text variant="titleMedium" style={tw`text-gray-900`}>
                    {data.title}
                  </Text>
                  <Text variant="bodySmall" style={tw`text-gray-500 w-10/12`}>
                    {data.body}
                  </Text>
                </View>
              </Fragment>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollableView>
    </Screen>
  );
}
