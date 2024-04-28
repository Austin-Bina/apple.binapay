import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { INTERNET_PROVIDERS, serviceProvidersMap } from "@constants/providers";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { phoneValidation } from "@utils/phone";
import React, { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, TouchableOpacity, View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text, TextInput } from "react-native-paper";
import { z } from "zod";
import ArrowRight from "@assets/icons/arrow-right.svg";
import Banner from "@components/ui/banner";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { scale, verticalScale } from "react-native-size-matters";

type Props = ServicesStackScreenProps<"Data Purchase">;

const schema = z.object({
  provider: z.enum(INTERNET_PROVIDERS),
  phone: phoneValidation,
  data_bundle: z.string(),
  amount: z.string(),
});

const dataBundles = [
  {
    label: "Daily Plan (500MB)",
    id: "daily_500mb",
  },
  {
    label: "Weekly Plan (1.5GB)",
    id: "weekly_1.5gb",
  },
  {
    label: "Monthly Plan (5GB)",
    id: "monthly_5gb",
  },
  {
    label: "Night Plan (10GB)",
    id: "night_10gb",
  },
];

export default function DataPurchaseScreen({ navigation }: Props) {
  const [fetching, setFetching] = useState(false);

  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "mtn",
      phone: ["09121738252", "NG"],
      data_bundle: "daily_500mb",
      amount: "100",
    },
  });

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
      transactionId: "data_purchase",
    });
    closeBottomSheet();
  });

  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Buy Data Bundle
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Stay connected with our data bundles! Select your preferred options
          below to purchase a data bundle.
        </Text>
        <FlatList
          data={Object.values(serviceProvidersMap.internet)}
          renderItem={({ item: provider }) => (
            <TouchableOpacity
              key={provider.key}
              onPress={() => setValue("provider", provider.key)}
              style={[
                tw`p-3 mx-1 border border-primary-100 rounded-xl justify-center items-center`,
                values.provider === provider.key &&
                  tw`border-blue-500 border-2`,
              ]}
            >
              <Image source={provider.logo} width={scale(50)} />
            </TouchableOpacity>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`items-center`}
          style={tw`my-5`}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              label="Phone Number"
              placeholder="+234 000 000 0000"
              mode="outlined"
              onBlur={onBlur}
              value={value?.[0] || ""}
              onChangeText={onChange}
              error={!!errors.phone}
              errorMessage={errors.phone?.message}
            />
          )}
        />
        <View style={tw`flex-row justify-end`}>
          <TouchableOpacity onPress={() => {}}>
            <View style={tw`flex-row items-center gap-1`}>
              <Text style={tw`text-primary text-xs`}>Select from Contact</Text>
              <ArrowRight width={20} />
            </View>
          </TouchableOpacity>
        </View>
        <DropdownMenuField
          label="Data Bundle"
          placeholder="Select Data Bundle"
          name="type"
          control={control}
          data={dataBundles}
        />
        <View>
          <NairaInput name="amount" control={control} />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>
            Wallet Balance: ₦20,000.00
          </Text>
        </View>
        <View
          style={tw`bg-green-50 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full my-5`}
        >
          <Text
            variant="bodyMedium"
            style={tw`text-green-600 text-center font-bold`}
          >
            You get {values.amount} GB
          </Text>
        </View>

        <Banner
          style={tw`mb-20`}
          message="You get 10% off when you purchase airtime with us"
        />
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
              Confirm Data Bundle Purchase
            </Text>
            <View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Network:</Text>
                <View style={tw`flex-row items-center gap-2.5`}>
                  <Image
                    width={30}
                    source={serviceProvidersMap.internet[values.provider].logo}
                  />
                  <Text style={tw`text-lg font-bold`}>
                    {serviceProvidersMap.internet[values.provider].label}
                  </Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Data Amount:</Text>
                <Text style={tw`text-lg font-bold`}>500GB</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Number:</Text>
                <Text style={tw`text-lg font-bold`}>{values.phone}</Text>
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
