import { formatNumber } from "react-native-currency-input";
import { z } from "zod";

function convertToNaira(rawAmount: number | string = 0, prefix: boolean = true): string {
  const parsedAmount = typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

  if (isNaN(parsedAmount)) {
    throw new Error("Invalid input: amount must be a number or a string representing a number.");
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
    throw new Error("Invalid input: amount must be a number or a string representing a number.");
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

export { convertToNaira, formatToNaira, zodAmountValidation };
