import { pluralProviderMap } from "@constants/providers";
import { upperCaseFirst } from "@utils/index";
import { checkPhoneNumberProvider, zodPhoneValidation } from "@utils/phone";
import { useCallback, useEffect, useMemo } from "react";
import { UseFormClearErrors, UseFormSetError } from "react-hook-form";

const useUppercaseFirstProvider = (provider: string) =>
  useMemo(() => {
    return upperCaseFirst(provider);
  }, [provider]);

type phoneValidationHook = {
  phone: string;
  provider: string;
  portedNumber: boolean;
  setError: UseFormSetError<{
    phone: string;
  }>;
  clearErrors: UseFormClearErrors<{
    phone: string;
  }>;
};

// This hook is used to validate the phone number for the selected provider
const usePhoneValidation = ({ phone, provider, portedNumber, setError, clearErrors }: phoneValidationHook) => {
  const upperCaseProvider = useUppercaseFirstProvider(provider);
  const key = provider as keyof typeof pluralProviderMap;

  const validatePhoneNumber = useCallback(() => {
    const validation = zodPhoneValidation.safeParse(phone);

    clearErrors(["phone"]);

    if (validation.success) {
      const check = checkPhoneNumberProvider(validation.data);

      const itMatches = check.matches ? check.provider === provider : false;

      if (!itMatches && !portedNumber) {
        setError("phone", { message: `This is not ${pluralProviderMap[key]} number` });
        return false;
      }
      return true;
    } else {
      setError("phone", { message: "Invalid phone number" });
      return false;
    }
  }, [phone, provider, portedNumber, upperCaseProvider, setError, clearErrors]);

  useEffect(() => {
    if (phone && provider) {
      validatePhoneNumber();
    }
  }, [phone, provider, validatePhoneNumber]);

  return validatePhoneNumber;
};

export { useUppercaseFirstProvider, usePhoneValidation };
