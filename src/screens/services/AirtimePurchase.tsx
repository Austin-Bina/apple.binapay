import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { Fragment, useCallback, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, Keyboard, TouchableOpacity, View } from "react-native";
import { Button, Checkbox, Text, TouchableRipple } from "react-native-paper";
import { z } from "zod";
import ArrowRight from "@assets/icons/arrow-right.svg";
import Banner from "@components/ui/banner";
import CustomTextInput from "@components/ui/form/TextInput";
import ScrollableView from "@components/ui/shared/ScrollableView";
import Screen from "@components/ui/shared/Screen";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import { Image } from "react-native-element-image";
import { INTERNET_PROVIDERS, serviceProvidersMap } from "@constants/providers";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { scale } from "react-native-size-matters";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { TransactionForm } from "@enum/transaction";
import { formatToNaira } from "@utils/money";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import { selectUser } from "@store/selectors/auth";

type Props = ServicesStackScreenProps<"Airtime Purchase">;

const MIN_PAYMENT_AMOUNT = 50;

const schema = z.object({
  provider: z.enum(INTERNET_PROVIDERS),
  phone: z.string().min(11),
  amount: z
    .string()
    .optional()
    .transform((val) => {
      const numericValue = val ? parseFloat(val.replace(/[₦,]/g, "")) : 0;
      return numericValue;
    })
    .refine((val) => !isNaN(val) && val >= MIN_PAYMENT_AMOUNT, {
      message: `Amount must not be less than ${formatToNaira(MIN_PAYMENT_AMOUNT)}`,
    }),
  type: z.string(),
  ported_number: z.boolean(),
  pin: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AirtimePurchaseScreen({ navigation }: Props) {
  const [fetching, setFetching] = useState(false);

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "mtn",
      phone: user?.phone,
      amount: "0",
      type: "VTU",
      ported_number: false,
    },
    mode: "onChange",
  });

  const values = watch();

  const airtimeTypes = useMemo(() => {
    const selected = values.provider;

    const types = serviceProvidersMap.internet[selected].type;
    return types;
  }, [values.provider]);

  const openBottomSheet = useCallback(async () => {
    const valid = await trigger();
    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => {
        bottomSheet.current?.present();
      }, 100);
    }
  }, [values]);

  const closeBottomSheet = () => {
    bottomSheet.current?.dismiss();
  };

  const handleMakePayment = handleSubmit((values) => {
    const transaction = {
      id: TransactionForm.Airtime,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));
    closeBottomSheet();
    navigation.navigate("Confirm Transaction", {
      transactionId: transaction.id,
    });
  });

  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Buy Airtime
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Top up your mobile credit instantly! Enter the details below to purchase airtime for your mobile phone
        </Text>
        <FlatList
          data={Object.values(serviceProvidersMap.internet)}
          renderItem={({ item: provider }) => (
            <TouchableOpacity
              key={provider.key}
              onPress={() => setValue("provider", provider.key as any)}
              style={[
                tw`p-3 mx-1 border-2 border-primary-100 rounded-xl justify-center items-center`,
                values.provider === provider.key && tw`border-blue-500`,
              ]}>
              <Image source={provider.logo} width={scale(45)} />
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
              value={value}
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
        <Controller
          control={control}
          name="ported_number"
          render={({ field: { value, onChange }, fieldState: { error } }) => (
            <View style={tw`border border-gray-300 rounded-xl w-[50%] overflow-hidden`}>
              <TouchableRipple
                onPress={() => {
                  onChange(!value);
                }}
                style={tw`flex-row items-center `}>
                <Fragment>
                  <Checkbox status={value ? "checked" : "unchecked"} />
                  <Text>Ported Number</Text>
                </Fragment>
              </TouchableRipple>
            </View>
          )}
        />
        <DropdownMenuField
          label="Airtime Type"
          placeholder="Select Airtime Type"
          name="type"
          control={control}
          data={airtimeTypes.map((t) => ({
            label: t,
            id: t,
          }))}
        />
        <View>
          <NairaInput name="amount" control={control} />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>Wallet Balance: {formatToNaira(user?.wallet_balance)}</Text>
        </View>
        <View style={tw`bg-green-50 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full my-5`}>
          <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
            You get ₦{values.amount || 0}
          </Text>
        </View>

        <Banner style={tw`mb-20`} message="You get 10% off when you purchase airtime with us" />
      </ScrollableView>
      <View style={tw`px-4 pb-4 pt-1`}>
        <Button
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-center text-base font-bold`}
          disabled={fetching}
          onPress={openBottomSheet}
          mode="contained">
          Continue
        </Button>
      </View>
      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={["50%", "50%"]}
        closeFilter={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text variant="titleLarge" style={tw`font-bold text-gray-800 mb-2`}>
              Confirm Airtime Purchase
            </Text>
            <View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Network:</Text>
                <View style={tw`flex-row items-center gap-2.5`}>
                  <Image width={30} source={serviceProvidersMap.internet[values.provider].logo} />
                  <Text style={tw`text-lg font-bold`}>{serviceProvidersMap.internet[values.provider].label}</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
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
              labelStyle={tw`text-base`}>
              Make Payment
            </Button>
          </View>
        }
      />

      <TransactionErrorSheet />
    </Screen>
  );
}
