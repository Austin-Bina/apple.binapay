import Banner from "@components/ui/banner";
import MaskedInput from "@components/ui/form/mask-input";
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
import { resetNavigationToDashboard } from "@utils/navigation";
import { AxiosError } from "axios";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Keyboard, View } from "react-native";
import { formatWithMask } from "react-native-mask-input";
import { Button, Text } from "react-native-paper";
import Toast from "react-native-root-toast";
import { vs } from "react-native-size-matters";
import { z } from "zod";

type Props = KYCStackScreenProps<typeof SCREENS.NIN_VERIFICATION>;

const schema = z.object({
  nin: z
    .string()
    .transform((val) => val.replace(/\D/g, ""))
    .refine((val) => `${val}`.length === 11, {
      message: "NIN must be exactly 11 digits",
    }),
});

type FormValues = z.infer<typeof schema>;
export default function NinVerificationScreen(props: Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);

  const bottomSheet = useRef<BottomSheetModalMethods>(null);
  const { customers } = useTypedSelector(selectSystemSettings);
  const dispatch = useTypedDispatch();
  const user = useTypedSelector(selectUser);
  const { control, handleSubmit, setError, watch, trigger } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nin: "",
    },
    mode: "onChange",
  });

  const values = watch();

  const { masked } = formatWithMask({
    text: values.nin,
    mask: bvn_nin_mask,
  });

  const formattedRemainingAttempts = useMemo(() => {
    if (remainingAttempts === null) return null;
    if (typeof remainingAttempts === "undefined") return Math.max(0, customers.nin_verification_limit - 0);
    if (typeof remainingAttempts === "number") return Math.max(0, customers.nin_verification_limit - remainingAttempts);
    else return 0;
  }, [remainingAttempts]);

  useEffect(() => {
    if (!user?.id) return;
    setRemainingAttempts(user.verification_attempts);
  }, [user?.id]);

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

  const onSubmit = handleSubmit(async function (form) {
    try {
      setIsProcessing(true);

      const response = await API.post(route("kyc.verifyNin"), form);
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
      }

      showToast({ message: "We had trouble verifying your NIN. Please try again.", position: Toast.positions.TOP });
    } finally {
      setIsProcessing(false);
      closeBottomSheet();
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View>
          <View style={tw`mb-4`}>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>NIN Verification</Text>
            <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mt-2`}>
              Verify your NIN for added security and increased transaction limits.
            </Text>
          </View>

          <Controller
            control={control}
            name="nin"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <MaskedInput
                label="National Identity Number"
                placeholder="Enter your NIN"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                mask={bvn_nin_mask}
              />
            )}
          />

          <View style={tw`my-4`}>
            <Banner content="Verifying NIN numbers costs a small fee. We will offset the cost of the verification process. Please kindly review your NIN to ensure it is correct. You are only allowed a limited number of free attempts, after which you will be required to pay for the cost of verifying." />
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
          onPress={openBottomSheet}
          mode="contained">
          Start Verification
        </Button>
      </ScrollableView>
      <BottomSheetModal
        ref={bottomSheet}
        initialSnapPoints={[vs(250), vs(250)]}
        onDismiss={closeBottomSheet}
        children={
          <View style={tw`p-4`}>
            <Text variant="titleLarge" style={tw`font-bold text-gray-800 mb-2 text-center`}>
              Please Review
            </Text>
            <View>
              <Text variant="bodyLarge" style={tw`text-center text-gray-500`}>
                Your NIN
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
