import { TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import tw from "@lib/tailwind";
import { Button, Text } from "react-native-paper";
import { StackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import Screen from "@components/ui/shared/Screen";
import CustomTextInput from "@components/ui/form/TextInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { showToast } from "@helpers/toast";
import API from "@lib/api";
import { route as apiRoute } from "@helpers/route";
import { AxiosError } from "axios";
import { SCREENS } from "@constants/screens";
import { useTypedSelector } from "@store/common";
import { selectLoggedIn } from "@store/selectors/auth";

const schema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .trim()
    .transform((val) => val.toLowerCase()),
});

type FormValues = z.infer<typeof schema>;
type ForgetPasswordProps = StackScreenProps<typeof SCREENS.FORGOT_PASSWORD>;
export default function ForgetPassword({ navigation, route }: ForgetPasswordProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const isLoggedIn = useTypedSelector(selectLoggedIn);
  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: route.params.email,
    },
  });

  const onSubmit = handleSubmit(async function (values) {
    setIsProcessing(true);
    try {
      await API.post(apiRoute("auth.forgotPassword"), values);
      navigation.navigate(SCREENS.REQUEST_ONE_TIME_PASSWORD, { email: values.email });
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
      <View style={tw`flex flex-col px-4 pt-5 justify-between h-full`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Forgot Your Password?</Text>
          <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug mb-10`}>
            {!isLoggedIn
              ? "Enter your registered email address to receive a password reset link."
              : "You can reset your password here."}
          </Text>

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Email Address"
                placeholder="example@example.com"
                mode="outlined"
                onBlur={onBlur}
                disabled={isLoggedIn}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />
          {!isLoggedIn && (
            <View style={tw`flex flex-row items-center justify-center mb-5 gap-2 my-6 md:my-10`}>
              <Text style={tw`text-gray-700`}>Remember your login details?</Text>
              <TouchableOpacity
                onPress={() => {
                  navigation.navigate(SCREENS.AUTH, { screen: SCREENS.LOGIN });
                }}>
                <Text style={tw`text-primary`}>Log in here</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`p-2`}
          disabled={isProcessing}
          onPress={onSubmit}
          mode="contained">
          <Text style={tw`text-white text-center text-base font-bold`}>Continue</Text>
        </Button>
      </View>
      <PleaseWaitModal visible={isProcessing} />
    </Screen>
  );
}
