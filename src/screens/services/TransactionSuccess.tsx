import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { getPendingTransaction } from "@store/slice/transactionSlice";
import { getNavigate } from "@utils/navigation";
import React from "react";
import { View, ImageBackground } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Card, Text } from "react-native-paper";

type Props = ServicesStackScreenProps<"Service Purchase Success">;

export default function TransactionSuccessScreen({ route }: Props) {
  const { transactionId } = route.params;

  const pendingTransaction = useTypedSelector((state) => getPendingTransaction(state.transaction, transactionId));

  const onSubmit = async () => {
    const { navigate } = await getNavigate();
    navigate("Main", {
      screen: "Home",
      params: { screen: "Dashboard" },
    });
  };

  const successData = pendingTransaction?.data?.success;

  return (
    <ImageBackground
      source={require("@assets/images/background-without-logo.png")}
      style={tw`px-4 py-8 items-center gap-10 justify-between flex-1`}>
      <Image source={require("@assets/images/logo-with-name.png")} width={136} />

      <Card style={tw`bg-white w-full p-6 rounded-3xl border border-primary-200`} mode="contained">
        <Card.Title
          title={<Text style={tw`font-bold text-lg text-center text-primary-900 mb-2.5`}>{successData?.title}</Text>}
        />
        <Card.Content style={tw`items-center justify-around h-full`}>
          {successData?.logo && <Image width={60} source={{ uri: successData.logo }} />}
          {successData?.details ? (
            <View style={tw`gap-2 my-5 w-full`}>
              {Object.entries(successData.details).map(([key, value]) => (
                <View key={key} style={tw`flex-col justify-between`}>
                  <Text variant="bodyLarge">{key}:</Text>
                  <Text style={tw`text-lg font-bold`}>{value as any}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text variant="bodyMedium" style={tw`text-gray-500 text-center`}>
              {successData?.description}
            </Text>
          )}
          {successData?.details && (
            <Button
              style={tw`mt-auto mb-[30px] w-full rounded-full`}
              contentStyle={tw`py-2`}
              labelStyle={tw`text-base font-medium`}
              onPress={() => {}}
              mode="contained-tonal"
              buttonColor={Colors.primary[100]}
              textColor={Colors.primary[600]}>
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
        mode="contained">
        Continue to Home
      </Button>
    </ImageBackground>
  );
}
