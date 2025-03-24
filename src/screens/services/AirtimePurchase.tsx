import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  RefreshControl,
  TouchableOpacity,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Appbar, Button, Text, useTheme } from "react-native-paper";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { addPendingTransaction } from "@store/slice/transactionSlice";
import { TransactionForm } from "@enum/transaction";
import { calculateTransactionDetails, formatToNaira, zodAmountValidation } from "@utils/money";
import { selectUser } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import { MAX_CACHE_AGE_SEC, phone_mask } from "@constants/app";
import { usePhoneValidation } from "@hooks/phone";
import { getDefaultProvider, zodPhoneValidation } from "@utils/phone";
import { useWalletBalanceValidation } from "@hooks/transaction";
import { useSystemSettingsPrefetch } from "@store/redux-api/systemSettingsApi";
import { serviceProvidersMap } from "@constants/providers";
import { scale } from "react-native-size-matters";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Image } from "react-native-element-image";
import { History, Wallet } from "lucide-react-native";
import { SCREENS } from "@constants/screens";
import { getNavigate } from "@utils/navigation";

import ArrowRight from "@assets/icons/arrow-right.svg";
import Banner from "@components/ui/banner";
import ScrollableView from "@components/ui/shared/ScrollableView";
import MaskedInput from "@components/ui/form/mask-input";
import NairaInput from "@components/ui/form/NairaInput";
import WalletBalanceHelper from "@components/ui/form/wallet-balance";
import BottomSheetModal from "@components/ui/modals/preview-transaction";
import ContactPickerModal from "@components/ui/modals/pick-contacts";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";

type Props = ServicesStackScreenProps<"Airtime Purchase">;

