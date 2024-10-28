import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { FlatList, Keyboard, RefreshControl, TouchableOpacity, View } from "react-native";
import { Button, Text } from "react-native-paper";
import { z } from "zod";
import ArrowRight from "@assets/icons/arrow-right.svg";
import Banner from "@components/ui/banner";
import ScrollableView from "@components/ui/shared/ScrollableView";
import Screen from "@components/ui/shared/Screen";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Image } from "react-native-element-image";
import { serviceProvidersMap } from "@constants/providers";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { scale } from "react-native-size-matters";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { TransactionForm } from "@enum/transaction";
import { calculateTransactionDetails, formatToNaira, zodAmountValidation } from "@utils/money";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import { selectUser } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import MaskedInput from "@components/ui/form/mask-input";
import { MAX_CACHE_AGE_SEC, phone_mask } from "@constants/app";
import { usePhoneValidation } from "@hooks/phone";
import PortedNumberAccordion from "@components/ui/widgets/ported-number-accordion";
import { getDefaultProvider, zodPhoneValidation } from "@utils/phone";
import { useWalletBalanceValidation } from "@hooks/transaction";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import ContactPickerModal from "@components/ui/modals/pick-contacts";

type Props = ServicesStackScreenProps<"Airtime Purchase">;

const MIN_PAYMENT_AMOUNT = 50;
const schema = z.object({
  provider: z.string().min(3),
  phone: zodPhoneValidation,
  amount: zodAmountValidation(MIN_PAYMENT_AMOUNT, true),
  type: z.string(),
  ported_number: z.boolean(),
  pin: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AirtimePurchaseScreen({ navigation }: Props) {
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const { customers } = useTypedSelector(selectSystemSettings);
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  const {
    control,
    watch,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    formState: { errors },
    trigger,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: getDefaultProvider(user?.phone),
      phone: user?.phone,
      amount: "0",
      type: "VTU",
      ported_number: false,
    },
    mode: "onChange",
  });

  const values = watch();

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

  const extraPlanDetails = useMemo(() => {
    return calculateTransactionDetails(parseFloat(values.amount) || 0, "airtime", customers);
  }, [values.amount, customers]);

  const snapSize = "58%";

  const airtimeTypes = useMemo(() => {
    const selected = values.provider;

    const types = serviceProvidersMap.internet[selected].type;
    return types;
  }, [values.provider]);

  const onSelectProvider = useCallback(
    (serviceId: string) => {
      reset({
        ...values,
        provider: serviceId,
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
  }, [values, walletValidation.canPay]);

  const closeBottomSheet = () => {
    bottomSheet.current?.dismiss();
  };

  const handleMakePayment = handleSubmit((values) => {
    if (!revalidatePhone()) return;

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

  const onRefresh = async () => {
    prefetchSystemSettings();
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
            Buy Airtime
          </Text>
          <Text variant="bodySmall" style={tw`text-gray-500`}>
            Top up your mobile credit instantly! Enter the details below to purchase airtime for your mobile phone
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
          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <MaskedInput
                mask={phone_mask}
                label="Phone Number"
                placeholder="0800 000 000 000"
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
            render={({ field: { value, onChange } }) => (
              <PortedNumberAccordion
                onPress={() => {
                  onChange(!value);
                }}
                checked={value}
              />
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
            <WalletBalanceHelper {...walletValidation} />
          </View>

          <View style={tw`bg-green-50 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full my-5`}>
            <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
              You get {formatToNaira(values.amount || 0)}
            </Text>
          </View>

          <Banner
            style={tw`mb-10`}
            content={`You get ${customers.airtime_discount_percentage}% off when you purchase airtime with us`}
          />
        </View>
        <Button
          style={tw`w-full rounded-full mt-4`}
          contentStyle={tw`py-2`}
          disabled={!walletValidation.canPay}
          labelStyle={tw`text-white text-center text-base font-bold`}
          onPress={openBottomSheet}
          mode="contained">
          Continue
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
    </Screen>
  );
}
