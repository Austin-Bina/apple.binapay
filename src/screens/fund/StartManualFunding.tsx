import Banner from "@components/ui/banner";
import NairaInput from "@components/ui/form/NairaInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ManualFundStackScreenProps } from "@navigators/types";
import { useGetSystemSettingsQuery } from "@store/redux-api/systemSettingsApi";
import { formatToNaira, zodAmountValidation } from "@utils/money";
import { useForm } from "react-hook-form";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { z } from "zod";

const schema = z.object({
  amount: zodAmountValidation(),
});

type FormValues = z.infer<typeof schema>;
type Props = ManualFundStackScreenProps<typeof SCREENS.START_MANUAL_FUNDING>;

export default function StartManualFundingScreen({ navigation }: Props) {
  const { data: queryData } = useGetSystemSettingsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnReconnect: true,
  });

  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      amount: "1000",
    },
  });

  const bankSettings = queryData?.bank;

  const onSubmit = handleSubmit(async ({ amount }) => {
    if (!bankSettings) return;

    const toPay = parseFloat(amount);
    const minAllowedAmount = bankSettings.min_transaction_amount;
    const maxAllowedAmount = bankSettings.max_transaction_amount;

    if (toPay < minAllowedAmount) {
      return setError("amount", {
        message: `We don't accept transactions below ${formatToNaira(minAllowedAmount)}`,
      });
    }

    if (toPay > maxAllowedAmount) {
      return setError("amount", {
        message: `We don't accept transactions above ${formatToNaira(maxAllowedAmount)}`,
      });
    }

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
            Enter the amount you want to fund. The minimum amount is{" "}
            <Text variant="labelLarge">{formatToNaira(bankSettings?.min_transaction_amount)}</Text>.
          </Text>
          <Banner
            style={tw`mt-6`}
            content={
              <View>
                <Text>
                  Note this feature is for those that want to fund their BinaPay wallet without verifying their account.
                </Text>

                <Text>
                  Manual funding attracts additional charges of {formatToNaira(bankSettings?.manual_funding_fee)} only.
                </Text>
              </View>
            }
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
