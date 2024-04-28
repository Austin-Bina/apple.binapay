import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useCallback, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text, TextInput } from "react-native-paper";
import { z } from "zod";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { serviceProvidersMap } from "@constants/providers";
import VerifiedBadge from "@assets/icons/verified-badge.svg";
import { verticalScale } from "react-native-size-matters";

type Props = ServicesStackScreenProps<"Electricity Bill">;

const schema = z.object({
  provider: z.enum(["aedc"]),
  meter_number: z.string().trim(),
  amount: z.string().trim(),
});

export default function ElectricityPurchaseScreen({ navigation }: Props) {
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
      provider: "aedc",
      meter_number: "09121738252",
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
      transactionId: "electricity_payment",
    });
    closeBottomSheet();
  });

  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Pay Electricity Bill
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500 mb-5`}>
          Effortlessly pay your electricity bill with BinaPay.
        </Text>
        <DropdownMenuField
          label="Service Provider"
          placeholder="Select Provider"
          name="provider"
          control={control}
          search
          data={Object.values(serviceProvidersMap.electricity).map(
            (provider) => ({
              label: provider.label,
              id: provider.key,
              image: provider.logo,
            })
          )}
        />
        <Controller
          control={control}
          name="meter_number"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              label="Meter Number"
              placeholder="+234 000 000 0000"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!errors.meter_number}
              errorMessage={errors.meter_number?.message}
            />
          )}
        />
        <View style={tw`flex-row items-center gap-1.5`}>
          <VerifiedBadge width={24} height={24} />
          <Text variant="titleSmall" style={tw`text-primary-600`}>Abdul Amos</Text>
        </View>
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
                <Text variant="bodyLarge">Product Name:</Text>
                <View style={tw`flex-row items-center gap-2.5`}>
                  <Image
                    width={30}
                    source={require("@assets/images/services/aedc.png")}
                  />
                  <Text style={tw`text-lg font-bold`}>Electricity</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Customer Name:</Text>
                <Text style={tw`text-lg font-bold`}>Abdul Amos</Text>
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
