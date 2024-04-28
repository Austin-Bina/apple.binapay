import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import CopyReferralCode from "@components/ui/widgets/CopyReferralCode";
import tw from "@lib/tailwind";
import { AccountStackScreenProps } from "@navigators/types";
import React from "react";
import { View } from "react-native";
import { Image } from "react-native-element-image";
import { Card, Chip, Text } from "react-native-paper";

type Props = AccountStackScreenProps<"Earning Summary">;

export default function EarningSummaryScreen({}: Props) {
  const referralCode = "ASD1FR32-ABDUL";

  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          View Your Earnings
        </Text>
        <Card mode="contained" style={tw`bg-primary-50 py-2 my-8`}>
          <Card.Content style={tw`items-center`}>
            <Text style={tw`text-gray-900 font-bold text-xl text-center mb-1`}>
              ₦200.00
            </Text>
            <Text style={tw`text-center text-gray-600`}>Total Earnings</Text>
          </Card.Content>
        </Card>
        <CopyReferralCode referralCode={referralCode} />
        <View>
          <Text variant="titleMedium" style={tw`text-gray-800 mb-5`}>
            Earnings Summary
          </Text>
          <View
            style={tw`my-1.5 px-2 py-1 rounded-2xl border border-gray-100 flex-row justify-between items-center`}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <Image
                source={require("@assets/draft/male-avatar-circle.png")}
                width={48}
              />
              <Text variant="titleSmall" style={tw`font-bold text-gray-900`}>
                John Doe
              </Text>
            </View>
            <Chip
              icon=""
              mode="flat"
              style={tw`bg-green-50`}
              textStyle={tw`text-green-600`}
            >
              ₦50.00
            </Chip>
          </View>
          <View
            style={tw`my-1.5 px-2 py-1 rounded-2xl border border-gray-100 flex-row justify-between items-center`}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <Image
                source={require("@assets/draft/male-avatar-circle.png")}
                width={48}
              />
              <Text variant="titleSmall" style={tw`font-bold text-gray-900`}>
                Jane Doe
              </Text>
            </View>
            <Chip
              icon=""
              mode="flat"
              style={tw`bg-green-50`}
              textStyle={tw`text-green-600`}
            >
              ₦100.50
            </Chip>
          </View>
          <View
            style={tw`my-1.5 px-2 py-1 rounded-2xl border border-gray-100 flex-row justify-between items-center`}
          >
            <View style={tw`flex-row items-center gap-2`}>
              <Image
                source={require("@assets/draft/male-avatar-circle.png")}
                width={48}
              />
              <Text variant="titleSmall" style={tw`font-bold text-gray-900`}>
                Simon Paul
              </Text>
            </View>
            <Chip
              icon=""
              mode="flat"
              style={tw`bg-green-50`}
              textStyle={tw`text-green-600`}
            >
              ₦49.50
            </Chip>
          </View>
        </View>
      </ScrollableView>
    </Screen>
  );
}
