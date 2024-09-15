import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { serviceProvidersMap } from "@constants/providers";
import { TransactionForm } from "@enum/transaction";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { useGetEpinPlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import { selectUser } from "@store/selectors/auth";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { formatToNaira } from "@utils/money";
import React, { useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, TouchableOpacity, FlatList, Keyboard, RefreshControl } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { scale } from "react-native-size-matters";
import { z } from "zod";

type Props = ServicesStackScreenProps<"Airtime EPIN Purchase">;

const schema = z.object({
  provider: z.string(),
  amount: z.number().min(100),
  quantity: z.number().min(1),
  business_name: z.string(),
});

type FormData = z.infer<typeof schema>;

export default function AirtimeEPINPurchaseScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const { data: queryData, isFetching, refetch } = useGetEpinPlansQuery();
  const { control, watch, setValue, trigger, reset, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "mtn",
      amount: 100,
      quantity: 1,
      business_name: user?.name,
    },
  });
  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const values = watch();

  const epinPlans = queryData?.epins_plans || [];
  const quantityOptions = queryData?.quantity_options || [];

  const openBottomSheet = useCallback(async () => {
    const valid = await trigger();
    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => {
        bottomSheet.current?.present();
      }, 100);
    }
  }, [trigger]);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  const handleMakePayment = handleSubmit((values) => {
    const transaction = {
      id: TransactionForm.Epins,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));

    navigation.navigate("Confirm Transaction", {
      transactionId: transaction.id,
    });

    closeBottomSheet();
  });

  return (
    <Screen>
      <ScrollableView
        style={tw`flex-1 px-4 pt-5`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
          Airtime EPIN Purchase & Printing
        </Text>
        <Text variant="bodySmall" style={tw`text-gray-500`}>
          Easily purchase airtime EPIN and print them for distribution. Enter the details below to proceed.
        </Text>
        <FlatList
          data={Object.values(serviceProvidersMap.internet)}
          renderItem={({ item: provider }) => (
            <TouchableOpacity
              key={provider.serviceId}
              onPress={() => setValue("provider", provider.serviceId)}
              style={[
                tw`p-3 mx-1 border-2 border-primary-100 rounded-xl justify-center items-center`,
                values.provider === provider.serviceId && tw`border-blue-500`,
              ]}>
              <Image source={provider.logo} width={scale(45)} />
            </TouchableOpacity>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={tw`items-center`}
          style={tw`my-5`}
        />
        <DropdownMenuField
          label="Value (Denomination)"
          placeholder="Select Price Options"
          name="amount"
          control={control}
          data={epinPlans}
          onDataSelect={(plan) => {
            reset({
              ...values,
              amount: plan.plan_amount,
            });
          }}
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
          render={({ fieldState: { error }, field: { onChange, onBlur, value } }) => (
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
          <NairaInput name="amount" control={control} isDisabled />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>Wallet Balance: {formatToNaira(user?.wallet_balance)}</Text>
        </View>
        <View style={tw`p-4 border relative mt-5 mb-12`}>
          <View>
            <Text variant="titleMedium">
              {[values.provider.toUpperCase(), formatToNaira(values.amount), values.business_name].join(" | ")}
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
              style={[tw`font-black text-[#FF0000] opacity-60`, { transform: [{ rotate: "10.88deg" }] }]}>
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
          onPress={openBottomSheet}
          mode="contained">
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
                  <Image width={30} source={serviceProvidersMap.internet[values.provider].logo} />
                  <Text style={tw`text-lg font-bold`}>ePIN</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Business Name:</Text>
                <Text style={tw`text-lg font-bold`}>{values.business_name}</Text>
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
      <PleaseWaitModal visible={isFetching} />
    </Screen>
  );
}
