import tw from "@lib/tailwind";
import { StyleProp, View, ViewStyle } from "react-native";
import InfoIcon from "@assets/icons/info.svg";
import { Text } from "react-native-paper";

interface BannerProps {
  title?: string;
  message: string;
  style?: StyleProp<ViewStyle>;
}

const Banner: React.FC<BannerProps> = ({ message, title, style }) => (
  <View
    style={[
      tw`bg-secondary-50 flex-row items-center p-2.5 rounded-xl gap-2 w-full`,
      style,
    ]}
  >
    <InfoIcon width={24} height={24} />
    <View style={tw`w-11/12`}>
      {title && (
        <Text style={tw`text-secondary-600 text-lg w-11/12 font-bold mb-0.5`}>
          {title}
        </Text>
      )}
      <Text variant="bodySmall" style={tw`text-secondary-500 w-full`}>
        {message}
      </Text>
    </View>
  </View>
);

export default Banner;
