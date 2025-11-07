import { VerifiedBadge } from "@components/icons/svg";
import Banner from "@components/ui/banner";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import MaskedInput from "@components/ui/form/mask-input";
import CustomTextInput from "@components/ui/form/TextInput";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { bvn_nin_mask } from "@constants/app";
import { SCREENS } from "@constants/screens";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import tw from "@lib/tailwind";
import { KYCStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { selectSystemSettings } from "@store/selectors/settings";
import { authSliceActions } from "@store/slice/auth";
import { settingsSliceActions } from "@store/slice/settings";
import { formatToNaira } from "@utils/money";
import { resetNavigationToDashboard } from "@utils/navigation";
import { AxiosError } from "axios";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { formatWithMask } from "react-native-mask-input";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import Toast from "react-native-root-toast";
import { vs } from "react-native-size-matters";
import { z } from "zod";

type Props = KYCStackScreenProps<typeof SCREENS.BVN_VERIFICATION>;

const schema = z.object({
  bvn: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => `${val}`.length === 11, {
      message: "BVN number must be exactly 11 digits",
    }),
  account_number: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => `${val}`.length === 10, {
      message: "Account number must be exactly 10 digits",
    }),
  bank_code: z.string().length(3, "Please select bank"),
});

type FormValues = z.infer<typeof schema>;

type Bank = {
  name: string;
  code: string;
};

