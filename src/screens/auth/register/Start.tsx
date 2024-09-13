import { View, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Button, Text } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { Controller } from "react-hook-form";
import { useForm } from "react-hook-form";
import { formatPhone, phoneValidation } from "@utils/phone";
import tw from "@lib/tailwind";
import { Country, CountryCode } from "react-native-country-picker-modal";
import CustomTextInput from "@components/ui/form/TextInput";
import { PhoneInput } from "@components/ui/form/PhoneInput";
import ScrollableView from "@components/ui/shared/ScrollableView";
import Screen from "@components/ui/shared/Screen";
import { StackActions } from "@react-navigation/native";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { AxiosError } from "axios";
import { showToast } from "@helpers/toast";

const schema = z.object({
  name: z.string().min(3, "Too Short").trim(),
  phone: phoneValidation,
  email: z.string().email("Invalid email").trim(),
  referral_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const RegisterScreen: React.FC<RegistrationStackScreenProps<"Start">> = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState<CountryCode>("NG");
  const [isLoading, setIsLoading] = useState(false);

  const { control, clearErrors, setError, setValue, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      phone: ["", "NG"],
      email: "",
      referral_code: "",
    },
  });

  const handleChangeCountry = (country: Country) => {
    setCountryCode(country.cca2);
  };

  const onSubmit = handleSubmit(async function (data) {
    setIsLoading(true);
    try {
      const form = {
        ...data,
        phone: formatPhone(data.phone[0], data.phone[1] as any),
      };
      await API.post(route("auth.register"), form);
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
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
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
          render={({ field: { value }, fieldState: { error } }) => (
            <PhoneInput
              identifier="phone"
              label="Phone"
              phone={value?.[0] || ""}
              onChangePhone={(phone) => {
                setValue("phone", [phone, countryCode]);
              }}
              countryCode={countryCode}
              onChangeCountry={handleChangeCountry}
              error={!!error}
              errorMessage={error?.message}
              preferredCountries={["NG"]}
              clearErrorMessage={() => clearErrors("phone")}
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
      </ScrollableView>
      <View style={tw`px-4 pb-4 pt-1`}>
        <Button
          style={tw`w-full rounded-[94px]`}
          contentStyle={tw`py-2`}
          mode="contained"
          loading={isLoading}
          disabled={isLoading}
          onPress={onSubmit}>
          Continue
        </Button>
      </View>
    </Screen>
  );
};

export default RegisterScreen;
