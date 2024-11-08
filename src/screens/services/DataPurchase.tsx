import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { serviceProvidersMap } from "@constants/providers";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, Keyboard, RefreshControl, TouchableOpacity, View } from "react-native";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { z } from "zod";
import ArrowRight from "@assets/icons/arrow-right.svg";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { scale, vs } from "react-native-size-matters";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import { useTypedSelector, useTypedDispatch } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { TransactionForm } from "@enum/transaction";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { useGetDataPlansQuery } from "@store/redux-api/utilityBillsQueryApi";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { InternetProviders } from "@type/app";
import { calculateTransactionDetails, formatToNaira } from "@utils/money";
import { selectSystemSettings } from "@store/selectors/settings";
import { usePhoneValidation } from "@hooks/phone";
import PortedNumberAccordion from "@components/ui/widgets/ported-number-accordion";
import MaskedInput from "@components/ui/form/mask-input";
import { MAX_CACHE_AGE_SEC, phone_mask } from "@constants/app";
import { getDefaultProvider, zodPhoneValidation } from "@utils/phone";
import { useWalletBalanceValidation } from "@hooks/transaction";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { Colors } from "@constants/theme/colors";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import ContactPickerModal from "@components/ui/modals/pick-contacts";

type Props = ServicesStackScreenProps<"Data Purchase">;

const schema = z.object({
  provider: z.string().min(3),
  phone: zodPhoneValidation,
  data_bundle: z.string(),
  data_amount: z.string(),
  ported_number: z.boolean(),
  payAmount: z.number(),
  amount: z.string(),
  type: z.string(),
});

type FormValues = z.infer<typeof schema>;

