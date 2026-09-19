import React, { useState, useEffect, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform } from "react-native";
import { RegistrationStackScreenProps } from "@navigators/types";
import { RegistrationFormValues, useCompleteRegisterForm } from "@providers/complete-registration";
import { useFormContext } from "react-hook-form";
import OtpInput from "@components/ui/form/OtpInput";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type Props = RegistrationStackScreenProps<"Complete Registration">;
const maximumLength = 4;

const CreateTransactionPin: React.FC<Props> = ({ navigation }) => {
  const [pinReady, setPinReady] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [firstPin, setFirstPin] = useState("");
  const insets = useSafeAreaInsets();

  const { dispatch } = useCompleteRegisterForm();
  const { control, watch, reset, trigger, setError, setValue } = useFormContext<RegistrationFormValues>();

  const { pin: currentPin, ...rest } = watch();

  useEffect(() => {
    setPinReady(currentPin.length === maximumLength);
  }, [currentPin]);

  const handleNext = useCallback(
    async function () {
      trigger("pin").then((allGood) => {
        if (allGood) {
          if (!isConfirming) {
            setFirstPin(currentPin);
            reset({ ...rest, pin: "" });
            setIsConfirming(true);
          } else {
            if (firstPin === currentPin) {
              setValue("pin_confirmation", currentPin);
              dispatch({ type: "updateScreenIndex", index: 2 });
            } else {
              setError("pin", { message: "PINs do not match" });
            }
          }
        }
      });
    },
    [dispatch, trigger, isConfirming, firstPin, currentPin, setError],
  );

  return (
    <View style={s.root}>
      <ScreenHeader
        title={isConfirming ? "Confirm Transaction PIN" : "Set Transaction PIN"}
        subtitle={isConfirming ? "Re-enter your 4-digit PIN to confirm" : "Secure your transactions with a PIN"}
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <View style={s.content}>
          <View style={s.infoCard}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color={BLUE} />
            <Text style={s.infoText}>
              {isConfirming
                ? "Please re-enter the 4-digit PIN to confirm it."
                : "Choose a 4-digit PIN that is easy for you to remember but hard for others to guess."}
            </Text>
          </View>

          <View style={s.otpWrap}>
            <OtpInput control={control} name="pin" maximumLength={maximumLength} />
          </View>
        </View>

        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <TouchableOpacity
            style={[s.continueBtn, !pinReady && s.disabledBtn]}
            disabled={!pinReady}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={s.continueBtnText}>
              {isConfirming ? "Confirm PIN" : "Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  content:         { flex: 1, padding: 16 },
  infoCard:        { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 12, marginBottom: 32 },
  infoText:        { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
  otpWrap:         { alignItems: "center", marginTop: 16 },
  footer:          { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  continueBtn:     { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  continueBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:     { opacity: 0.5 },
});

export default CreateTransactionPin;
