import { View, TouchableOpacity } from "react-native";
import React, { useState } from "react";
import { Button, Text } from "react-native-paper";
import {
  AuthStackScreenProps,
  RegistrationStackScreenProps,
} from "@navigators/types";
import { Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";
import { useForm } from "react-hook-form";
import { phoneValidation } from "@utils/phone";
import tw from "@lib/tailwind";
import { Country, CountryCode } from "react-native-country-picker-modal";
import CustomTextInput from "@components/form/TextInput";
import { PhoneInput } from "@components/form/PhoneInput";
import ScrollableView from "@components/shared/ScrollableView";
import Screen from "@components/shared/Screen";
import { StackActions } from "@react-navigation/native";

const schema = Yup.object().shape({
  name: Yup.string().min(3, "Too Short").required("Required").trim(),
  phone: phoneValidation,
  email: Yup.string().email("Invalid email").required("Required").trim(),
  referralCode: Yup.string().min(7, "Too Short").trim(),
});

const RegisterScreen: React.FC<RegistrationStackScreenProps<"Start">> = ({
  navigation,
}) => {
  const [countryCode, setCountryCode] = useState<CountryCode>("NG");

  const {
    control,
    clearErrors,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: "Abdul Amos",
      phone: ["09121738252", "NG"],
      email: "ttebify@gmail.com",
      referralCode: "12345678",
    },
  });

  const handleChangeCountry = (country: Country) => {
    setCountryCode(country.cca2);
  };

  const onSubmit = handleSubmit(async function (values) {
    navigation.navigate("Verify Email", { email: values.email });
  });

  return (
    <Screen>
      <ScrollableView style={tw`px-4 pt-10`}>
        <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
          Get Started with BinaPay
        </Text>
        <Text
          style={tw`w-full mb-[30px] text-zinc-500 text-lg font-normal leading-snug`}
        >
          Join our community! Let's get you started with a few quick steps.
        </Text>
        <Controller
          control={control}
          name="name"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              label="Full name"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!errors.name}
              errorMessage={errors.name?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              label="Email Address"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!errors.email}
              errorMessage={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="phone"
          render={({ field: { value } }) => (
            <PhoneInput
              identifier="phone"
              label="Phone"
              phone={value?.[0] || ""}
              onChangePhone={(phone) => {
                setValue("phone", [phone, countryCode]);
              }}
              countryCode={countryCode}
              onChangeCountry={handleChangeCountry}
              error={!!errors.phone}
              errorMessage={errors.phone?.message}
              preferredCountries={["NG"]}
              clearErrorMessage={() => clearErrors("phone")}
            />
          )}
        />

        <View style={tw`mt-2`}>
          <Controller
            control={control}
            name="referralCode"
            render={({ field: { onChange, onBlur, value } }) => (
              <CustomTextInput
                label="Referral Code (Optional, if applicable)"
                mode="outlined"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!errors.referralCode}
                errorMessage={errors.referralCode?.message}
              />
            )}
          />
        </View>

        <View
          style={tw`flex flex-row items-center justify-center mt-6 mb-8 gap-2`}
        >
          <Text style={tw`text-gray-800 text-sm`}>Already a BinaPay User?</Text>
          <TouchableOpacity
            onPress={() => {
              navigation.dispatch(
                StackActions.push("Auth", { screen: "Login" })
              );
            }}
          >
            <Text style={tw`text-primary text-sm`}>Login here</Text>
          </TouchableOpacity>
        </View>
        <View>
          <Text style={tw`text-xs text-center`}>
            By registering, you accept BinaPay's{" "}
            <Text style={tw`text-primary-400`}>Terms & Conditions</Text> and
            <Text style={tw`text-primary-400`}>Privacy Policy</Text>. Your data
            will be securely encrypted.
          </Text>
        </View>
        <View style={tw`mb-10`}>
          <Button
            style={tw`mt-5 mb-8 py-2 w-full text-white rounded-[94px]`}
            mode="contained"
            onPress={onSubmit}
          >
            <Text
              style={tw`text-white text-center text-base font-medium leading-normal`}
            >
              Continue
            </Text>
          </Button>
        </View>
      </ScrollableView>
    </Screen>
  );
};

export default RegisterScreen;