export default function BVNVerificationScreen(props: Props) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);

  const dispatch = useTypedDispatch();
  const user = useTypedSelector(selectUser);
  const { customers } = useTypedSelector(selectSystemSettings);
  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const { control, handleSubmit, setError, watch, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bvn: "",
      account_number: "",
      bank_code: "",
    },
  });

  const values = watch();

  const { masked } = formatWithMask({
    text: values.bvn,
    mask: bvn_nin_mask,
  });

  const formattedRemainingAttempts = useMemo(() => {
    if (remainingAttempts === null) return null;
    if (typeof remainingAttempts === "undefined") return Math.max(0, customers.bvn_verification_limit - 0);
    if (typeof remainingAttempts === "number") return Math.max(0, customers.bvn_verification_limit - remainingAttempts);
    else return 0;
  }, [remainingAttempts]);

  const filteredBanks = useMemo(
    () =>
      banks
        .filter((b) => !!b.code)
        .map((bank) => ({
          label: bank.name,
          id: bank.code,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [banks],
  );

  useEffect(() => {
    if (!user?.id) return;
    setRemainingAttempts(user.verification_attempts);
  }, [user?.id]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const response = await API.get(route("bank.list"));
        const { banks } = response.data;
        setBanks(banks);
      } catch (error) {
        console.error(error);
      } finally {
        setIsProcessing(false);
      }
    };

    fetchBanks();
  }, []);

  const openBottomSheet = useCallback(async () => {
    const valid = await trigger();

    if (valid) {
      Keyboard.dismiss();
      setTimeout(() => {
        bottomSheet.current?.present();
      }, 100);
    }
  }, []);

  const closeBottomSheet = () => {
    bottomSheet.current?.dismiss();
  };

  const validateBank = useCallback(async () => {
    const { bank_code, account_number } = values;
    const data = {
      bank_code,
      account_number,
    };

    trigger(["bank_code", "account_number"]).then(async (allGood) => {
      if (allGood) {
        try {
          setIsProcessing(true);
          setShowProgress(true);
          setHasError(false);
          setResolvedAccountName("");

          const response = await API.post(route("bank.resolveAccount"), data);
          const { is_valid, account_name } = response.data;

          if (is_valid) {
            return setResolvedAccountName(account_name);
          } else {
            setError("account_number", { message: "Account name does not match with your Binapay account" });
          }
        } catch (error) {
          const axiosError = error as AxiosError<any>;
          const { response } = axiosError;

          if (response) {
            const { message } = response.data;
            setError("account_number", { message });
            return;
          }

          setHasError(true);
        } finally {
          setShowProgress(false);
          setIsProcessing(false);
        }
      }
    });
  }, [values]);

  const onSubmit = handleSubmit(async function (form) {
    if (!resolvedAccountName) return;

    try {
      setIsProcessing(true);

      const response = await API.post(route("kyc.verifyBvn"), form);
      const { accounts } = response.data;

      dispatch(authSliceActions.updateUser({ accounts }));

      resetNavigationToDashboard();
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors, error_code = null } = response.data;

        if (message && typeof message === "string") {
          showToast({ message, position: Toast.positions.TOP });
        }

        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }

          return;
        }

        if (error_code === "client_insufficient_funds") {
          return dispatch(
            settingsSliceActions.setApplicationError({
              code: "client_insufficient_funds",
              context: message,
            }),
          );
        }

        setHasError(true);
      }
    } finally {
      setIsProcessing(false);
      closeBottomSheet();
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View style={tw`mb-10`}>
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>BVN and Account Name Validation</Text>
            <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mt-2`}>
              Verify your BVN for added security and increased transaction limits.
            </Text>
          </View>

          {hasError && <Banner content="We had trouble verifying your account name. Please try again." />}

          <Controller
            control={control}
            name="bvn"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <MaskedInput
                label="Bank verification number"
                placeholder="Enter your BVN"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                mask={bvn_nin_mask}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          <View>
            <Controller
              control={control}
              name="account_number"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomTextInput
                  label="Use any of your account number"
                  placeholder="Enter account number"
                  keyboardType="numeric"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                />
              )}
            />

            {showProgress && !resolvedAccountName && (
              <View style={tw`flex-row items-center gap-2 mb-1`}>
                <ActivityIndicator animating size="small" aria-label="Reading card number" />
                <Text variant="labelSmall" style={tw`text-xs text-gray-500`}>
                  Verifying account number
                </Text>
              </View>
            )}

            {resolvedAccountName && (
              <View style={tw`flex-row items-center gap-1.5 mb-1`}>
                <VerifiedBadge />
                <Text variant="titleSmall" style={tw`text-primary-600`}>
                  {resolvedAccountName}
                </Text>
              </View>
            )}
          </View>

          <DropdownMenuField
            label="Select any of your bank"
            placeholder="select your bank"
            name="bank_code"
            control={control}
            data={filteredBanks}
          />
{/*}
          <View style={tw`my-4`}>
            <Banner
              content={
                <View style={tw`gap-2`}>
                  <Text style={tw`text-secondary-500 w-full`}>
                    Verifying NIN numbers costs {formatToNaira(customers.bvn_verification_charge)}. But we will offset the cost of the
                    verification process.
                  </Text>
                  <Text style={tw`text-secondary-500 w-full`}>
                    Please kindly review your NIN to ensure it is correct. You are only allowed a limited number of free
                    attempts, after which you will be required to pay for the cost of verifying.
                  </Text>
                </View>
              }
            />
          </View>

          {/* Display remaining attempts */}
          {formattedRemainingAttempts !== null && (
            <View style={tw`p-2 bg-gray-50`}>
              <Text style={tw`text-gray-600 text-lg mt-2 text-center`}>
                You have{" "}
                <Text variant="labelLarge" style={tw`text-yellow-500`}>
                  {formattedRemainingAttempts}
                </Text>{" "}
                free verification attempts remaining.
              </Text>
            </View>
          )}
        </View>

        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`p-2`}
          disabled={isProcessing}
          onPress={resolvedAccountName ? openBottomSheet : validateBank}
          mode="contained">
          {resolvedAccountName ? "Complete Verification" : "Verify Name"}
        </Button>
      </ScrollableView>
      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={[vs(280), vs(280)]}
        onDismiss={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text variant="titleLarge" style={tw`font-bold text-gray-800 mb-2 text-center`}>
              Please Review
            </Text>
            <View>
              <Text variant="bodyLarge" style={tw`text-center text-gray-500`}>
                Your BVN
              </Text>
              <Text variant="headlineLarge" style={tw`text-center text-primary my-2`}>
                {masked}
              </Text>
            </View>
            <Button
              mode="contained"
              onPress={onSubmit}
              style={tw`w-full rounded-full mt-10`}
              contentStyle={tw`py-2`}
              disabled={isProcessing}
              labelStyle={tw`text-base`}>
              Yes, it's correct
            </Button>
          </View>
        }
      />
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
