import Banner from "@components/ui/banner";
import NairaInput from "@components/ui/form/NairaInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ManualFundStackScreenProps } from "@navigators/types";
import { zodAmountValidation } from "@utils/money";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { z } from "zod";

const schema = z.object({
  amount: zodAmountValidation(2000),
});

type FormValues = z.infer<typeof schema>;
type Props = ManualFundStackScreenProps<typeof SCREENS.START_MANUAL_FUNDING>;
export default function StartManualFundingScreen({ navigation }: Props) {
  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "2000",
    },
  });

  const onSubmit = handleSubmit(async ({ amount }) => {
    navigation.navigate(SCREENS.MANUAL_FUND, {
      amount: amount,
    });
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 py-5 justify-between`}>
        <View style={tw`flex-1`}>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Fund Wallet Manually
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-500`}>
            Transfer the desired amount to BinaPay's bank account of your choice. Once the transfer is complete, your
            BinaPay wallet will be credited. The minimum amount is <Text variant="labelLarge">₦2,000</Text>.
          </Text>
          <Banner
            style={tw`mt-6`}
            message="Note this feature is for those that want to fund their BinaPay wallet without verifying their account.  Manual  funding  attracts additional charges of 4% only."
          />
          <NairaInput name="amount" control={control} />
        </View>
        <Button style={tw`mt-10 w-full rounded-full`} contentStyle={tw`py-2`} onPress={onSubmit} mode="contained">
          Continue
        </Button>
      </ScrollableView>
    </Screen>
  );
}
