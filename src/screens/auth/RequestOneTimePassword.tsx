import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Button, HelperText } from "react-native-paper";
import { StackScreenProps } from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import { Colors } from "@constants/theme/colors";
import { SCREENS } from "@constants/screens";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { showToast } from "@helpers/toast";
import { AxiosError } from "axios";
import API from "@lib/api";
import { route } from "@helpers/route";
import Toast from "react-native-root-toast";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import ScrollableView from "@components/ui/shared/ScrollableView";

const maximumLength = 6;
const RESEND_TIMEOUT = 30;
const schema = z.object({
  code: z
    .string()
    .trim()
    .transform((val) => {
      const numericValue = val.slice(0, maximumLength);
      return numericValue;
    })
    .refine((val) => /^[0-9]+$/.test(val), {
      message: "Code must only contain numbers",
    }),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof schema>;
type Props = StackScreenProps<typeof SCREENS.REQUEST_ONE_TIME_PASSWORD>;

export default function RequestOneTimePasswordScreen(props: Props) {
  const params = props.route.params;

  const [pinReady, setPinReady] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [resendAvailable, setResendAvailable] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { control, watch, setError, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      code: "",
      email: params.email,
    },
  });

  const { code } = watch();

  useEffect(() => {
    setPinReady(code.length === maximumLength);
  }, [code]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else {
      setResendAvailable(true);
    }

    return () => clearTimeout(timer);
  }, [countdown]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      setIsProcessing(true);

      await API.post(route("auth.verifyOtp"), {
        code: values.code,
        email: params.email,
      });

      props.navigation.navigate(SCREENS.RESET_PASSWORD, values);
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { errors } = response.data;

        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }
        }
        return;
      }

      showToast({ message: "Something went wrong. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  });

  const handleResendOTP = async () => {
    try {
      setIsProcessing(true);

      await API.post(route("auth.forgotPassword"), { email: params.email });
      showToast({ message: "OTP resent to your email.", position: Toast.positions.TOP });
      setCountdown(RESEND_TIMEOUT);
      setResendAvailable(false);
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message } = response.data;

        const hasAuthErrorMsg = message && typeof message === "string";

        if (hasAuthErrorMsg) {
          showToast({ message: message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View>
          <View>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>OTP Verification</Text>
            <Text style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}>
              We've sent a 6 digit code to your mail, enter the code to reset your password.
            </Text>
            <View style={tw`mb-10`}>
              <View style={tw`flex flex-row items-center justify-center`}>
                <OtpInput control={control} name="code" maximumLength={maximumLength} />
              </View>
            </View>
          </View>
          <Text style={tw`text-sm text-center`}>
            Resend the OTP in <Text style={tw`text-primary`}>{resendAvailable ? "now" : `${countdown} sec`}</Text>
          </Text>
        </View>
        <View style={tw`gap-4 mb-5`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            mode="contained"
            disabled={!pinReady || isProcessing}
            onPress={onSubmit}>
            Continue
          </Button>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2 w-full`}
            mode="outlined"
            disabled={!resendAvailable}
            textColor={Colors.gray[500]}
            onPress={handleResendOTP}>
            Resend OTP
          </Button>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
