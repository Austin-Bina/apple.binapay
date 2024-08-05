export function convertToNaira(
  rawAmount: number | string = 0,
  prefix: boolean = true
): string {
  const parsedAmount =
    typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

  if (isNaN(parsedAmount)) {
    throw new Error(
      "Invalid input: amount must be a number or a string representing a number."
    );
  }

  const amountInNaira = parsedAmount / 100;
  const amount = amountInNaira.toFixed(2);

  return prefix ? `₦${amount}` : amount;
}

export function formatToNaira(rawAmount: number | string = 0) {
  const parsedAmount =
    typeof rawAmount === "string" ? parseFloat(rawAmount) : rawAmount;

  if (isNaN(parsedAmount)) {
    throw new Error(
      "Invalid input: amount must be a number or a string representing a number."
    );
  }

  const amount = parsedAmount.toFixed(2);

  return `₦${amount}`;
}
