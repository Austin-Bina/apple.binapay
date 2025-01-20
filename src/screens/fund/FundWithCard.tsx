import Banner from "@components/ui/banner";
import NairaInput from "@components/ui/form/NairaInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { Colors } from "@constants/theme/colors";
import { PaymentProcessor } from "@enum/providers";
import { env } from "@env";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { selectUser } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import {
  calculateSettlementAmount,
  formatToNaira,
  zodAmountValidation,
} from "@utils/money";
import { resetNavigationToDashboard } from "@utils/navigation";
import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { View, useWindowDimensions } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { Paystack, paystackProps } from "react-native-paystack-webview";
import { scale } from "react-native-size-matters";
import { z } from "zod";

const schema = z.object({
  amount: zodAmountValidation(20),
});

export default function FundWithCardScreen() {
  const user = useTypedSelector(selectUser);
  const { width } = useWindowDimensions();
  const paystackWebViewRef = useRef<paystackProps.PayStackRef>(null);

  const { transaction } = useTypedSelector(selectSystemSettings);
  const prefetchSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  useEffect(() => {
    prefetchSettings();
  }, []);

  const { control, watch, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      amount: "0",
    },
  });

  const { amount } = watch();

  const settlementAmount = useMemo(() => {
    return calculateSettlementAmount(
      parseFloat(amount) || 0,
      PaymentProcessor.Paystack,
      transaction.payment_provider_fees
    );
  }, [transaction, amount]);

  const handleMakePayment = handleSubmit(async () => {
    if (paystackWebViewRef.current) {
      paystackWebViewRef.current.startTransaction();
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`justify-between px-4 py-5`}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Fund with Paystack
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400`}>
            We support major payment methods such as credit/debit cards, bank
            transfers, and more.
          </Text>
          <Banner
            style={tw`mt-6`}
            content={`Funding wallet with card attracts additional charges of ${settlementAmount.config?.charge_percentage}% only.`}
          />
          <View>
            <NairaInput name="amount" control={control} />
            <View
              style={tw`bg-green-50 mt-4 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full`}
            >
              <Text
                variant="bodyMedium"
                style={tw`text-green-600 text-center font-bold`}
              >
                You get {formatToNaira(settlementAmount.amount)}
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleMakePayment}
            style={tw`w-full rounded-full mt-28`}
            contentStyle={tw`py-2`}
          >
            Pay Now
          </Button>
        </View>

        <Image
          source={require("@assets/images/secured-by-paystack.png")}
          width={scale(width - 200)}
          style={tw`mx-auto`}
        />
      </ScrollableView>
      {user && (
        <Paystack
          paystackKey={env.EXPO_PUBLIC_PAYSTACK_KEY as string}
          billingEmail={user.email}
          billingName={user.name}
          phone={user.phone}
          amount={amount}
          // @ts-ignore
          channels={["card", "bank_transfer", "ussd", "bank"]}
          onCancel={(e) => {}}
          onSuccess={resetNavigationToDashboard}
          activityIndicatorColor={Colors.primary.DEFAULT}
          ref={paystackWebViewRef as any}
        />
      )}
    </Screen>
  );
}
