import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import tw from "@lib/tailwind";
import { resetNavigationToDashboard } from "@utils/navigation";
import { View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { scale } from "react-native-size-matters";

export default function FundWithCardScreen() {
  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 py-5 justify-between`}>
        <View>
          {/* <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Fund with Card
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
            Use your card to conveniently add funds to your BinaPay wallet.
          </Text> */}
          <View style={tw`justify-center items-center px-4`}>
            <Image source={require("@assets/images/oops.png")} width={scale(220)} style={tw`mb-6`} />
            <Text variant="titleLarge" style={tw`font-bold mb-2 text-center`}>
              Funding with card is coming soon
            </Text>
            <Text variant="bodyMedium" style={tw`text-center text-gray-500 mb-10`}>
              This service is not available yet. We're actively working to add more features and services to improve
              your experience. Please check back later for updates.
            </Text>
          </View>
        </View>

        <Button
          mode="contained"
          onPress={resetNavigationToDashboard}
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}>
          Back
        </Button>
      </ScrollableView>
    </Screen>
  );
}
