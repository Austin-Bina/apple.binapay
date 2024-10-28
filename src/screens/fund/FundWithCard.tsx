import Banner from "@components/ui/banner";
import NairaInput from "@components/ui/form/NairaInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { Colors } from "@constants/theme/colors";
import { env } from "@env";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { formatToNaira, zodAmountValidation } from "@utils/money";
import { resetNavigationToDashboard } from "@utils/navigation";
import { useRef } from "react";
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

  const { control, watch, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      amount: "0",
    },
  });

  const { amount } = watch();

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
            Fund with Card
          </Text>
          <Text variant="bodyMedium" style={tw`text-gray-400`}>
            Use your card to conveniently add funds to your BinaPay wallet.
          </Text>
          <Banner style={tw`mt-6`} content="Funding wallet with card attracts additional charges of 4% only." />

          <View>
            <NairaInput name="amount" control={control} />
            <View style={tw`bg-green-50 mt-4 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full`}>
              <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
                You get {formatToNaira(amount || 0)}
              </Text>
            </View>
          </View>

          <Button
            mode="contained"
            onPress={handleMakePayment}
            style={tw`w-full rounded-full mt-28`}
            contentStyle={tw`py-2`}>
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
          channels={["card"]}
          onCancel={(e) => {}}
          onSuccess={resetNavigationToDashboard}
          activityIndicatorColor={Colors.primary.DEFAULT}
          ref={paystackWebViewRef as any}
        />
      )}
    </Screen>
  );
}
