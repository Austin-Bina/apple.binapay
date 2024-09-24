import { CustomerSettings } from "@type/app";
import { formatNumber } from "react-native-currency-input";
import { z } from "zod";

function convertToNaira(rawAmount: number | string = 0, prefix: boolean = true): string {
  let parsedAmount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

  if (isNaN(parsedAmount)) {
    parsedAmount = 0;
  }

  const amountInNaira = parsedAmount / 100;
  const amount = amountInNaira.toFixed(2);
  const formattedAmount = formatToNaira(amountInNaira);

  return prefix ? formattedAmount : amount;
}

const formatToNaira = (value: string | number = 0) => {
  let numberValue: number;

  if (typeof value === "string") {
    numberValue = Number.parseInt(value);
  } else {
    numberValue = value;
  }

  if (isNaN(numberValue)) {
    numberValue = 0;
  }

  const formattedNumber = formatNumber(numberValue, {
    separator: ".",
    prefix: "₦",
    precision: 2,
    delimiter: ",",
    signPosition: "beforePrefix",
  });

  return formattedNumber;
};

const zodAmountValidation = (minAmount: number = 0) =>
  z
    .string()
    .trim()
    .transform((val) => {
      const numericValue = val ? parseFloat(val.replace(/[^0-9.]/g, "")) : 0;
      return `${numericValue}`;
    })
    .refine(
      (val) => {
        const numericValue = parseFloat(val);
        return numericValue >= minAmount;
      },
      {
        message: `Amount must not be less than ${formatToNaira(minAmount)}`,
      },
    );

function calculateTransactionDetails(
  amount: number,
  type: "airtime" | "data" | "cable" | "education" | "epin" | "electricity",
  customers: CustomerSettings,
) {
  const chargeKey = `${type}_charge_percentage` as const;
  const discountKey = `${type}_discount_percentage` as const;

  let chargePercentage = customers[chargeKey] || 0;
  let discountPercentage = customers[discountKey] || 0;

  let chargeAmount = (chargePercentage / 100) * amount;
  let discountAmount = (discountPercentage / 100) * amount;

  const details: { [key: string]: string } = {};

  if (chargeAmount > 0) {
    details["Extra Charge"] = formatToNaira(chargeAmount);
  }

  if (discountAmount > 0) {
    details["You Save"] = formatToNaira(discountAmount);
  }

  return details;
}

export { convertToNaira, formatToNaira, zodAmountValidation, calculateTransactionDetails };
