import DropdownMenuField from "@components/ui/form/DropdownMenu";
import NairaInput from "@components/ui/form/NairaInput";
import CustomTextInput from "@components/ui/form/TextInput";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { MAX_CACHE_AGE_SEC } from "@constants/app";
import { serviceProvidersMap } from "@constants/providers";
import { Colors } from "@constants/theme/colors";
import { TransactionForm } from "@enum/transaction";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { useWalletBalanceValidation } from "@hooks/transaction";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { useGetEpinPlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import { selectUser } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { InternetProviders } from "@type/app";
import { calculateTransactionDetails, formatToNaira, zodAmountValidation } from "@utils/money";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View, TouchableOpacity, FlatList, Keyboard, RefreshControl } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { scale } from "react-native-size-matters";
import { z } from "zod";

type Props = ServicesStackScreenProps<"Airtime EPIN Purchase">;

const schema = z.object({
  provider: z.string().min(3),
  amount: zodAmountValidation(100),
  final_amount: zodAmountValidation(100),
  quantity: z.string().refine((val) => !isNaN(Number(val)), { message: "Please enter a valid quantity" }),
  business_name: z.string().trim().min(1, { message: "Please enter a business name" }),
  vendor: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type InitialQuantityAmounts = Map<string, string>;

const defaultValue = "100";

export default function AirtimeEPINPurchaseScreen({ navigation }: Props) {
  const [initialQuantityAmounts, setInitialQuantityAmounts] = useState<InitialQuantityAmounts>(new Map());

  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const { customers, transaction } = useTypedSelector(selectSystemSettings);

  const { data: queryData, isFetching, isError, refetch } = useGetEpinPlansQuery();
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  const { control, watch, setValue, trigger, reset, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: "mtn",
      amount: defaultValue,
      final_amount: "",
      quantity: "1",
      business_name: user?.name,
      vendor: queryData?.vendor,
    },
    mode: "onChange",
  });

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const values = watch();
  const provider = values.provider as InternetProviders;

  useEffect(() => {
    setValue("vendor", queryData?.vendor);
  }, [queryData?.vendor]);

  useEffect(() => {
    prefetchSystemSettings();
  }, []);

  useEffect(() => {
    const quantity = parseInt(values.quantity);
    const initialQuantityAmount = initialQuantityAmounts.get(values.amount);

    if (quantity && !isNaN(quantity) && initialQuantityAmount) {
      const amount = quantity * Number.parseFloat(initialQuantityAmount);

      setValue("final_amount", String(amount));
    }
  }, [values.quantity, values.amount]);

  useEffect(() => {
    const initialQuantityAmounts: InitialQuantityAmounts = new Map();
    const plans = queryData?.epins_plans[provider] || [];

    plans.forEach((plan) => {
      initialQuantityAmounts.set(plan.id, plan.plan_amount);
    });

    setInitialQuantityAmounts(initialQuantityAmounts);

    // Set default plan amount
    const defaultPlan = plans.find((plan) => plan.id === defaultValue);
    setValue("final_amount", defaultPlan?.plan_amount || "0");
  }, [queryData, provider]);

  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.final_amount) || 0,
  });

  const epinPlans = useMemo(() => {
    const plans = queryData?.epins_plans[provider] || [];

    const chargedPlans = plans.map((plan) => {
      const planAmount = parseFloat(`${plan.plan_amount}`);

      return {
        ...plan,
        plan_amount: planAmount,
        amount: plan.id,
        // For client, update the final amount here, used by reset
        final_amount: plan.plan_amount,
      };
    });

    return chargedPlans;
  }, [queryData, provider]);


 /* const dataProviders = useMemo(
    () => Object.values(serviceProvidersMap.internet).filter((p) => transaction.epin.networks.includes(p.serviceId)),
    [transaction.epin],
  );*/
  const dataProviders = useMemo(() => {
  const availableNetworks = Object.keys(queryData?.epins_plans || {}).filter(
    (key) => {
      const plans = (queryData?.epins_plans as Record<string, any[]>)?.[key] ?? [];
      return plans.length > 0;
    }
  );

 


  return Object.values(serviceProvidersMap.internet).filter((p) =>
    availableNetworks.includes(p.serviceId)
  );
}, [queryData]);

  const quantityOptions = queryData?.quantity_options || [];

  const extraPlanDetails = useMemo(() => {
  const totalAmount = parseFloat(values.final_amount) || 0; // ✅ qty already multiplied here
  return calculateTransactionDetails(totalAmount, "epin", customers);
}, [values.final_amount, customers]); // ✅ reacts to quantity changes too

  const snapSize = "58%";

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

  const onRefresh = async () => {
    if (!isFetching) {
      refetch();
      prefetchSystemSettings();
    }
  };

  const transactionDetails = [
    {
      label: "Product Name",
      value: "ePIN",
      icon: serviceProvidersMap.internet[values.provider].logo,
    },
    { label: "Business Name", value: values.business_name },
    ...Object.keys(extraPlanDetails).map((key) => ({ label: key, value: extraPlanDetails[key] })),
  ];


    useEffect(() => {
  if (!dataProviders.find(p => p.serviceId === provider)) {
    const first = dataProviders[0];
    if (first) {
      setValue("provider", first.serviceId);
    }
  }
}, [dataProviders]);


  return (
    <Screen>
      <ScrollableView
        contentContainerStyle={tw`px-4 py-5 justify-between`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refetch} />}>
        <View>
          <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
            Airtime EPIN Purchase & Printing
          </Text>
          <Text variant="bodySmall" style={tw`text-gray-500`}>
            Easily purchase airtime EPIN and print them for distribution. Enter the details below to proceed.
          </Text>
          <FlatList
            data={dataProviders}
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
            ListEmptyComponent={
              <View style={tw`bg-red-50 p-4 rounded-lg items-start`}>
                <Text>No ePIN providers available</Text>
              </View>
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`items-center`}
            style={tw`my-5`}
          />

          {isError && !isFetching && (
            <View style={tw`bg-red-50 p-4 rounded-lg items-start`}>
              <Text variant="bodySmall">We had trouble loading your Epin plans. Please try again.</Text>
              <Button onPress={onRefresh} textColor={Colors.primary[500]}>
                Try again
              </Button>
            </View>
          )}

          <DropdownMenuField
            label="Value (Denomination)"
            placeholder="Select Price Options"
            name="amount"
            control={control}
            data={epinPlans}
            onDataSelect={(plan) => {
              reset({
                ...values,
                amount: String(plan.plan_amount),
                 final_amount: plan.final_amount,  
                  quantity: "1",  
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
            <NairaInput name="final_amount" control={control} isDisabled />
            <WalletBalanceHelper {...walletValidation} />
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
        </View>

        <Button
          style={tw`w-full rounded-full mt-4`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-center text-base font-bold`}
          onPress={openBottomSheet}
          disabled={!walletValidation.canPay || dataProviders.length === 0}
          mode="contained">
          Proceed
        </Button>
      </ScrollableView>

      <BottomSheetModal
        ref={bottomSheet}
        title="Confirm ePIN Bundle Purchase"
        details={transactionDetails}
        buttonLabel="Make Payment"
        onConfirm={handleMakePayment}
        onDismiss={closeBottomSheet}
        snapPoints={[snapSize, snapSize]}
        disabled={!walletValidation.canPay}
      />
      <TransactionErrorSheet />
      <PleaseWaitModal visible={isFetching} />
    </Screen>
  );
}
