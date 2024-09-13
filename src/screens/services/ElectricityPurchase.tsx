import CustomTextInput from "@components/ui/form/TextInput";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { zodResolver } from "@hookform/resolvers/zod";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { Image } from "react-native-element-image";
import { ActivityIndicator, Button, Chip, Text } from "react-native-paper";
import { z } from "zod";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import NairaInput from "@components/ui/form/NairaInput";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import { serviceProvidersMap } from "@constants/providers";
import VerifiedBadge from "@assets/icons/verified-badge.svg";
import { METER_TYPE } from "@enum/providers";
import { formatToNaira } from "@utils/money";
import { useTypedSelector, useTypedDispatch } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import API from "@lib/api";
import { route } from "@helpers/route";
import { addPendingTransaction, setTransactionError } from "@store/slice/transactionSlice";
import { TransactionForm } from "@enum/transaction";
import TransactionErrorSheet from "@components/ui/modals/TransactionErrorSheet";
import { Colors } from "@constants/theme";
import { SelectCloseIcon, SelectOpenIcon } from "@components/icons/svg";
import { AxiosError } from "axios";
import { showToast } from "@helpers/toast";

type Props = ServicesStackScreenProps<"Electricity Bill">;

const MIN_PAYMENT_AMOUNT = 50;
const schema = z.object({
  provider: z.string(),
  meter_type: z.nativeEnum(METER_TYPE),
  meter_number: z.string().transform((val) => val.replace(/\D/g, "")),
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
  customer_name: z.string(),
  customer_address: z.string(),
  phone: z.string().min(11),
});

type FormValues = z.infer<typeof schema>;

const themeColors = {
  primary: Colors.primary.DEFAULT,
  selectedBg: "#DBEAFE",
  outline: Colors.primary[50],
  surface: "#ffffff",
  text: Colors.gray[700],
};

type MeterTypeChipProps = {
  isSelected: boolean;
  label: string;
  onPress: () => void;
  icon: React.ReactNode;
};

const MeterTypeChip: React.FC<MeterTypeChipProps> = ({ isSelected, label, onPress, icon }) => (
  <Chip
    avatar={icon}
    selected={isSelected}
    onPress={onPress}
    showSelectedOverlay={false}
    showSelectedCheck={false}
    mode="outlined"
    selectedColor={isSelected ? themeColors.primary : themeColors.text}
    theme={{
      roundness: 200,
      colors: {
        primary: themeColors.primary,
        surface: isSelected ? themeColors.selectedBg : themeColors.surface,
        outline: themeColors.outline,
      },
    }}>
    {label}
  </Chip>
);

