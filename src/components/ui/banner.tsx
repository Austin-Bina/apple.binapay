import tw from "@lib/tailwind";
import { StyleProp, View, ViewStyle } from "react-native";
import InfoIcon from "@assets/icons/info.svg";
import { Text } from "react-native-paper";

interface BannerProps {
  title?: string;
  content: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "info" | "error" | "default";
}

const Banner: React.FC<BannerProps> = ({ content, title, style, variant = "default" }) => {
  const variantStyles = {
    info: {
      container: tw`bg-primary-50`,
      titleText: tw`text-primary-600`,
      messageText: tw`text-primary-500`,
    },
    error: {
      container: tw`bg-red-50`,
      titleText: tw`text-red-600`,
      messageText: tw`text-red-500`,
    },
    default: {
      container: tw`bg-secondary-50`,
      titleText: tw`text-secondary-600`,
      messageText: tw`text-secondary-500`,
    },
  };

  const styles = variantStyles[variant];

  const contentView =
    typeof content === "string" ? (
      <Text variant="bodySmall" style={[styles.messageText, tw`w-full`]}>
        {content}
      </Text>
    ) : (
      content
    );

  return (
    <View style={[styles.container, tw`flex-row items-center p-2.5 rounded-xl gap-2 w-full`, style]}>
      <InfoIcon width={24} height={24} />
      <View style={tw`w-11/12`}>
        {title && <Text style={[styles.titleText, tw`text-lg w-11/12 font-bold mb-0.5`]}>{title}</Text>}
        {contentView}
      </View>
    </View>
  );
};

export default Banner;
