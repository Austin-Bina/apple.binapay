import { formatNumber } from "react-native-currency-input";

export const formatNairaValue = (value: string | number) => {
  let numberValue: number;

  if (typeof value === "string") {
    numberValue = Number.parseInt(value);
  } else {
    numberValue = value;
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
