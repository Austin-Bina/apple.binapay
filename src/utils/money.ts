import { PaymentProcessor } from "@enum/providers";
import { CustomerSettings, TransactionSettings } from "@type/app";
import { formatNumber } from "react-native-currency-input";
import { z } from "zod";

function convertToNaira(
  rawAmount: number | string = 0,
  prefix: boolean = true
): string {
  let parsedAmount =
    typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

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
/**
 * 
 * @param minAmount justice work, but causing a string and number mismatch
 * @param format 
 * @returns 
 */
/*
const zodAmountValidation = (minAmount: number = 0, format = false) =>
  z
    .union([z.string().trim(), z.number()])
    .transform((val) => {
      const numericValue =
        typeof val === "string" ? parseFloat(val.replace(/[^0-9.]/g, "")) : val;

      return `${numericValue}`;
    })
    .refine(
      (val) => {
        const numericValue = parseFloat(val);
        return numericValue >= minAmount;
      },
      {
        message: `Amount must not be less than ${format ? formatToNaira(minAmount) : minAmount}`,
      }
    );
*/

const zodAmountValidation = (minAmount: number = 0, format = false) =>
  z
    .string()
    .trim()
    .refine(
      (val) => {
        const numericValue = parseFloat(val.replace(/[^0-9.]/g, ""));
        return !isNaN(numericValue) && numericValue >= minAmount;
      },
      {
        message: `Amount must not be less than ${
          format ? formatToNaira(minAmount) : minAmount
        }`,
      }
    );

function calculateTransactionDetails(
  amount: number,
  service: "airtime" | "cable" | "education" | "epin" | "electricity",
  customers: CustomerSettings
) {
  const discountKey =
    `${service}_discount_percentage` as keyof CustomerSettings;
  const discountPercentage = customers[discountKey] || 0;

  const chargeKey = `${service}_charge_percentage` as keyof CustomerSettings;
  const chargePercentage = customers[chargeKey] || 0;

  const discountAmount = (discountPercentage / 100) * amount;
  const chargeAmount = (chargePercentage / 100) * amount;

  let finalAmount = amount - discountAmount + chargeAmount;

  let result: Record<string, string> = {
    "You pay": formatToNaira(finalAmount),
  };

  if (discountAmount > 0) {
    result = {
      ...result,
      "You save": formatToNaira(discountAmount),
    };
  }

  return result;
}

const calculateSettlementAmount = (
  amount: number = 0,
  provider: PaymentProcessor,
  options: TransactionSettings["payment_provider_fees"] = []
) => {
  const providerFee = options.find((opt) => opt.name === provider);
  let finalAmount = amount;

  if (providerFee) {
    const type = providerFee.fee_type;

    const feePercentage = providerFee.charge_percentage;
    const feeCap = providerFee.cap;

    if (type === "percentage") {
      const calculatedFee = Math.min(amount * (feePercentage / 100), feeCap);
      finalAmount = amount - calculatedFee;
    } else if (type === "flat") {
      finalAmount = amount - Math.min(providerFee.flat_fee, feeCap);
    }
  }

  return {
    amount: finalAmount,
    config: providerFee,
  };
};

export {
  convertToNaira,
  formatToNaira,
  zodAmountValidation,
  calculateTransactionDetails,
  calculateSettlementAmount,
};
