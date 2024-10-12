import { View } from "react-native";
import React, { useState } from "react";
import CustomTextInput from "@components/ui/form/TextInput";
import { Button, Text, TextInput } from "react-native-paper";
import { StackScreenProps } from "@navigators/types";
import * as Yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Screen from "@components/ui/shared/Screen";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import tw from "@lib/tailwind";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { EyeOpen, PasswordLock } from "@components/icons/svg";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { AxiosError } from "axios";
import { showToast } from "@helpers/toast";
import { SCREENS } from "@constants/screens";

const schema = z
  .object({
    password: z.string().trim().min(8, "Password length must be at least 8 characters"),
    password_confirmation: z.string().trim().min(8, "Password length must be at least 8 characters"),
    token: z.string().trim().min(6, "Token length must be at least 6 characters"),
    email: z.string().email("Please enter a valid email"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type FormValues = z.infer<typeof schema>;
type ResetPasswordProps = StackScreenProps<"Reset Password">;

export default function ResetPasswordScreen(props: ResetPasswordProps) {
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const params = props.route.params;

  const { control, handleSubmit, setError } = useForm<FormValues>({
    defaultValues: {
      password: "",
      password_confirmation: "",
      email: params.email,
      token: params.code,
    },
    resolver: zodResolver(schema),
  });

  const togglePasswordVisibility = () => setPasswordVisible(!passwordVisible);
  const togglePasswordConfirmVisibility = () => setPasswordConfirmationVisible(!passwordConfirmationVisible);

  const onSubmit = handleSubmit(async (data) => {
    try {
      setIsProcessing(true);
      await API.post(route("auth.resetPassword"), data);
      props.navigation.navigate(SCREENS.RESET_PASSWORD_SUCCESS);
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
          <View>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Reset Password</Text>
            <Text style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}>
              Create a new password for your BinaPay account.
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
                  left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                  right={
                    <TextInput.Icon
                      onPress={togglePasswordVisibility}
                      icon={passwordVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
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
                  left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                  right={
                    <TextInput.Icon
                      onPress={togglePasswordConfirmVisibility}
                      icon={passwordConfirmationVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                      color="#71717A"
                      forceTextInputFocus={false}
                    />
                  }
                />
              )}
              name="password_confirmation"
            />
          </View>
        </View>
        <View style={tw`pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            disabled={isProcessing}
            onPress={onSubmit}
            mode="contained">
            Reset Password
          </Button>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