const MIN_PAYMENT_AMOUNT = 50;
const schema = z.object({
  provider: z.string().min(3),
  phone: zodPhoneValidation,
  amount: zodAmountValidation(MIN_PAYMENT_AMOUNT, true),
  pin: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function AirtimePurchaseScreen({ navigation }: Props) {
  const theme = useTheme();
  const [isContactModalVisible, setIsContactModalVisible] = useState(false);
  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  
  // Redux state
  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const { customers, transaction } = useTypedSelector(selectSystemSettings);
  
  const prefetchSystemSettings = useSystemSettingsPrefetch("getSystemSettings", {
    ifOlderThan: MAX_CACHE_AGE_SEC,
  });

  // Form setup
  const {
    control,
    watch,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    trigger,
    formState: { errors, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      provider: getDefaultProvider(user?.phone),
      phone: user?.phone,
      amount: "0",
    },
    mode: "onChange",
  });

  const values = watch();

  useEffect(() => {
    prefetchSystemSettings();
  }, [prefetchSystemSettings]);

  // Hook for phone validation
  const revalidatePhone = usePhoneValidation({
    phone: values.phone,
    provider: values.provider,
    portedNumber: true, // Always set to true as requested
    setError,
    clearErrors,
  });

  // Hook for wallet balance validation
  const walletValidation = useWalletBalanceValidation({
    amount: parseFloat(values.amount) || 0,
  });

  const extraPlanDetails = useMemo(() => {
    return calculateTransactionDetails(parseFloat(values.amount) || 0, "airtime", customers);
  }, [values.amount, customers]);

  const airtimeProviders = useMemo(
    () => Object.values(serviceProvidersMap.internet).filter((p) => transaction.airtime.networks.includes(p.serviceId)),
    [transaction.airtime],
  );

  // Handlers
  const onRefresh = useCallback(() => {
    prefetchSystemSettings();
  }, [prefetchSystemSettings]);

  const onSelectProvider = useCallback(
    (serviceId: string) => {
      reset({
        ...values,
        provider: serviceId,
      });
    },
    [values, reset],
  );
  
  const navigateToTransactionHistory = useCallback(async () => {
    const { navigate } = await getNavigate();
    navigate("Main", {
      screen: SCREENS.HOME,
      params: { screen: SCREENS.TRANSACTION_HISTORY },
    });
  }, []);

  const handleOpenContactModal = useCallback(() => {
    setIsContactModalVisible(true);
  }, []);
  
  const handleCloseContactModal = useCallback(() => {
    setIsContactModalVisible(false);
  }, []);

  const handleSelectContact = useCallback((phoneNumber: string) => {
    reset({ 
      ...values, 
      phone: phoneNumber, 
      provider: getDefaultProvider(phoneNumber) 
    });
  }, [values, reset]);

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
      id: TransactionForm.Airtime,
      data: values,
    };

    dispatch(addPendingTransaction(transaction));
    closeBottomSheet();
    navigation.navigate("Confirm Transaction", {
      transactionId: transaction.id,
    });
  });

  const transactionDetails = useMemo(() => [
    {
      label: "Network",
      value: values.provider,
      icon: serviceProvidersMap.internet[values.provider]?.logo,
    },
    { label: "Number", value: values.phone },
    ...Object.keys(extraPlanDetails).map((key) => ({ label: key, value: extraPlanDetails[key] })),
  ], [values.provider, values.phone, extraPlanDetails]);

  return (
    <KeyboardAvoidingView
      style={tw`flex-1 bg-white`}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <StatusBar backgroundColor="white" barStyle="dark-content" />
      <SafeAreaView style={tw`flex-1`}>
        <Appbar.Header style={tw`bg-white`}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content
            title="Buy Airtime"
            titleStyle={tw`text-lg font-bold text-gray-800`}
          />
          <Appbar.Action
            icon={() => <History size={24} color={theme.colors.primary} />}
            onPress={navigateToTransactionHistory}
            rippleColor="transparent"
          />
        </Appbar.Header>

        <ScrollableView
          contentContainerStyle={tw`pb-24 px-4 pt-2`}
          refreshControl={<RefreshControl refreshing={false} onRefresh={onRefresh} />}
        >
          <Text variant="bodySmall" style={tw`text-gray-500 mb-6`}>
            Top up your mobile credit instantly! Enter the details below to purchase airtime for your mobile phone
          </Text>

          {/* Network Providers */}
          <FlatList
            data={airtimeProviders}
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
            ListEmptyComponent={
              <View style={tw`bg-red-50 p-4 rounded-lg items-start`}>
                <Text>No airtime providers available</Text>
              </View>
            }
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={tw`items-center`}
            style={tw`mb-6`}
          />

          {/* Phone Number Input */}
          <View style={tw`mb-5`}>
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

            <View style={tw`flex-row justify-end mt-1`}>
              <TouchableOpacity onPress={handleOpenContactModal}>
                <View style={tw`flex-row items-center gap-1`}>
                  <Text style={tw`text-primary text-xs`}>Select from Contact</Text>
                  <ArrowRight width={20} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount Input */}
          <View style={tw`mb-5`}>
            <NairaInput name="amount" control={control} />
            <WalletBalanceHelper {...walletValidation} />
          </View>

          {/* Airtime Discount Banner */}
          <View style={tw`bg-green-50 flex-row justify-center items-center p-3 rounded-xl gap-1 w-full mb-4`}>
            <Text variant="bodyMedium" style={tw`text-green-600 text-center font-bold`}>
              You get {formatToNaira(values.amount || 0)}
            </Text>
          </View>

          <Banner
            style={tw`mb-6`}
            content={`You get ${customers.airtime_discount_percentage}% off when you purchase airtime with us`}
          />
        </ScrollableView>

        {/* Fixed bottom button */}
        <SafeAreaView style={tw`bg-white border-t border-gray-200`}>
          <View style={tw`px-4 py-3`}>
            <Button
              style={tw`rounded-full border`}
              contentStyle={tw`py-2`}
              disabled={!walletValidation.canPay || airtimeProviders.length === 0 || !isValid}
              labelStyle={tw`text-white text-base font-semibold`}
              onPress={openBottomSheet}
              mode="contained"
              icon={({ size, color }) => (
                <Wallet size={18} color={color} style={tw`mr-1`} />
              )}
            >
              Proceed to Payment
            </Button>
          </View>
        </SafeAreaView>
      </SafeAreaView>

      {/* Modals */}
      <BottomSheetModal
        ref={bottomSheet}
        title="Confirm Airtime Purchase"
        details={transactionDetails}
        buttonLabel="Make Payment"
        onConfirm={handleMakePayment}
        onDismiss={closeBottomSheet}
        snapPoints={["60%", "60%"]}
        disabled={!walletValidation.canPay}
      />

      <ContactPickerModal
        index={1}
        isVisible={isContactModalVisible}
        onClose={handleCloseContactModal}
        onSelectContact={handleSelectContact}
      />
      
      <TransactionErrorSheet />
    </KeyboardAvoidingView>
  );
}
