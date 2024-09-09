import { View } from "react-native";
import React, { useCallback, useState } from "react";
import CustomTextInput from "@components/ui/form/TextInput";
import { Button, Text, TextInput } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { Controller, useFormContext } from "react-hook-form";
import Screen from "@components/ui/shared/Screen";
import { passwordFields, RegistrationFormValues, useCompleteRegisterForm } from "@contexts/complete-registration";
import tw from "@lib/tailwind";

type ResetPasswordProps = RegistrationStackScreenProps<"Complete Registration">;

const CreatePassword: React.FC<ResetPasswordProps> = () => {
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(true);

  const { dispatch } = useCompleteRegisterForm();
  const { control, trigger } = useFormContext<RegistrationFormValues>();

  const handleNext = useCallback(
    async function () {
      trigger(passwordFields).then((allGood) => {
        if (allGood) {
          dispatch({ type: "updateScreenIndex", index: 1 });
        }
      });
    },
    [dispatch, trigger],
  );

  return (
    <Screen>
      <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Create Password</Text>
          <Text style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}>
            Create password to secure your account.
          </Text>

          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Password"
                secureTextEntry={passwordVisible}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                mode="outlined"
                left={<TextInput.Icon icon="lock-outline" color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordVisible((prev) => !prev)}
                    icon={passwordVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
            name="password"
          />
          <Controller
            control={control}
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Confirm Password"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                secureTextEntry={passwordConfirmationVisible}
                mode="outlined"
                left={<TextInput.Icon icon="lock-outline" color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordConfirmationVisible((prev) => !prev)}
                    icon={passwordConfirmationVisible ? "eye-off-outline" : "eye-outline"}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
            name="password_confirmation"
          />
        </View>
        <View style={tw`px-4 pb-4 pt-1`}>
          <Button style={tw`w-full rounded-full`} contentStyle={tw`py-2`} onPress={handleNext} mode="contained">
            Continue
          </Button>
        </View>
      </View>
    </Screen>
  );
};

export default CreatePassword;
