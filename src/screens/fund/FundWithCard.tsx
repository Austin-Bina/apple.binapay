import Banner from "@components/ui/banner";
import NairaInput from "@components/ui/form/NairaInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { resetNavigationToDashboard } from "@utils/navigation";
import { useForm } from "react-hook-form";
import { View, useWindowDimensions } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { scale } from "react-native-size-matters";
import { z } from "zod";

const schema = z.object({
  amount: z.string(),
});

export default function FundWithCardScreen() {
  const { width } = useWindowDimensions();

  const { control, watch } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "5000",
    },
  });

  const values = watch();

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 py-5 justify-between`}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Fund with Card
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400`}>
            Use your card to conveniently add funds to your BinaPay wallet.
          </Text>
          <Banner style={tw`mt-6`} content="Funding wallet with card attracts additional charges of 4% only." />

          <View>
            <NairaInput name="amount" control={control} isDisabled />
            <View style={tw`bg-green-50 mt-4 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full`}>
              <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
                You get ₦{values.amount}
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={resetNavigationToDashboard}
            style={tw`w-full rounded-full mt-28`}
            disabled
            contentStyle={tw`py-2`}>
            Coming Soon
          </Button>
        </View>

        <Image
          source={require("@assets/images/secured-by-paystack.png")}
          width={scale(width - 200)}
          style={tw`mx-auto`}
        />
      </ScrollableView>
    </Screen>
  );
}
