import { View, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Button, Text } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { Controller } from "react-hook-form";
import { useForm } from "react-hook-form";
import tw from "@lib/tailwind";
import CustomTextInput from "@components/ui/form/TextInput";
import ScrollableView from "@components/ui/shared/ScrollableView";
import Screen from "@components/ui/shared/Screen";
import { StackActions } from "@react-navigation/native";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { AxiosError } from "axios";
import { showToast } from "@helpers/toast";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import MaskedInput from "@components/ui/form/mask-input";
import { phone_mask } from "@constants/app";
import { zodPhoneValidation } from "@utils/phone";

const schema = z.object({
  name: z.string().min(3, "Name is too short").trim(),
  phone: zodPhoneValidation,
  email: z
    .string()
    .email("Please enter a valid project")
    .trim()
    .transform((val) => val.toLowerCase()),
  referral_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const RegisterScreen: React.FC<RegistrationStackScreenProps<"Start">> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);

  const { control, setError, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      referral_code: "",
    },
  });

  const onSubmit = handleSubmit(async function (data) {
    setIsLoading(true);
    try {
      await API.post(route("auth.register"), data);
      navigation.navigate("Verify Email", { email: data.email });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message, errors } = response.data;

        const hasAuthErrorMsg = message && typeof message === "string";

        if (hasAuthErrorMsg) {
          showToast({ message: message });
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

      showToast({ message: "We could not reach our servers, please try this again." });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`px-4 pt-5 justify-between`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Get Started with BinaPay</Text>
          <Text style={tw`w-full mb-[30px] text-zinc-500 text-lg font-normal leading-snug`}>
            Join our community! Let's get you started with a few quick steps.
          </Text>
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Full name"
                placeholder="John Doe"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Email Address"
                placeholder="example@example.com"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <MaskedInput
                label="Phone Number"
                placeholder="080 000 000 0000"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                mask={phone_mask}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
              />
            )}
          />

          <View style={tw`mt-2`}>
            <Controller
              control={control}
              name="referral_code"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomTextInput
                  label="Referral Code (Optional, if applicable)"
                  placeholder="X5ATNH24-WOODR"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                />
              )}
            />
          </View>

          <View style={tw`flex flex-row items-center justify-center mt-6 mb-8 gap-2`}>
            <Text style={tw`text-gray-800 text-sm`}>Already a BinaPay User?</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.dispatch(StackActions.push("Auth", { screen: "Login" }));
              }}>
              <Text style={tw`text-primary text-sm`}>Login here</Text>
            </TouchableOpacity>
          </View>
          <View>
            <Text style={tw`text-xs text-center`}>
              By registering, you accept BinaPay's <Text style={tw`text-primary-400`}>Terms & Conditions</Text> and
              <Text style={tw`text-primary-400`}> Privacy Policy</Text>. Your data will be securely encrypted.
            </Text>
          </View>
        </View>
        <View style={tw`pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-[94px]`}
            contentStyle={tw`py-2`}
            mode="contained"
            disabled={isLoading}
            onPress={onSubmit}>
            Continue
          </Button>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isLoading} />
    </Screen>
  );
};

export default RegisterScreen;