export default function DataPurchaseScreen({ navigation }: Props) {
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);

  const { data, isFetching, isError, refetch } = useGetDataPlansQuery();
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });
  const user = useTypedSelector(selectUser);
  const { customers } = useTypedSelector(selectSystemSettings);
  const dispatch = useTypedDispatch();
  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  const { control, watch, trigger, clearErrors, setError, reset, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: getDefaultProvider(user?.phone),
      phone: user?.phone,
      data_bundle: "",
      data_amount: "",
      amount: "0",
      payAmount: 0,
      ported_number: false,
      type: "",
    },
    mode: "onChange",
  });

  const values = watch();
  const provider = values.provider as InternetProviders;

  useEffect(() => {
    prefetchSystemSettings();
  }, []);

  const revalidatePhone = usePhoneValidation({
    phone: values.phone,
    provider: values.provider,
    portedNumber: values.ported_number,
    setError,
    clearErrors,
  });

  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.amount) || 0,
  });

  const dataPlans = useMemo(() => {
    const chargePercentage = customers.data_charge_percentage;
    const plans = data?.data_plans[provider] || [];
    const type = values.type;

    const chargedPlans = plans
      .filter((plan) => (!!type ? plan.plan_type === type : true))
      .map((plan) => {
        const planId = plan.id.toString();

        const planAmount = parseFloat(plan.plan_amount);
        const chargeAmount = (chargePercentage / 100) * planAmount;
        const newPrice = planAmount + chargeAmount;

        return {
          label: `${plan.plan} - ${formatToNaira(newPrice)} / ${plan.month_validate}`,
          amount: plan.plan_amount,
          data_amount: plan.plan,
          data_bundle: planId,
          type: plan.plan_type,
          payAmount: newPrice,
          id: planId,
        };
      });

    return chargedPlans;
  }, [data, values.provider, values.type, customers]);

  const dataTypes = useMemo(() => {
    const types = new Set<string>();
    const plans = data?.data_plans[provider] || [];

    plans.forEach((plan) => types.add(plan.plan_type));

    return Array.from(types).map((type) => ({
      label: type,
      id: type,
    }));
  }, [dataPlans, data]);

  const extraPlanDetails = useMemo(() => {
    return calculateTransactionDetails(parseFloat(values.amount) || 0, "data", customers);
  }, [values.amount, customers]);

  const snapSize = "58%";

  const onSelectProvider = useCallback(
    (serviceId: string) => {
      reset({
        ...values,
        provider: serviceId,
        type: "",
        data_amount: "",
        data_bundle: "",
        ported_number: false,
      });
    },
    [values],
  );

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
    if (!revalidatePhone()) return;

    const transaction = {
      id: TransactionForm.Data,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));

    closeBottomSheet();

    navigation.navigate("Confirm Transaction", {
      transactionId: transaction.id,
    });
  });

  const onRefresh = async () => {
    if (!isFetching) {
      refetch();
      prefetchSystemSettings();
    }
  };

  const handleOpenContactModal = () => {
    setIsContactModalVisible(true);
  };
  const handleCloseContactModal = () => {
    setIsContactModalVisible(false);
  };

  const handleSelectContact = (phoneNumber: string) => {
    reset({ ...values, phone: phoneNumber, provider: getDefaultProvider(phoneNumber) });
  };

  const transactionDetails = [
    {
      label: "Network",
      value: values.provider,
      icon: serviceProvidersMap.internet[values.provider].logo,
    },
    { label: "Data Amount", value: values.data_amount },
    { label: "Number", value: values.phone },
    ...Object.keys(extraPlanDetails).map((key) => ({ label: key, value: extraPlanDetails[key] })),
  ];

  return (
    <Screen>
      <ScrollableView
        contentContainerStyle={tw`justify-between px-4 py-5`}
        refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}>
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
                onPress={() => onSelectProvider(provider.serviceId)}
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

          {isError && !isFetching && (
            <View style={tw`bg-red-50 p-4 rounded-lg items-start`}>
              <Text variant="bodySmall">We had trouble loading your data plans. Please try again.</Text>
              <Button onPress={onRefresh} textColor={Colors.primary[500]}>
                Try again
              </Button>
            </View>
          )}

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <MaskedInput
                mask={phone_mask}
                label="Phone Number"
                placeholder="080 0000000000"
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
            <TouchableOpacity onPress={handleOpenContactModal}>
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
              <PortedNumberAccordion
                onPress={() => {
                  onChange(!value);
                }}
                checked={value}
              />
            )}
          />

          <DropdownMenuField
            label="Data Type"
            placeholder="Select Data Type"
            name="type"
            control={control}
            data={dataTypes}
          />

          <DropdownMenuField
            search
            label="Data Bundle"
            placeholder="Select Data Bundle"
            name="data_bundle"
            control={control}
            data={dataPlans}
            onDataSelect={(plan) => {
              reset({
                ...values,
                ...plan,
              });
            }}
          />

          <View>
            <NairaInput name="payAmount" control={control} isDisabled />
            <WalletBalanceHelper {...walletValidation} />
          </View>
          {values.data_amount && (
            <View style={tw`bg-green-50 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full my-5`}>
              <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
                You get {values.data_amount}
              </Text>
            </View>
          )}
        </View>

        <Button
          style={tw`w-full rounded-full mt-4`}
          contentStyle={tw`py-2`}
          disabled={!walletValidation.canPay}
          labelStyle={tw`text-white text-center text-base font-bold`}
          onPress={openBottomSheet}
          mode="contained">
          Proceed
        </Button>
      </ScrollableView>

      <BottomSheetModal
        ref={bottomSheet}
        title="Confirm Data Bundle Purchase"
        details={transactionDetails}
        buttonLabel="Make Payment"
        onConfirm={handleMakePayment}
        onDismiss={closeBottomSheet}
        snapPoints={[snapSize, snapSize]}
        disabled={!walletValidation.canPay}
      />
      <ContactPickerModal
        index={1}
        isVisible={isContactModalVisible}
        onClose={handleCloseContactModal}
        onSelectContact={handleSelectContact}
      />

      <TransactionErrorSheet />
      <PleaseWaitModal visible={isFetching} />
    </Screen>
  );
}
