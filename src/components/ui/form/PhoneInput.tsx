import React, { Fragment } from "react";
import CountryPicker, {
  Country,
  CountryCode,
} from "react-native-country-picker-modal";
import tw from "twrnc";
import {
  TextInputProps,
  TextInput as PaperTextInput,
  TouchableRipple,
  HelperText,
  Text,
} from "react-native-paper";
import { Image } from "react-native-element-image";
import { View } from "react-native";

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
    <View>
      <View style={tw`flex-row items-end`}>
        <View style={tw`w-full`}>
          <Text style={tw`text-neutral-700 text-lg font-normal leading-loose`}>
            {label}
          </Text>
          <View style={tw`flex-row items-center justify-start w-full mb-2`}>
            <TouchableRipple
              style={tw`items-center border rounded-lg border-gray-400 justify-center mr-1 py-3 ${
                hasError ? "border-red-500" : "border-gray-400"
              }`}
              onPress={() => {}}
            >
              <Fragment>
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
                    width={24}
                    height={24}
                  />
                </View>
              </Fragment>
            </TouchableRipple>
            <View style={tw`flex-grow w-1/2 relative`}>
              <PaperTextInput
                style={[tw`bg-white w-full`, style]}
                outlineStyle={[tw`rounded-lg`, outlineStyle]}
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
      </View>
    </View>
  );
}
