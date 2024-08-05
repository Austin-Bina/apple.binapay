import Toast, { ToastOptions } from "react-native-root-toast";

interface Args extends ToastOptions {
  message: string;
}

export const showToast = ({
  message,
  ...rest
}: Args) => {
  Toast.show(message, {
    ...rest,
  });
};
