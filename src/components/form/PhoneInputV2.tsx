import React, { Fragment } from "react";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import {
  TextInputProps,
  TextInput as PaperTextInput,
  TouchableRipple,
  HelperText,
  Text,
} from "react-native-paper";
import { Image } from "react-native-element-image";
import { View } from "react-native";
import CustomTextInput from "./TextInput";
import tw from "@lib/tailwind";

type PhoneInputProps = TextInputProps & {
  phone: string;
  onChangePhone(phone: string): void;
  countryCode: CountryCode;
  onChangeCountry(country: Country): void;
  preferredCountries?: CountryCode[];
  identifier?: string;
  clearErrorMessage?: () => void;
  errorMessage?: string;
};

export function PhoneInput({
  countryCode,
  phone,
  onChangeCountry,
  onChangePhone,
  preferredCountries,
  // identifier,
  error: hasError,
  style,
  label,
  outlineStyle,
  errorMessage,
  ...wrapperProps
}: PhoneInputProps) {
  const handleChangeCountry = (country: Country) => {
    onChangeCountry(country);
    wrapperProps.clearErrorMessage?.();
  };

  const handleChangeText = (value: string) => {
    onChangePhone(value);
    wrapperProps.clearErrorMessage?.();
  };

  return (
    <View style={tw`w-full`}>
      <Text style={tw`text-gray text-sm font-light leading-loose`}>
        {label}
      </Text>
      <View style={tw`flex-row items-center justify-start w-full`}>
        <TouchableRipple
          style={tw`items-center border rounded-2xl justify-center mr-1 py-3 ${
            hasError ? "border-red-500" : "border-gray-300"
          }`}
          onPress={() => {}}
        >
          <View style={tw`relative`}>
            <CountryPicker
              containerButtonStyle={tw`justify-center pl-2 pr-8`}
              countryCode={countryCode}
              withCallingCode
              withCallingCodeButton
              withFilter
              preferredCountries={preferredCountries}
              onSelect={handleChangeCountry}
            />
            <View
              style={tw`absolute right-2 top-0 bottom-0 justify-center bg-transparent`}
              pointerEvents="none"
            >
              <Image
                source={require("@assets/icons/dropdown.png")}
                width={20}
                height={20}
              />
            </View>
          </View>
        </TouchableRipple>
        <View style={tw`flex-grow w-1/2 relative`}>
          <CustomTextInput
            mode="outlined"
            accessible
            keyboardType="phone-pad"
            autoCorrect={false}
            autoComplete="tel"
            textContentType="telephoneNumber"
            error={hasError}
            onChangeText={handleChangeText}
            value={phone}
            right={<PaperTextInput.Affix text={countryCode} />}
            {...wrapperProps}
          />
          <HelperText
            type="error"
            visible={hasError}
            style={{
              height: hasError ? "auto" : 0,
              position: "absolute",
              top: "100%",
            }}
          >
            {errorMessage}
          </HelperText>
        </View>
      </View>
    </View>
  );
}