export default function ElectricityPurchaseScreen({ navigation }: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [readyToPay, setReadyToPay] = useState(false);
  const [showProgress, setShowProgress] = useState(false);

  const user = useTypedSelector(selectUser);
  const dispatch = useTypedDispatch();
  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const controllerRef = useRef(new AbortController());

  const { control, watch, trigger, setValue, setError, clearErrors, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      provider: "aedc",
      meter_number: "",
      amount: "0",
      customer_address: "",
      customer_name: "",
      phone: user?.phone,
      meter_type: METER_TYPE.PREPAID,
    },
  });

  const values = watch();
  const isPrepaidType = values.meter_type === METER_TYPE.PREPAID;

  useEffect(() => {
    if (readyToPay && values.meter_number) {
      setReadyToPay(false);
      setValue("customer_name", "");
      setValue("customer_address", "");
    }
  }, [values.meter_number]);

  const validateMeter = useCallback(async () => {
    const { provider, meter_type, meter_number } = values;

    const data = {
      provider,
      meter_type,
      meter_number,
    };

    trigger(["provider", "meter_type", "meter_number"]).then(async (allGood) => {
      if (allGood) {
        try {
          setIsProcessing(true);
          setShowProgress(true);
          setReadyToPay(false);

          setValue("customer_name", "");
          setValue("customer_address", "");
          clearErrors(["meter_number"]);

          const response = await API.post(route("services.resolveMeter"), data, {
            signal: controllerRef.current.signal,
          });

          const { payload } = response.data;

          if (!payload || payload.invalid) {
            setError("meter_number", {
              message: "Could not verify the meter number",
            });
          } else {
            setValue("customer_name", payload.name);
            setValue("customer_address", payload.address);
            setReadyToPay(true);
          }
        } catch (error) {
          const axiosError = error as AxiosError<any>;
          const { response } = axiosError;

          if (response) {
            const { message, errors } = response.data;

            if (errors) {
              for (const [field, fieldErrors] of Object.entries(errors)) {
                if (Array.isArray(fieldErrors)) {
                  setError(field as keyof FormValues, {
                    message: fieldErrors.join(", "),
                  });
                }
              }

              return showToast({ message });
            }
          }

          dispatch(
            setTransactionError({
              code: "500",
              status: "error",
              title: "Something went wrong",
              description: "We had an error while trying to verify your meter number, please try again.",
            }),
          );
        } finally {
          setShowProgress(false);
          setIsProcessing(false);
        }
      }
    });
  }, [values]);

  const openBottomSheet = useCallback(async () => {
    if (!readyToPay) {
      return validateMeter();
    }
    const valid = await trigger();
    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => {
        bottomSheet.current?.present();
      }, 100);
    }
  }, [readyToPay, validateMeter]);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  const handleMakePayment = handleSubmit((values) => {
    const transaction = {
      id: TransactionForm.Electricity,
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
          data={Object.values(serviceProvidersMap.electricity).map((provider) => ({
            label: provider.label,
            id: provider.key,
            image: provider.logo,
          }))}
        />
        <View style={tw`flex flex-row items-center gap-3 py-1`}>
          <MeterTypeChip
            isSelected={isPrepaidType}
            label="Prepaid"
            onPress={() => setValue("meter_type", METER_TYPE.PREPAID)}
            icon={isPrepaidType ? <SelectOpenIcon /> : <SelectCloseIcon />}
          />

          <MeterTypeChip
            isSelected={!isPrepaidType}
            label="Postpaid"
            onPress={() => setValue("meter_type", METER_TYPE.POSTPAID)}
            icon={!isPrepaidType ? <SelectOpenIcon /> : <SelectCloseIcon />}
          />
        </View>
        <View>
          <Controller
            control={control}
            name="meter_number"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Meter Number"
                placeholder="Enter meter number"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />
          {showProgress && (
            <View style={tw`flex-row items-center gap-2`}>
              <ActivityIndicator animating size="small" aria-label="Reading meter number" />
              <Text variant="labelSmall" style={tw`text-xs text-gray-500`}>
                Verifying meter number
              </Text>
            </View>
          )}
          {values.customer_name && (
            <View style={tw`flex-row items-center gap-1.5`}>
              <VerifiedBadge />
              <Text variant="titleSmall" style={tw`text-primary-600`}>
                {values.customer_name}
              </Text>
            </View>
          )}
        </View>

        <View style={tw`mb-5`}>
          <NairaInput name="amount" control={control} />
          <Text style={tw`text-primary-900 text-sm mt-2.5`}>Wallet Balance: {formatToNaira(user?.wallet_balance)}</Text>
        </View>
      </ScrollableView>
      <View style={tw`px-4 pb-4 pt-1`}>
        <Button
          style={tw`w-full rounded-full`}
          contentStyle={tw`py-2`}
          labelStyle={tw`text-white text-center text-base font-bold`}
          disabled={isProcessing}
          onPress={openBottomSheet}
          mode="contained">
          {!readyToPay ? "Verify" : "Proceed"}
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
                  <Image width={30} source={require("@assets/images/services/aedc.png")} />
                  <Text style={tw`text-lg font-bold`}>Electricity</Text>
                </View>
              </View>
              <View style={tw`flex-row justify-between my-2`}>
                <Text variant="bodyLarge">Amount:</Text>
                <Text style={tw`text-lg font-bold`}>₦{values.amount}</Text>
              </View>
              <View style={tw`flex-row items-center justify-between my-2`}>
                <Text variant="bodyLarge">Customer Name:</Text>
                <Text style={tw`text-lg font-bold`}>{values.customer_name}</Text>
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
