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
import { getNavigate, resetNavigationToDashboard } from "@utils/navigation";
import { AxiosError } from "axios";
import React, { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { View } from "react-native";
import { Button, Text } from "react-native-paper";
import { z } from "zod";

type Props = KYCStackScreenProps<typeof SCREENS.BVN_VERIFICATION>;

const schema = z.object({
  bvn: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => `${val}`.length === 11, {
      message: "Account number must be exactly 11 digits",
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

  const dispatch = useTypedDispatch();
  const isVerified = useTypedSelector(selectIsAccountVerified);

  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      bvn: "",
    },
  });

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

  const onSubmit = handleSubmit(async function (form) {
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
        const { message, errors } = response.data;

        if (message && typeof message === "string") {
          showToast({ message });
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

        setHasError(true);
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
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>BVN and Account Name Validation</Text>
            <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mt-2`}>
              Verify your BVN and account details to ensure they match your account. This helps prevent any
              discrepancies during transactions.
            </Text>
          </View>

          {hasError && <Banner message="We had trouble verifying your account name. Please try again." />}

          <Controller
            control={control}
            name="bvn"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Bank verification number"
                placeholder="Enter your BVN"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

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

        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`p-2`}
          disabled={isProcessing}
          onPress={onSubmit}
          mode="contained">
          <Text style={tw`text-white text-center text-base font-bold`}>Verify</Text>
        </Button>
      </ScrollableView>
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
