import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { INTERNET_PROVIDERS, serviceProvidersMap } from "@constants/providers";
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

type Props = ServicesStackScreenProps<"Airtime EPIN Purchase">;

const schema = z.object({
  provider: z.enum(INTERNET_PROVIDERS),
  amount: z.string(),
  value: z.string(),
  quantity: z.string(),
  business_name: z.string(),
});

const priceOptions = [
  { label: "N200", id: "200" },
  { label: "N500", id: "500" },
  { label: "N1,000", id: "1000" },
  { label: "N2,500", id: "2500" },
  { label: "N5,000", id: "5000" },
];

const quantityOptions = [
  { label: "10", id: "10" },
  { label: "30", id: "30" },
  { label: "60", id: "60" },
  { label: "100", id: "100" },
  { label: "200", id: "200" },
];

export default function AirtimeEPINPurchaseScreen({ navigation }: Props) {
  const [fetching, setFetching] = useState(false);

  const { control, watch, setValue, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "mtn",
      amount: "13,464.00",
      value: "200",
      quantity: "10",
      business_name: "JBMobileService",
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
      transactionId: "airtime_epin_purchase",
    });
    closeBottomSheet();
  });

  return (
    <Screen>
      <ScrollableView style={tw`flex-1 px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Airtime EPIN Purchase & Printing
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Easily purchase airtime EPIN and print them for distribution. Enter
          the details below to proceed.
        </Text>
        <View style={tw`flex-row items-center justify-around my-5`}>
          {Object.values(serviceProvidersMap.internet).map((provider) => (
            <TouchableOpacity
              key={provider.key}
              onPress={() => setValue("provider", provider.key)}
              style={[
                tw`p-3 mb-2 border border-primary-100 rounded-xl justify-center items-center`,
                values.provider === provider.key &&
                  tw`border-blue-500 border-2`,
              ]}
            >
              <Image source={provider.logo} width={60} />
            </TouchableOpacity>
          ))}
        </View>
        <DropdownMenuField
          label="Value (Denomination)"
          placeholder="Select Price Options"
          name="value"
          control={control}
          data={priceOptions}
        />
        <DropdownMenuField
          label="Quantity"
          placeholder="Select quantity"
          name="quantity"
          control={control}
          data={quantityOptions}
        />
        <Controller
          control={control}
          name="business_name"
          render={({
            fieldState: { error },
            field: { onChange, onBlur, value },
          }) => (
            <CustomTextInput
              label="Business Name"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!error}
              errorMessage={error?.message}
            />
          )}
        />
        <View>
          <NairaInput name="amount" control={control} />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>
            Wallet Balance: ₦20,000.00
          </Text>
        </View>
        <View style={tw`p-4 border relative mt-5 mb-12`}>
          <View>
            <Text variant="titleMedium">
              {[
                values.provider.toUpperCase(),
                formatNairaValue(values.value),
                values.business_name,
              ].join(" | ")}
            </Text>
            <View style={tw`flex-row items-center gap-2`}>
              <Text variant="titleMedium">PIN:</Text>
              <Text variant="headlineMedium" style={tw`text-lg font-black`}>
                1234-9856-2829-4561
              </Text>
            </View>
            <View style={tw`flex-row items-center gap-2`}>
              <Text variant="titleMedium">Serial #:</Text>
              <Text variant="titleMedium">4134186359470712</Text>
            </View>
            <Text variant="titleMedium">Dial *555*PIN#, then Send</Text>
          </View>
          <View style={tw`absolute inset-0 justify-center items-center`}>
            <Text
              variant="displayLarge"
              style={[
                tw`font-black text-[#FF0000] opacity-60`,
                { transform: [{ rotate: "10.88deg" }] },
              ]}
            >
              SAMPLE
            </Text>
          </View>
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
              Confirm ePIN Bundle Purchase
            </Text>
            <View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Product Name:</Text>
                <View style={tw`flex-row items-center gap-2.5`}>
                  <Image
                    width={30}
                    source={serviceProvidersMap.internet[values.provider].logo}
                  />
                  <Text style={tw`text-lg font-bold`}>ePIN</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Business Name:</Text>
                <Text style={tw`text-lg font-bold`}>
                  {values.business_name}
                </Text>
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
