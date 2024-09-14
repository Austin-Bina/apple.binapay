import tw from "@lib/tailwind";
import { View } from "react-native";
import { Text } from "react-native-paper";

const EducationEmptyState = () => {
  return (
    <View style={tw`flex-1 items-center justify-center`}>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold mt-10 `}>
        No Education Plans Available
      </Text>
      <Text variant="bodySmall" style={tw`text-gray-500`}>
        We don't have any education plans available. Please try again or contact support.
      </Text>
    </View>
  );
};

export default EducationEmptyState;
