import tw from "@lib/tailwind"
import Toast, { type ToastOptions } from "react-native-root-toast"

interface ToastArgs extends ToastOptions {
  message: string
  variant?: "default" | "success" | "error" | "warning" | "info"
}

// Toast styling based on variant
const getVariantStyles = (variant: ToastArgs["variant"] = "default") => {
  switch (variant) {
    case "success":
      return {
        containerStyle: tw`bg-green-50 border-l-4 border-green-500 rounded-md`,
        textColor: tw.color('green-800'),
        textStyle: tw`font-medium`,
      }
    case "error":
      return {
        containerStyle: tw`bg-red-50 border-l-4 border-red-500 rounded-md`,
        textColor: tw.color('red-800'),
        textStyle: tw`font-medium`,
      }
    case "warning":
      return {
        containerStyle: tw`bg-amber-50 border-l-4 border-amber-500 rounded-md`,
        textColor: tw.color('amber-800'),
        textStyle: tw`font-medium`,
      }
    case "info":
      return {
        containerStyle: tw`bg-blue-50 border-l-4 border-blue-500 rounded-md`,
        textColor: tw.color('blue-800'),
        textStyle: tw`font-medium`,
      }
    default:
      return {
        containerStyle: tw`bg-primary-50 border-l-4 border-primary-500 rounded-md`,
        textColor: tw.color('gray-800'),
        textStyle: tw`font-medium`,
      }
  }
}

export const showToast = ({
  message,
  variant = "default",
  duration = Toast.durations.LONG,
  position,
  textColor,
  containerStyle,
  textStyle,
  shadow = true,
  opacity = 1,
  animation = true,
  hideOnPress = true,
  delay = 0,
  onShow,
  onShown,
  onHide,
  onHidden,
  ...rest
}: ToastArgs) => {


  const variantStyles = getVariantStyles(variant)

  // Apply responsive padding and width
  const responsiveContainerStyle = tw.style(
    variantStyles.containerStyle,
    tw`px-3 py-2 mx-4 max-w-[90%]`,
    shadow ? tw`shadow-md` : null,
  )

  Toast.show(message, {
    duration,
    position: Toast.positions.BOTTOM,
    textColor: textColor ?? variantStyles.textColor,
    textStyle: [tw.style(variantStyles.textStyle), textStyle],
    containerStyle: [responsiveContainerStyle, containerStyle],
    shadow,
    opacity,
    animation,
    hideOnPress,
    delay,
    onShow,
    onShown,
    onHide,
    onHidden,
    ...rest,
  })
}

export const useToast = () => {
  return {
    toast: showToast,
    success: (message: string, options?: Omit<ToastArgs, "message" | "variant">) =>
      showToast({ message, variant: "success", ...options }),
    error: (message: string, options?: Omit<ToastArgs, "message" | "variant">) =>
      showToast({ message, variant: "error", ...options }),
    warning: (message: string, options?: Omit<ToastArgs, "message" | "variant">) =>
      showToast({ message, variant: "warning", ...options }),
    info: (message: string, options?: Omit<ToastArgs, "message" | "variant">) =>
      showToast({ message, variant: "info", ...options }),
  }
}

