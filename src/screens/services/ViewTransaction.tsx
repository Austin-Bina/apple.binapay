import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { getPendingTransaction } from "@store/slice/transactionSlice";
import { getNavigate } from "@utils/navigation";
import { getTransactionDescription, getTransactionDetails, getTransactionTitle } from "@helpers/transaction";
import React, { useMemo } from "react";
import { View, ImageBackground, SafeAreaView } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { match } from "ts-pattern";
import { convertToNaira } from "@utils/money";
import { format } from "date-fns";
import { SCREENS } from "@constants/screens";

type Props = ServicesStackScreenProps<"View Transaction">;

export default function ViewTransaction({ route }: Props) {
  const { transactionId, type = "utility" } = route.params;

  const pendingTransaction = useTypedSelector((state) => getPendingTransaction(state.transaction, transactionId));

  const response = useMemo(() => {
    return match(pendingTransaction)
      .with(
        { data: { response: { transaction_info: { transaction: {} } } } },
        ({ data }) => data.response.transaction_info.transaction,
      )
      .otherwise(() => null);
  }, []);

  const view = useMemo(() => {
    return match(pendingTransaction)
      .with({ view: {} }, ({ view }) => view)
      .otherwise(() => null);
  }, []);

  const pageData = useMemo(() => {
    let transactionTitle = "",
      transactionDescription = "",
      transactionDetails = [] as ReturnType<typeof getTransactionDetails>,
      logo = "",
      hasDetails = false;

    // Wallet Transaction
    if (view && "wallet_id" in view) {
      const { type, meta: details } = view;

      // logo = getNotificationIcon(type);
      logo = "";
      transactionTitle = details.description;
      transactionDescription = details.description;
      transactionDetails = [
        {
          label: "Amount",
          value: convertToNaira(view.amount, true),
        },
        {
          label: "Date",
          value: format(new Date(view.created_at), "MMM dd, yyyy h:mm a"),
        },
        {
          label: "Type",
          value: type,
        },
      ];
      hasDetails = true;
    }

    // Utility Transaction
    if (view && "payment_transaction" in view) {
      transactionTitle = getTransactionTitle(view.transaction_type, view.status);
      transactionDescription = getTransactionDescription(view.transaction_type);
      transactionDetails = getTransactionDetails({
        type: view.transaction_type,
        details: view.details,
      });
      hasDetails = transactionDetails.length > 0;
      logo = view.provider_logo;
    }

    // Transaction Response
    if (response) {
      transactionTitle = getTransactionTitle(response.transaction_type, response.status);
      transactionDescription = getTransactionDescription(response.transaction_type);
      transactionDetails = getTransactionDetails({
        type: response.transaction_type,
        details: response.details,
      });
      hasDetails = transactionDetails.length > 0;
      logo = response.provider_logo;
    }

    return {
      transactionTitle,
      transactionDescription,
      transactionDetails,
      hasDetails,
      logo,
    };
  }, [pendingTransaction]);

  const onSubmit = async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.MAIN, {
      screen: SCREENS.HOME,
      params: { screen: SCREENS.DASHBOARD },
    });
  };

  return (
    <ImageBackground source={require("@assets/images/background-without-logo.png")} style={tw`px-4 py-8 flex-1`}>
      <SafeAreaView style={tw`py-8 items-center gap-10`}>
        <View>
          <Image source={require("@assets/images/logo-with-name.png")} width={136} />
        </View>

        <View style={tw`bg-white w-full p-6 rounded-3xl border border-primary-200`}>
          <View>
            <Text style={tw`font-bold text-lg text-center text-primary-900 mb-2.5`}>{pageData.transactionTitle}</Text>
          </View>
          <View style={tw`items-center justify-around  p-0`}>
            <Image width={60} height={60} style={tw`bg-gray-300 rounded-lg`} source={{ uri: pageData.logo }} />
            {pageData.hasDetails ? (
              <View style={tw`gap-2 my-5 w-full`}>
                {pageData.transactionDetails.map((item) => (
                  <View key={item.value} style={tw`flex-row justify-between`}>
                    <Text variant="labelSmall">{item.label}:</Text>
                    <Text style={tw`font-bold`}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text variant="bodyMedium" style={tw`text-gray-500 text-center`}>
                {pageData.transactionDescription}
              </Text>
            )}
            {pageData.hasDetails && (
              <Button
                style={tw`mt-auto w-full rounded-full`}
                contentStyle={tw`py-2`}
                labelStyle={tw`text-base font-medium`}
                onPress={() => {}}
                mode="contained-tonal"
                buttonColor={Colors.primary[100]}
                textColor={Colors.primary[600]}>
                Share Receipt
              </Button>
            )}
          </View>
        </View>

        <Button
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-base font-bold`}
          onPress={onSubmit}
          mode="contained">
          Continue to Home
        </Button>
      </SafeAreaView>
    </ImageBackground>
  );
}
