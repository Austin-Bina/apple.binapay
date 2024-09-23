import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import tw from "@lib/tailwind";
import { ManualFundStackScreenProps } from "@navigators/types";
import { resetNavigationToDashboard } from "@utils/navigation";
import { useEffect } from "react";
import { BackHandler, ImageBackground, View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";

type Props = ManualFundStackScreenProps<typeof SCREENS.MANUAL_FUND_WAIT>;
export default function ManualFundWaitScreen(props: Props) {
  useEffect(() => {
    const handleBackButtonClick = () => {
      resetNavigationToDashboard;
      return true;
    };

    BackHandler.addEventListener("hardwareBackPress", handleBackButtonClick);

    return () => {
      BackHandler.removeEventListener("hardwareBackPress", handleBackButtonClick);
    };
  }, []);

  return (
    <ImageBackground
      source={require("@assets/images/background-with-logo.png")}
      style={tw`flex-1 justify-center items-center`}>
      <ScrollableView contentContainerStyle={tw`px-4 py-5 justify-between`}>
        <View style={tw`p-4 flex-1 justify-center items-center`}>
          <ActivityIndicator animating size="large" color="gray" />

          <Text variant="titleLarge" style={tw`text-gray-800 text-center my-2 font-bold`}>
            Confirming your payment
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-500 text-center mt-4`}>
            We are now reviewing your payment, this should not take too long. If you need to cancel or make further
            request or enquiry, please contact support.
          </Text>
        </View>
        <View style={tw`my-10`}>
          <Button
            onPress={resetNavigationToDashboard}
            mode="contained"
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}>
            Back to Home
          </Button>
        </View>
      </ScrollableView>
    </ImageBackground>
  );
}
