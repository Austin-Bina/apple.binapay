import React, { useState, useEffect, useCallback } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/ui/shared/Screen";
import { RegistrationFormValues, useCompleteRegisterForm } from "@providers/complete-registration";
import { useFormContext } from "react-hook-form";
import OtpInput from "@components/ui/form/OtpInput";

type Props = RegistrationStackScreenProps<"Complete Registration">;

const maximumLength = 4;
const CreateTransactionPin: React.FC<Props> = () => {
  const [pinReady, setPinReady] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [firstPin, setFirstPin] = useState("");

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
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-5`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            {isConfirming ? "Confirm Your Transaction PIN" : "Set Your Transaction PIN"}
          </Text>
          <Text style={tw`w-full mb-10 text-gray-500 font-normal`}>
            {isConfirming
              ? "Please re-enter the 4-digit PIN to confirm it."
              : "Secure your transactions with a 4-digit PIN. Choose a PIN that is easy for you to remember but hard for others to guess."}
          </Text>
          <View style={tw`mb-10`}>
            <View style={tw`flex flex-row items-center justify-center`}>
              <OtpInput control={control} name="pin" maximumLength={maximumLength} />
            </View>
          </View>
        </View>
        <View style={tw`gap-4 mb-5`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            mode="contained"
            disabled={!pinReady}
            onPress={handleNext}>
            {isConfirming ? "Confirm PIN" : "Continue"}
          </Button>
        </View>
      </View>
    </Screen>
  );
};

export default CreateTransactionPin;
