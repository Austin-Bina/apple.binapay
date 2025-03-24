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
import { Button, Text, Divider } from "react-native-paper";
import { Paystack, paystackProps } from "react-native-paystack-webview";
import { scale } from "react-native-size-matters";
import { z } from "zod";

const schema = z.object({
  amount: zodAmountValidation(20),
});

export default function FundWithPaystackScreen() {
  const user = useTypedSelector(selectUser);
  const { width, height } = useWindowDimensions();
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
  const amountValue = parseFloat(amount) || 0;

  const settlementAmount = useMemo(() => {
    return calculateSettlementAmount(
      amountValue,
      PaymentProcessor.Paystack,
      transaction.payment_provider_fees
    );
  }, [transaction, amountValue]);

  const handleMakePayment = handleSubmit(async () => {
    if (paystackWebViewRef.current) {
      paystackWebViewRef.current.startTransaction();
    }
  });

  const calculatedFee = amountValue - settlementAmount.amount;
  const finalSettlementAmount = Math.max(0, settlementAmount.amount);
  
  // Get fee description based on fee type
  const getFeeDescription = () => {
    const config = settlementAmount.config;
    if (!config) return "Processing fees apply";
    
    if (config.fee_type === "percentage") {
      return `${config.charge_percentage}% fee`;
    } else if (config.fee_type === "flat") {
      return `flat fee of ${formatToNaira(config.flat_fee)}`;
    }
    
    return "Processing fees apply";
  };

  return (
    <Screen>
      <ScrollableView 
        contentContainerStyle={tw`justify-between px-4 py-5 min-h-[${Math.min(height * 0.9, 600)}px]`}
      >
        <View style={tw`flex-1`}>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Fund with Paystack
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400`}>
            We support multiple payment methods including credit/debit cards, bank transfers, USSD, and more.
          </Text>
          <Banner
            style={tw`mt-6`}
            content={`Funding wallet with Paystack attracts a ${getFeeDescription()}.`}
          />
          <View style={tw`mt-6`}>
            <NairaInput name="amount" control={control} />
            
            <View style={tw`mt-4 bg-white rounded-xl border border-gray-100 p-4 shadow-sm`}>
              <Text variant="titleMedium" style={tw`text-gray-800 font-bold mb-2`}>
                Transaction Summary
              </Text>
              <Divider style={tw`mb-3`} />
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text variant="bodyMedium" style={tw`text-gray-600`}>
                  Amount to fund
                </Text>
                <Text variant="bodyMedium" style={tw`font-semibold`}>
                  {formatToNaira(amountValue)}
                </Text>
              </View>
              
              <View style={tw`flex-row justify-between mb-2`}>
                <Text variant="bodyMedium" style={tw`text-gray-600`}>
                  Paystack fee
                </Text>
                <Text variant="bodyMedium" style={tw`font-semibold text-red-500`}>
                  - {formatToNaira(calculatedFee)}
                </Text>
              </View>
              
              <Divider style={tw`my-2`} />
              
              <View style={tw`flex-row justify-between`}>
                <Text variant="bodyLarge" style={tw`text-gray-800 font-bold`}>
                  You get
                </Text>
                <Text variant="bodyLarge" style={tw`text-green-600 font-bold`}>
                  {formatToNaira(finalSettlementAmount)}
                </Text>
              </View>
              
              {calculatedFee >= amountValue && (
                <View style={tw`mt-3 bg-red-50 p-2 rounded-lg`}>
                  <Text variant="bodySmall" style={tw`text-red-600 text-center`}>
                    The processing fee exceeds your funding amount. Please enter a higher amount.
                  </Text>
                </View>
              )}
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleMakePayment}
            disabled={calculatedFee >= amountValue}
            style={tw`rounded-full mt-6`}
            contentStyle={tw`py-2`}
          >
            Continue to Payment
          </Button>
        </View>

        <Image
          source={require("@assets/images/secured-by-paystack.png")}
          width={scale(Math.min(width - 100, 300))}
          height={scale(40)}
          resizeMode="contain"
          style={tw`mx-auto mt-4`}
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
