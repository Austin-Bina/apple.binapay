import { View } from "react-native";
import React, { useState } from "react";
import CustomTextInput from "@components/ui/form/TextInput";
import { Button, Text, TextInput } from "react-native-paper";
import { AccountStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import Screen from "@components/ui/shared/Screen";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { TouchableOpacity } from "react-native-gesture-handler";
import tw from "@lib/tailwind";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { AxiosError } from "axios";
import { getNavigate } from "@utils/navigation";
import { EyeOpen, PasswordLock } from "@components/icons/svg";
import { SCREENS } from "@constants/screens";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";

type ResetPasswordProps = AccountStackScreenProps<"Change Password">;

const schema = z
  .object({
    current_password: z.string().trim().min(8, "Password too weak"),
    password: z.string().trim().min(8, "Password too weak"),
    password_confirmation: z.string().trim().min(8, "Password too weak"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
type FormValues = z.infer<typeof schema>;

export default function ChangePassword(props: ResetPasswordProps) {
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = useTypedSelector(selectUser);
  const { control, handleSubmit, setError } = useForm<FormValues>({
    defaultValues: {
      current_password: "",
      password: "",
      password_confirmation: "",
    },
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsProcessing(true);
    try {
      await API.post(route("auth.changePassword"), data);
      const { reset } = await getNavigate();
      reset({
        routes: [{ name: "Reset Password Successful" }],
      });
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

  const handlePasswordResetNavigation = async () => {
    const { navigate } = await getNavigate();

    navigate(SCREENS.FORGOT_PASSWORD, {
      email: user?.email || "",
    });
  };

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View>
          <View>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Change Password</Text>
            <Text style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}>
              Complete the fields below to change your password.
            </Text>

            <Controller
              control={control}
              name="current_password"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomTextInput
                  label="Current Password"
                  secureTextEntry={currentPasswordVisible}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                  mode="outlined"
                  left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                  right={
                    <TextInput.Icon
                      onPress={() => setCurrentPasswordVisible((prev) => !prev)}
                      icon={currentPasswordVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                      color="#71717A"
                      forceTextInputFocus={false}
                    />
                  }
                />
              )}
            />

            <Controller
              control={control}
              name="password"
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
                      onPress={() => setPasswordVisible((prev) => !prev)}
                      icon={passwordVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                      color="#71717A"
                      forceTextInputFocus={false}
                    />
                  }
                />
              )}
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
                      onPress={() => setPasswordConfirmationVisible((prev) => !prev)}
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

          <View style={tw`items-center my-10`}>
            <TouchableOpacity onPress={handlePasswordResetNavigation}>
              <Text variant="bodySmall" style={tw`text-primary font-bold text-center`}>
                Forgot Current Password?
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={tw`px-4 pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            disabled={isProcessing}
            onPress={onSubmit}
            mode="contained">
            <Text style={tw`text-white text-center text-base font-bold`}>Reset Password</Text>
          </Button>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
