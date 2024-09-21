import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import Toast, { ToastOptions } from "react-native-root-toast";

interface Args extends ToastOptions {
  message: string;
}

export const showToast = ({
  message,
  duration = Toast.durations.LONG,
  position = Toast.positions.BOTTOM,
  textColor = Colors.gray[800],
  containerStyle = tw`bg-primary-50 rounded-sm`,
  shadow = false,
  ...rest
}: Args) => {
  Toast.show(message, {
    duration,
    position,
    textColor,
    containerStyle,
    ...rest,
  });
};
