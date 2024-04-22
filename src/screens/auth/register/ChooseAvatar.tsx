import React, { useState, useEffect, useRef } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";
import { Button, SegmentedButtons } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/shared/Screen";
import { Colors } from "@constants/theme";
import MaleOne from "@assets/images/avatars/male-1.svg";
import MaleTwo from "@assets/images/avatars/male-2.svg";
import MaleThree from "@assets/images/avatars/male-3.svg";
import MaleFour from "@assets/images/avatars/male-4.svg";
import FemaleOne from "@assets/images/avatars/female-1.svg";
import FemaleTwo from "@assets/images/avatars/female-2.svg";
import FemaleThree from "@assets/images/avatars/female-3.svg";
import FemaleFour from "@assets/images/avatars/female-4.svg";

type Props = RegistrationStackScreenProps<"Choose Avatar">;

const AVATARS = {
  male: [
    { id: "MaleOne", component: <MaleOne width={140} /> },
    { id: "MaleTwo", component: <MaleTwo width={140} /> },
    { id: "MaleThree", component: <MaleThree width={140} /> },
    { id: "MaleFour", component: <MaleFour width={140} /> },
  ],
  female: [
    { id: "FemaleOne", component: <FemaleOne width={140} /> },
    { id: "FemaleTwo", component: <FemaleTwo width={140} /> },
    { id: "FemaleThree", component: <FemaleThree width={140} /> },
    { id: "FemaleFour", component: <FemaleFour width={140} /> },
  ],
};

const ChooseAvatar: React.FC<Props> = ({ navigation }) => {
  const [selectedAvatar, setSelectedAvatar] = useState<string>("MaleOne");
  const [avatarType, setAvatarType] = useState("male");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [avatarType]);

  const handleAvatarSelection = (id: string) => {
    setSelectedAvatar(id);
  };

  const renderAvatars = () => {
    const avatars = AVATARS[avatarType as keyof typeof AVATARS];

    return (
      <View style={tw`flex-row flex-wrap gap-2 justify-between`}>
        {avatars.map((avatar) => (
          <TouchableOpacity
            key={avatar.id}
            onPress={() => handleAvatarSelection(avatar.id)}
            style={[
              tw`w-[40%] w-[150px] h-[150px] mb-2 border-2 border-transparent rounded-full justify-center items-center p-2`,
              selectedAvatar === avatar.id && tw`border-blue-500 border-2`,
            ]}
          >
            {avatar.component}
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-10`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            Choose Your Avatar
          </Text>
          <Text
            style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}
          >
            Select an avatar that represents you best from the options below.
          </Text>
          <SegmentedButtons
            value={avatarType}
            onValueChange={setAvatarType}
            buttons={[
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
            ]}
            theme={{
              colors: {
                secondaryContainer: Colors.gray[700],
                onSecondaryContainer: "white",
              },
            }}
            style={tw`px-4`}
          />
          <Animated.View
            style={{
              ...tw`px-4 py-8`,
              opacity: fadeAnim,
            }}
          >
            {renderAvatars()}
          </Animated.View>
        </View>
        <View>
          <Button
            style={tw`flex items-center mb-4 justify-center py-2 w-full rounded-[94px]`}
            mode="contained"
            disabled={!selectedAvatar} // Disable continue if no avatar selected
            onPress={() => navigation.navigate("Register Success")} // Assuming navigation prop
          >
            Continue
          </Button>
        </View>
      </View>
    </Screen>
  );
};

export default ChooseAvatar;
