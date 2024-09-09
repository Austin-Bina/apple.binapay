import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import { Colors } from "@constants/theme";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import PleaseWaitModal from "@components/ui/modals/PleaseWaitModal";
import { AxiosError } from "axios";

type Props = RegistrationStackScreenProps<"Verify Email">;

const maximumLength = 6;
const RESEND_TIMEOUT = 30;
const schema = z.object({
  code: z
    .string()
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

const VerifyEmail: React.FC<Props> = (props) => {
  const params = props.route.params;

  const [pinReady, setPinReady] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [resendAvailable, setResendAvailable] = useState(false);

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
      setFetching(true);

      const res = await API.post(route("auth.verifyEmail"), {
        code: values.code,
        email: params.email,
      });

      const result = res.data;
      showToast({ message: result.message });

      props.navigation.navigate("Complete Registration", { email: params.email });
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

        setError("code", { message });
      }
    } finally {
      setFetching(false);
    }
  });

  const handleResendOTP = async () => {
    try {
      setFetching(true);
      await API.post(route("auth.resendEmailOtp"), { email: params.email });
      showToast({ message: "OTP resent to your email." });
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
      setFetching(false);
    }
  };

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-10`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Verify Your Email Address</Text>
          <Text style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}>
            A verification code has been sent to your email. Please enter it below to verify your email address.
          </Text>
          <View style={tw`mb-10`}>
            <View style={tw`flex flex-row items-center justify-center`}>
              <OtpInput control={control} name="code" maximumLength={maximumLength} />
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
            disabled={!pinReady || fetching}
            onPress={onSubmit}>
            Continue
          </Button>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2 w-full`}
            mode="outlined"
            textColor={Colors.gray[500]}
            disabled={!resendAvailable}
            onPress={handleResendOTP}>
            Resend OTP
          </Button>
        </View>
      </View>
      <PleaseWaitModal visible={fetching} />
    </Screen>
  );
};

export default VerifyEmail;
