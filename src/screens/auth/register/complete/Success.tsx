import { ImageBackground, View } from "react-native";
import React from "react";
import tw from "@lib/tailwind";
import { Button, Text } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { getNavigate } from "@utils/navigation";

const RegisterSuccessScreen: React.FC<
  RegistrationStackScreenProps<"Register Success">
> = () => {
  const onSubmit = async function () {
    const { reset } = await getNavigate();
    reset({ routes: [{ name: "Main" }] });
  };

  return (
    <ImageBackground
      source={require("@assets/images/background-with-logo.png")}
    >
      <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
        <View style={tw`flex-1 justify-center`}>
          <View style={tw`p-4 h-1/2 justify-end`}>
            <View>
              <Text
                style={tw`w-full font-bold text-3xl text-center text-gray-800 mb-2.5`}
              >
                Registration Complete 🎉
              </Text>
              <Text
                style={tw`leading-6 w-full font-light text-base text-gray text-center`}
              >
                Congratulations! Your registration is complete. Proceed to your
                home screen to start exploring BinaPay.
              </Text>
            </View>
          </View>
        </View>
        <View style={tw`px-4 pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            onPress={onSubmit}
            mode="contained"
          >
            Continue to Home
          </Button>
        </View>
      </View>
    </ImageBackground>
  );
};

export default RegisterSuccessScreen;
