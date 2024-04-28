import { z } from 'zod';
import { CountryCode, parsePhoneNumber } from 'libphonenumber-js/min';
import { CountryCode as ModalCountryCode } from 'react-native-country-picker-modal';

const phoneSchema = z.array(z.string()).nonempty().refine((phone) => {
  if (phone.length < 2) return false;
  const countryCode = phone[1] as CountryCode;
  try {
    const parsed = parsePhoneNumber(phone[0], countryCode);
    return parsed !== null && parsed.isValid();
  } catch {
    return false;
  }
}, 'validations:phone:invalid');

const phoneNotEmptySchema = z.array(z.string()).nonempty().refine((phone) => {
  return phone[0] !== undefined && phone[1] !== undefined;
}, 'validations:phone:required');

export const phoneValidation = phoneSchema.and(phoneNotEmptySchema);

export function formatPhone(phone: string, countryCode: ModalCountryCode) {
  try {
    const phoneNumber = parsePhoneNumber(phone, countryCode as CountryCode);
    return phoneNumber?.formatInternational();
  } catch (err) {
    return '';
  }
}
