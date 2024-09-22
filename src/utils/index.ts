import { format } from "date-fns";

const upperCaseFirst = (str: string) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const formatSecondsToDate = (seconds: number | string) => {
  const stringTime = seconds.toString();

  if (isNaN(parseInt(stringTime, 10))) {
    throw new Error("Invalid seconds");
  }

  const date = new Date(parseInt(stringTime, 10) * 1000);
  return format(date, "dd MMM yyyy, hh:mm a");
};

export { upperCaseFirst, formatSecondsToDate };
