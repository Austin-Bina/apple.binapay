import { AvatarImage } from "@components/avatar";
import EducationEmptyState from "@components/ui/empty-states/education";
import EducationErrorState from "@components/ui/error-states/education";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import tw from "@lib/tailwind";
import { EducationStackScreenProps } from "@navigators/types";
import { useGetEducationPlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import React, { Fragment } from "react";
import { RefreshControl, TouchableOpacity, View } from "react-native";
import { Text } from "react-native-paper";

type Props = EducationStackScreenProps<"Select Educational Payment">;

export default function SelectEducationPaymentScreen({ navigation }: Props) {
  const { data: queryData, isFetching, error, refetch } = useGetEducationPlansQuery();
  const educationPlans = queryData?.education_plans || [];

  const navigateToPayment = (provider: string) => {
    navigation.navigate("Educational Payment", {
      provider,
    });
  };

  return (
    <Screen>
      <ScrollableView style={tw`px-4`} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <Text variant="titleLarge" style={tw`text-gray-800 font-bold mt-5`}>
          Make Educational Payment
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Pay for your educational expenses with ease.
        </Text>
        {!!error && !isFetching && <EducationErrorState />}
        {!isFetching && educationPlans.length === 0 && <EducationEmptyState />}
        <View style={tw`mt-4`}>
          {educationPlans.map((provider) => (
            <TouchableOpacity
              key={provider.serviceId}
              onPress={() => navigateToPayment(provider.serviceId)}
              style={tw`flex-row items-center gap-2 my-3 p-2 rounded-2xl border border-gray-100`}>
              <Fragment>
                <AvatarImage avatar={provider.logo} size={60} />
                <View>
                  <Text variant="titleMedium" style={tw`text-gray-900`}>
                    {provider.name}
                  </Text>
                  <Text variant="bodySmall" style={tw`text-gray-500`}>
                    {provider.description}
                  </Text>
                </View>
              </Fragment>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isFetching} />
    </Screen>
  );
}

