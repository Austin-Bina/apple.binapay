import { VerifiedBadge } from "@components/icons/svg";
import Banner from "@components/ui/banner";
import DropdownMenuField from "@components/ui/form/DropdownMenu";
import CustomTextInput from "@components/ui/form/TextInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import tw from "@lib/tailwind";
import { KYCStackScreenProps } from "@navigators/types";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectIsAccountVerified } from "@store/selectors/auth";
import { authSliceActions } from "@store/slice/auth";
import { resetNavigationToDashboard } from "@utils/navigation";
import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { z } from "zod";

type Props = KYCStackScreenProps<typeof SCREENS.NAME_CHECK_VERIFICATION>;

const schema = z.object({
  account_number: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => `${val}`.length === 10, {
      message: "Account number must be exactly 10 digits",
    }),
  bank_code: z.string().length(3, "Please select bank"),
});

type Bank = {
  name: string;
  code: string;
};

type FormValues = z.infer<typeof schema>;

export default function NameVerificationScreen(props: Props) {
  const [banks, setBanks] = useState<Bank[]>([]);
  const [resolvedAccountName, setResolvedAccountName] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isNameMatched, setIsNameMatched] = useState(false);
  const [hasError, setHasError] = useState(false);

  const dispatch = useTypedDispatch();
  const isVerified = useTypedSelector(selectIsAccountVerified);
  const { control, handleSubmit, setError, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      account_number: "",
      bank_code: "",
    },
  });

  useEffect(() => {
    if (isVerified) return;

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

  const onSubmit = handleSubmit(async (form) => {
    try {
      setIsProcessing(true);

      // Reset everything
      setHasError(false);
      setIsNameMatched(false);
      setResolvedAccountName("");

      const response = await API.post(route("bank.resolveAccount"), form);
      const { is_valid, account_name } = response.data;
      if (is_valid) {
        setResolvedAccountName(account_name);
        setIsNameMatched(true);
        return;
      } else {
        setError("account_number", { message: "Account name does not match" });
      }
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message } = response.data;
        setError("account_number", { message });
        return;
      }

      reset();
      setHasError(true);
    } finally {
      setIsProcessing(false);
    }
  });

  const completeVerification = handleSubmit(async (form) => {
    if (!isNameMatched) return;

    try {
      setIsProcessing(true);

      const response = await API.post(route("bank.reserveAccount"), form);
      const { accounts } = response.data;

      dispatch(authSliceActions.updateUser({ accounts }));

      resetNavigationToDashboard();
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors } = response.data;
        if (message && typeof message === "string") {
          showToast({ message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }
      } else {
        showToast({ message: "Something went wrong. Please try again." });
      }
    } finally {
      setIsProcessing(false);
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View>
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Account Name Verification</Text>
            <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mt-2`}>
              Verify your account details by confirming your bank account name matches what you've provided.
            </Text>
          </View>

          {hasError && <Banner message="We had trouble verifying your account name. Please try again." />}

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

          {isProcessing && !isNameMatched && (
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

          <DropdownMenuField
            label="Select any of your bank"
            placeholder="select your bank"
            name="bank_code"
            control={control}
            data={banks
              .filter((b) => !!b.code)
              .map((bank) => ({
                label: bank.name,
                id: bank.code,
              }))}
          />
          
        </View>
        <View style={tw`px-4 pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            labelStyle={tw`text-white text-center text-base font-bold`}
            disabled={isProcessing}
            onPress={isNameMatched ? completeVerification : onSubmit}
            mode="contained">
            {isNameMatched ? "Complete" : "Verify Name"}
          </Button>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
