import { z } from "zod";
import { CountryCode, parsePhoneNumber } from "libphonenumber-js/min";
import { CountryCode as ModalCountryCode } from "react-native-country-picker-modal";
import { providerNumberCodes } from "@constants/providers";

const phoneSchema = z
  .string()
  .transform((val) => formatPhone(val))
  .refine((phone) => {
    try {
      const parsed = parsePhoneNumber(phone, "NG");
      return parsed.isValid();
    } catch {
      return false;
    }
  }, "Phone number is invalid");

const zodPhoneValidation = phoneSchema;

function formatPhone(phone: string, countryCode: CountryCode = "NG") {
  try {
    const phoneNumber = parsePhoneNumber(phone, countryCode);
    return `0${phoneNumber?.nationalNumber}`;
  } catch (err) {
    return "";
  }
}

function checkPhoneNumberProvider(number: string) {
  const lookUpKeyLong = number.slice(0, 5) as keyof typeof providerNumberCodes;
  const lookUpKeyShort = number.slice(0, 4) as keyof typeof providerNumberCodes;

  const matchingPrefix = providerNumberCodes[lookUpKeyLong] || providerNumberCodes[lookUpKeyShort];

  if (matchingPrefix) {
    const { network, provider } = matchingPrefix;

    return {
      code: number.slice(0, 5),
      network,
      provider: provider.toLowerCase(),
      matches: true,
    };
  }

  return {
    code: null,
    network: null,
    provider: null,
    matches: false,
  };
}

const getDefaultProvider = (phone: string = "") => {
  const matches = checkPhoneNumberProvider(phone);

  if (matches.matches && matches.provider) {
    return matches.provider;
  }

  return "mtn";
};

export { checkPhoneNumberProvider, formatPhone, zodPhoneValidation, getDefaultProvider };
