import Screen from "@components/ui/shared/Screen";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { getNavigate } from "@utils/navigation";
import React, { useMemo } from "react";
import { View, ImageBackground } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Card, Text } from "react-native-paper";

type Props = ServicesStackScreenProps<"Service Purchase Success">;
interface TransactionDetails {
  [id: string]: {
    title: string;
    description?: string;
    logo?: any;
    details?: {
      [index: string]: string;
    };
  };
}

const transactionScreenData: TransactionDetails = {
  airtime_purchase: {
    title: "Airtime Purchase Successful",
    logo: require("@assets/images/services/mtn.png"),
    details: {
      Recipient: "08137659580",
      "Refrence Number": "#3680846962224",
      "Amount Saved": "₦30.50",
    },
  },
  airtime_epin_purchase: {
    title: "Payment Successful 🎉",
    description:
      "Your EPIN purchase was successful. The ePINs will be sent to your Mail.",
  },
  data_purchase: {
    title: "Data Purchase Successful",
    logo: require("@assets/images/services/mtn.png"),
    details: {
      Recipient: "08137659580",
      "Refrence Number": "#3680846962225",
      Amount: "₦100",
      "Amount Saved": "₦30.50",
      "Data Amount": "200MB",
    },
  },
  electricity_payment: {
    title: "Electricity Bill Payment Successful 🎉",
    logo: require("@assets/images/services/aedc.png"),
    details: {
      Status: "Success",
      Amount: "₦2,000",
      Token: "5269-4120-2363-0563-6541",
      "Customer Name": "Abdul Amos",
      "Meter Number": "1234523421345",
    },
  },
  tv_subscription: {
    title: "Subscription Purchase Successful 🎉",
    logo: require("@assets/images/services/dstv.png"),
    details: {
      "Smart-Card Number": "000000000000",
      "Refrence Number": "#3680846962224",
      "Amount:": "4,464.00",
      "Period:": "7 days",
    },
  },
  education_payment_jamb: {
    title: "Payment Successful 🎉",
    description:
      "Your educational payment was successful. Your ePIN will be sent to you via SMS",
  },
  education_payment_ibbu: {
    title: "Payment Successful 🎉",
    description: "Your educational payment was successful.",
  },
  education_payment_asam: {
    title: "Payment Successful 🎉",
    description:
      "Your educational payment was successful. Your ePIN will be sent to you via SMS",
  },
};

export default function TransactionSuccessScreen({ route }: Props) {
  const { transactionId } = route.params;

  const onSubmit = async () => {
    const { navigate } = await getNavigate();
    navigate("Main", {
      screen: "Home",
      params: { screen: "Dashboard" },
    });
  };

  const transactionDetails = useMemo(
    () => transactionScreenData[transactionId],
    [transactionId]
  );

  return (
    <ImageBackground
      source={require("@assets/images/background-without-logo.png")}
      style={tw`px-4 py-8 items-center gap-10 justify-between flex-1`}
    >
      <Image
        source={require("@assets/images/logo-with-name.png")}
        width={136}
      />

      <Card
        style={[
          tw`bg-white w-full p-6 rounded-3xl border border-primary-200`,
          { height: transactionDetails.details ? "70%" : "30%" },
        ]}
        mode="contained"
      >
        <Card.Title
          title={
            <Text
              style={tw`font-bold text-lg text-center text-primary-900 mb-2.5`}
            >
              {transactionDetails.title}
            </Text>
          }
        />
        <Card.Content
          style={[
            tw`items-center justify-around h-full`,
            { height: transactionDetails.details ? "100%" : "60%" },
          ]}
        >
          {transactionDetails.logo && (
            <Image width={60} source={transactionDetails.logo} />
          )}
          {transactionDetails.details ? (
            <View style={tw`gap-2 my-5 w-full`}>
              {Object.entries(transactionDetails.details).map(
                ([key, value]) => (
                  <View key={key} style={tw`flex-row justify-between`}>
                    <Text variant="bodyLarge">{key}:</Text>
                    <Text style={tw`text-lg font-bold`}>{value}</Text>
                  </View>
                )
              )}
            </View>
          ) : (
            <Text variant="bodyMedium" style={tw`text-gray-500 text-center`}>
              {transactionDetails.description}
            </Text>
          )}
          {transactionDetails.details && (
            <Button
              style={tw`mt-auto mb-[30px] w-full rounded-full`}
              contentStyle={tw`py-2`}
              labelStyle={tw`text-base font-medium`}
              onPress={() => {}}
              mode="contained-tonal"
              buttonColor={Colors.primary[100]}
              textColor={Colors.primary[600]}
            >
              Share Receipt
            </Button>
          )}
        </Card.Content>
      </Card>

      <Button
        style={tw`w-full rounded-full`}
        contentStyle={tw`py-2`}
        labelStyle={tw`text-base font-bold`}
        onPress={onSubmit}
        mode="contained"
      >
        Continue to Home
      </Button>
    </ImageBackground>
  );
}
