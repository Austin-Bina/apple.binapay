import {CountryCode, parsePhoneNumber} from 'libphonenumber-js/min';
import {CountryCode as ModalCountryCode} from 'react-native-country-picker-modal';
import * as yup from 'yup';

function validPhone(phone: (string | undefined)[] | null | undefined) {
  if (phone == null || phone[0] == null || phone[1] == null) {
    return false;
  }
  const countryCode = phone[1] as CountryCode;
  try {
    const parsed = parsePhoneNumber(phone[0], countryCode);
    if (parsed == null) {
      return false;
    }
    return parsed.isValid();
  } catch {
    return false;
  }
}

function phoneNotEmpty(phone: (string | undefined)[] | null | undefined) {
  return phone != null && !!phone[0] && !!phone[1];
}

export const phoneValidation = yup
  .array()
  .of(yup.string())
  .test('valid phone', 'validations:phone:invalid', validPhone)
  .test('valid phone', 'validations:phone:required', phoneNotEmpty);

export function formatPhone(phone: string, countryCode: ModalCountryCode) {
  try {
    const phoneNumber = parsePhoneNumber(phone, countryCode as CountryCode);
    return phoneNumber?.formatInternational();
  } catch (err) {
    return '';
  }
}
