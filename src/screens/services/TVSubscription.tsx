import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { serviceProvidersMap } from "@constants/providers";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { formatNairaValue } from "@utils/functions";
import React, { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, TouchableOpacity } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text, TextInput } from "react-native-paper";
import { verticalScale } from "react-native-size-matters";
import { z } from "zod";

type Props = ServicesStackScreenProps<"TV Subscription">;

const schema = z.object({
  provider: z.string(),
  amount: z.string(),
  card_number: z.string(),
  period: z.string(),
  package: z.string().optional(),
});

const gotvPackages = [
  {
    label: "GOtv Supa+",
    id: "gotv_supa_plus",
  },
  {
    label: "GOtv Supa",
    id: "gotv_supa",
  },
  {
    label: "GOtv Max",
    id: "gotv_max",
  },
  {
    label: "GOtv Jolli",
    id: "gotv_jolli",
  },
  {
    label: "GOtv Jinja",
    id: "gotv_jinja",
  },
];

const gotvSubPeriods = [
  { label: "Monthly", id: "monthly" },
  { label: "Quarterly (3 Months)", id: "quarterly" },
  { label: "Yearly (12 Months)", id: "yearly" },
];

export default function TVSubscriptionScreen({ navigation }: Props) {
  const [fetching, setFetching] = useState(false);

  const { control, watch, setValue, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "gotv",
      amount: "4,464.00",
      card_number: "000000000000",
      period: "monthly",
      package: "gotv_supa_plus",
    },
  });
  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const values = watch();

  const openBottomSheet = useCallback(() => {
    bottomSheet.current?.present();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  const handleMakePayment = handleSubmit((values) => {
    console.log(values);
    navigation.navigate("Confirm Transaction", {
      transactionId: "tv_subscription",
    });
    closeBottomSheet();
  });

  return (
    <Screen>
      <ScrollableView style={tw`flex-1 px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          TV Subscription
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Easily purchase subscriptions for your favorite TV channels. Enter the
          details below to proceed.
        </Text>
        <View style={tw`flex-row items-center justify-around my-5`}>
          {Object.values(serviceProvidersMap.entertainment).map((provider) => (
            <TouchableOpacity
              key={provider.key}
              onPress={() => setValue("provider", provider.key)}
              style={[
                tw`p-3 mb-2 border border-primary-100 rounded-xl justify-center items-center`,
                values.provider === provider.key &&
                  tw`border-blue-500 border-2`,
              ]}
            >
              <Image source={provider.logo} width={60} height={60} />
            </TouchableOpacity>
          ))}
        </View>
        <Controller
          control={control}
          name="card_number"
          render={({
            fieldState: { error },
            field: { onChange, onBlur, value },
          }) => (
            <CustomTextInput
              label="Smart-card Number"
              placeholder="Enter GoTV Smart-Card Number"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!error}
              errorMessage={error?.message}
            />
          )}
        />
        <DropdownMenuField
          label="Period"
          placeholder="Select your period"
          name="period"
          control={control}
          data={gotvSubPeriods}
        />
        <DropdownMenuField
          label="Package"
          placeholder="Select your package"
          name="package"
          control={control}
          data={gotvPackages}
        />
        <View style={tw`mb-5`}>
          <NairaInput name="amount" control={control} />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>
            Wallet Balance: ₦20,000.00
          </Text>
        </View>
      </ScrollableView>
      <View style={tw`px-4 pb-4 pt-1`}>
        <Button
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-center text-base font-bold`}
          disabled={fetching}
          onPress={openBottomSheet}
          mode="contained"
        >
          Proceed
        </Button>
      </View>
      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={["50%", "50%"]}
        closeFilter={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text variant="titleLarge" style={tw`font-bold text-gray-800 mb-2`}>
              Confirm Bill Payment
            </Text>
            <View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Network:</Text>
                <View style={tw`flex-row items-center gap-2.5`}>
                  <Image
                    width={30}
                    source={
                      serviceProvidersMap.entertainment[values.provider].logo
                    }
                  />
                  <Text style={tw`text-lg font-bold`}>
                    {serviceProvidersMap.entertainment[values.provider].label}
                  </Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>
                  {formatNairaValue(values.amount)}
                </Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Smart-Card Number:</Text>
                <Text style={tw`text-lg font-bold`}>{values.card_number}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Package:</Text>
                <Text style={tw`text-lg font-bold`}>{values.package}</Text>
              </View>
            </View>
            <Button
              mode="contained"
              onPress={handleMakePayment}
              style={tw`w-full rounded-full mt-[20%]`}
              contentStyle={tw`py-2`}
              labelStyle={tw`text-base`}
            >
              Make Payment
            </Button>
          </View>
        }
      />
    </Screen>
  );
}
