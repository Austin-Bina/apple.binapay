import tw from "@lib/tailwind";
import { View } from "react-native";
import { Text } from "react-native-paper";

const EducationErrorState = () => {
  return (
    <View style={tw`flex-1 items-center justify-center`}>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold mt-10 `}>
        Something went wrong
      </Text>
      <Text variant="bodySmall" style={tw`text-gray-500`}>
        We had an error while trying to fetch your education plans. Please try again or contact support.
      </Text>
    </View>
  );
};

export default EducationErrorState;
