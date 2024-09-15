import { ImageBackground, View } from "react-native";
import React from "react";
import tw from "@lib/tailwind";
import { Button, Text } from "react-native-paper";
import { StackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectLoggedIn } from "@store/selectors/auth";

const ResetPasswordSuccessScreen: React.FC<StackScreenProps<"Reset Password Successful">> = ({ navigation }) => {
  const isLoggedIn = useTypedSelector(selectLoggedIn);

  const handleNavigate = function () {
    if (isLoggedIn) {
      return navigation.reset({
        routes: [{ name: "Main" }],
      });
    } else {
      return navigation.reset({
        routes: [{ name: "Auth" }],
      });
    }
  };

  return (
    <ImageBackground source={require("@assets/images/background-with-logo.png")}>
      <View style={tw`flex flex-col px-4 pt-5 justify-between h-full`}>
        <View style={tw`flex-1 justify-center`}>
          <View style={tw`p-4 h-1/2 justify-end`}>
            <View>
              <Text style={tw`w-full font-bold text-3xl text-center text-gray-800 mb-2.5`}>
                Password Reset Successful 🎉
              </Text>
              <Text style={tw`leading-6 w-full font-light text-base text-gray text-center`}>
                Your password has been successfully reset. Use your new password to log in.
              </Text>
            </View>
          </View>
        </View>
        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`py-2`}
          onPress={handleNavigate}
          mode="contained">
          <Text style={tw`text-white text-center text-base font-bold`}>Finish</Text>
        </Button>
      </View>
    </ImageBackground>
  );
};

export default ResetPasswordSuccessScreen;
