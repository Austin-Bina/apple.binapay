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

type ResetPasswordProps = AccountStackScreenProps<"Change Password">;

const schema = z
  .object({
    current_password: z.string().min(8, "Too short!").trim(),
    password: z.string().min(8, "Too short!").trim(),
    password_confirmation: z.string().trim(),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
type FormValues = z.infer<typeof schema>;

const ChangePassword: React.FC<ResetPasswordProps> = (props) => {
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

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
        const { message, errors } = response.data;

        if (message && typeof message === "string") {
          showToast({ message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }

        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }
        }
      }
    } finally {
      setIsProcessing(false);
    }
  });

  return (
    <Screen>
      <ScrollableView>
        <View style={tw`flex flex-col px-4 pt-5 justify-between h-full`}>
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
                  left={<TextInput.Icon icon="lock-outline" color="#71717A" />}
                  right={
                    <TextInput.Icon
                      onPress={() => setCurrentPasswordVisible((prev) => !prev)}
                      icon={currentPasswordVisible ? "eye-off-outline" : "eye-outline"}
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

          <View style={tw`items-center my-10`}>
            <TouchableOpacity onPress={() => {}}>
              <Text variant="bodySmall" style={tw`text-primary font-bold text-center`}>
                Forgot Current Password?
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            style={tw`mt-auto mb-[30px] w-full rounded-full`}
            contentStyle={tw`p-2`}
            disabled={isProcessing}
            onPress={onSubmit}
            mode="contained">
            <Text style={tw`text-white text-center text-base font-bold`}>Reset Password</Text>
          </Button>
        </View>
        <PleaseWaitModal visible={isProcessing} />
      </ScrollableView>
    </Screen>
  );
};

export default ChangePassword;
