import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { INTERNET_PROVIDERS, serviceProvidersMap } from "@constants/providers";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { Fragment, useCallback, useRef } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, Keyboard, RefreshControl, TouchableOpacity, View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Checkbox, Text, TouchableRipple } from "react-native-paper";
import { z } from "zod";
import ArrowRight from "@assets/icons/arrow-right.svg";
import Banner from "@components/ui/banner";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { scale } from "react-native-size-matters";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import { useTypedSelector, useTypedDispatch } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { TransactionForm } from "@enum/transaction";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { useGetDataPlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { InternetProviders } from "@type/app";
import { formatToNaira } from "@utils/money";
import { upperCaseFirst } from "@utils/index";

type Props = ServicesStackScreenProps<"Data Purchase">;

const schema = z.object({
  provider: z.enum(INTERNET_PROVIDERS),
  phone: z.string().min(11),
  data_bundle: z.string(),
  data_amount: z.string(),
  ported_number: z.boolean(),
  amount: z.string(),
  type: z.string(),
});

export default function DataPurchaseScreen({ navigation }: Props) {
  const { data, isFetching, refetch } = useGetDataPlansQuery();
  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  const { control, watch, trigger, setValue, reset, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "mtn",
      phone: user?.phone,
      data_bundle: "",
      data_amount: "",
      amount: "0",
      ported_number: false,
      type: "",
    },
  });

  const values = watch();
  const upperCaseProvider = upperCaseFirst(values.provider);

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
      id: TransactionForm.Data,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));

    navigation.navigate("Confirm Transaction", {
      transactionId: transaction.id,
    });

    closeBottomSheet();
  });

  const provider = values.provider as InternetProviders;
  const selectedProviderPlans = data?.data_plans[provider] || [];

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`justify-between px-4 py-5`} refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Buy Data Bundle
          </Text>
          <Text variant="bodySmall" style={tw`text-gray-500`}>
            Stay connected with our data bundles! Select your preferred options below to purchase a data bundle.
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
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Phone Number"
                placeholder="+234 000 000 0000"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
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
              <View style={tw`border border-gray-300 rounded-xl my-4 overflow-hidden`}>
                <TouchableRipple
                  onPress={() => {
                    onChange(!value);
                  }}
                  style={tw`flex-row items-center `}>
                 <Fragment>
                    <Checkbox status={value ? "checked" : "unchecked"} />
                    <Text>Are you sure this is an {upperCaseProvider} number?</Text>
                  </Fragment>
                </TouchableRipple>
              </View>
            )}
          />
          <DropdownMenuField
            label="Data Bundle"
            placeholder="Select Data Bundle"
            name="data_bundle"
            control={control}
            data={selectedProviderPlans.map((plan) => ({
              label: `${plan.plan} - ${formatToNaira(plan.plan_amount)}`,
              amount: plan.plan_amount,
              data_amount: plan.plan,
              type: plan.plan_type,
              id: plan.id.toString(),
            }))}
            onDataSelect={(plan) => {
              reset({
                ...values,
                amount: plan.amount,
                data_amount: plan.data_amount,
                data_bundle: plan.id,
                type: plan.type,
              });
            }}
          />
          <View>
            <NairaInput name="amount" control={control} isDisabled />
            <Text style={tw`text-primary-900 text-sm mt-2.5`}>
              Wallet Balance: {formatToNaira(user?.wallet_balance)}
            </Text>
          </View>
          <View style={tw`bg-green-50 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full my-5`}>
            <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
              You get {values.data_amount}
            </Text>
          </View>

          <Banner style={tw`mb-10`} message="You get 10% off when you purchase airtime with us" />
        </View>
        <View style={tw`px-4 mb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            labelStyle={tw`text-white text-center text-base font-bold`}
            onPress={openBottomSheet}
            mode="contained">
            Proceed
          </Button>
        </View>
      </ScrollableView>

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
                  <Image width={30} source={serviceProvidersMap.internet[values.provider].logo} />
                  <Text style={tw`text-lg font-bold`}>{serviceProvidersMap.internet[values.provider].name}</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Data Amount:</Text>
                <Text style={tw`text-lg font-bold`}>{values.data_amount}</Text>
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
      <PleaseWaitModal visible={isFetching} />
    </Screen>
  );
}
