import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { RegistrationStackScreenProps } from "@navigators/types";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { AxiosError } from "axios";
import { SCREENS } from "@constants/screens";
import Toast from "react-native-root-toast";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

const maximumLength = 6;
const RESEND_TIMEOUT = 30;

const schema = z.object({
  code: z
    .string()
    .trim()
    .transform((val) => val.slice(0, maximumLength))
    .refine((val) => /^[0-9]+$/.test(val), {
      message: "Code must only contain numbers",
    }),
  email: z.string().email("Invalid email"),
});

type FormValues = z.infer<typeof schema>;
type Props = RegistrationStackScreenProps<typeof SCREENS.VERIFY_EMAIL>;

const VerifyEmail: React.FC<Props> = (props) => {
  const params = props.route.params;
  const insets = useSafeAreaInsets();

  const [pinReady, setPinReady] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMEOUT);
  const [resendAvailable, setResendAvailable] = useState(false);

  const { control, watch, setError, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: { code: "", email: params.email },
  });

  const { code } = watch();

  useEffect(() => {
    setPinReady(code.length === maximumLength);
  }, [code]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
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
      await API.post(route("auth.verifyEmail"), {
        code: values.code,
        email: params.email,
      });
      props.navigation.navigate("Complete Registration", { email: params.email });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response) {
        const { message } = response.data;
        const hasAuthErrorMsg = message && typeof message === "string";
        if (hasAuthErrorMsg) {
          showToast({ message, position: Toast.positions.TOP });
        } else {
          showToast({ message: "Something went wrong. Please try again.", position: Toast.positions.TOP });
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
          showToast({ message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }
      }
    } finally {
      setFetching(false);
    }
  };

  return (
    <View style={[s.root]}>
      <ScreenHeader
        title="Verify Email Address"
        subtitle="Enter the code sent to your email"
        onBack={() => props.navigation.goBack()}
      />

      <View style={s.content}>

        {/* Info card */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="email-outline" size={18} color={BLUE} />
          <Text style={s.infoText}>
            A 6-digit verification code has been sent to{" "}
            <Text style={s.infoEmail}>{params.email}</Text>
          </Text>
        </View>

        {/* OTP input */}
        <View style={s.otpWrap}>
          <OtpInput control={control} name="code" maximumLength={maximumLength} />
        </View>

        {/* Countdown */}
        <Text style={s.countdown}>
          Resend the OTP in{" "}
          <Text style={s.countdownValue}>
            {resendAvailable ? "now" : `${countdown} sec`}
          </Text>
        </Text>
      </View>

      {/* Footer buttons */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.continueBtn, (!pinReady || fetching) && s.disabledBtn]}
          disabled={!pinReady || fetching}
          onPress={onSubmit}
          activeOpacity={0.85}
        >
          <Text style={s.continueBtnText}>Continue</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.resendBtn, !resendAvailable && s.disabledBtn]}
          disabled={!resendAvailable}
          onPress={handleResendOTP}
          activeOpacity={0.85}
        >
          <Text style={[s.resendBtnText, !resendAvailable && { color: "#9ca3af" }]}>
            Resend OTP
          </Text>
        </TouchableOpacity>
      </View>

      <PleaseWaitModal visible={fetching} />
    </View>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  content:         { flex: 1, padding: 16 },
  infoCard:        { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 12, marginBottom: 32 },
  infoText:        { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
  infoEmail:       { fontWeight: "700", color: BRAND },
  otpWrap:         { alignItems: "center", marginBottom: 24 },
  countdown:       { fontSize: 13, textAlign: "center", color: "#6b7280" },
  countdownValue:  { color: BLUE, fontWeight: "600" },
  footer:          { paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0", gap: 10 },
  continueBtn:     { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  continueBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  resendBtn:       { borderWidth: 1.5, borderColor: "#e5e7eb", paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  resendBtnText:   { fontSize: 15, fontWeight: "600", color: BRAND },
  disabledBtn:     { opacity: 0.5 },
});

export default VerifyEmail;
