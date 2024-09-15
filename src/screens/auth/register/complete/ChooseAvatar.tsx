import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Animated, TouchableOpacity } from "react-native";
import { Button, SegmentedButtons } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/ui/shared/Screen";
import { Colors } from "@constants/theme";
import MaleOne from "@assets/images/avatars/male-1.svg";
import MaleTwo from "@assets/images/avatars/male-2.svg";
import MaleThree from "@assets/images/avatars/male-3.svg";
import MaleFour from "@assets/images/avatars/male-4.svg";
import FemaleOne from "@assets/images/avatars/female-1.svg";
import FemaleTwo from "@assets/images/avatars/female-2.svg";
import FemaleThree from "@assets/images/avatars/female-3.svg";
import FemaleFour from "@assets/images/avatars/female-4.svg";
import { scale } from "react-native-size-matters";
import {
  avatarFields,
  passwordFields,
  RegistrationFormValues,
  transactionPinFields,
  useCompleteRegisterForm,
} from "@providers/complete-registration";
import { Controller, useFormContext } from "react-hook-form";
import { showToast } from "@helpers/toast";
import { authSliceActions } from "@store/slice/auth";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectIsLoggingIn } from "@store/selectors/auth";

type Props = RegistrationStackScreenProps<"Complete Registration">;

const AVATARS = {
  male: [
    { id: "avatar-male-1", component: <MaleOne width={scale(120)} /> },
    { id: "avatar-male-2", component: <MaleTwo width={scale(120)} /> },
    { id: "avatar-male-3", component: <MaleThree width={scale(120)} /> },
    { id: "avatar-male-4", component: <MaleFour width={scale(120)} /> },
  ],
  female: [
    { id: "avatar-female-1", component: <FemaleOne width={scale(120)} /> },
    { id: "avatar-female-2", component: <FemaleTwo width={scale(120)} /> },
    { id: "avatar-female-3", component: <FemaleThree width={scale(120)} /> },
    { id: "avatar-female-4", component: <FemaleFour width={scale(120)} /> },
  ],
};

const ChooseAvatar: React.FC<Props> = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const { dispatch } = useCompleteRegisterForm();
  const storeDispatch = useTypedDispatch();
  const isLoggingIn = useTypedSelector(selectIsLoggingIn);
  const {
    control,
    watch,
    trigger,
    setError,
    handleSubmit,
    formState: { errors },
  } = useFormContext<RegistrationFormValues>();

  const { avatar: selectedAvatar, gender } = watch();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [gender]);

  const handleValidate = useCallback(
    async function () {
      trigger(avatarFields).then((allGood) => {
        if (allGood) {
          onSubmit();
        } else {
          dispatch({ type: "updateScreenIndex", index: 0 });
        }
      });
    },
    [dispatch, trigger],
  );

  const onSubmit = handleSubmit(async function (values) {
    try {
      await storeDispatch(authSliceActions.doCompleteRegister(values));
      navigation.navigate("Register Success");
    } catch (error: any) {
      if (error.errors) {
        const { errors } = error;

        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof RegistrationFormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }

          const page1Fields = [...passwordFields];
          const page2Fields = [...transactionPinFields];
          const page3Fields = [...avatarFields];

          const errorKeys = Object.keys(errors);

          if (errorKeys.some((key: any) => page1Fields.includes(key))) {
            dispatch({ type: "updateScreenIndex", index: 0 });
          } else if (errorKeys.some((key: any) => page2Fields.includes(key))) {
            dispatch({ type: "updateScreenIndex", index: 1 });
          } else if (errorKeys.some((key: any) => page3Fields.includes(key))) {
            dispatch({ type: "updateScreenIndex", index: 2 });
          }
        }
      } else {
        if (error.message) {
          showToast({ message: error.message as string });
        }
      }
    }
  });

  const renderAvatars = () => {
    const avatars = AVATARS[gender as keyof typeof AVATARS];

    return (
      <Controller
        control={control}
        name="avatar"
        render={({ field: { onChange, value } }) => (
          <View style={tw`flex-row flex-wrap gap-2 justify-around`}>
            {avatars.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                onPress={() => onChange(avatar.id)}
                style={[
                  tw`mb-2 border-2 border-transparent rounded-full justify-center items-center p-2`,
                  selectedAvatar === avatar.id && tw`border-blue-500 border-2`,
                  { width: scale(130), height: scale(130) },
                ]}>
                {avatar.component}
              </TouchableOpacity>
            ))}
          </View>
        )}
      />
    );
  };

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-5`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Choose Your Avatar</Text>
          <Text style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}>
            Select an avatar that represents you best from the options below.
          </Text>
          <Controller
            name="gender"
            control={control}
            render={({ field: { onChange, value } }) => (
              <SegmentedButtons
                value={value}
                onValueChange={onChange}
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
              />
            )}
          />
          <Animated.View
            style={{
              ...tw`py-8`,
              opacity: fadeAnim,
            }}>
            {renderAvatars()}
          </Animated.View>
        </View>
        <View style={tw`px-4 pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            mode="contained"
            loading={isLoggingIn}
            disabled={!selectedAvatar || isLoggingIn}
            onPress={handleValidate}>
            Continue
          </Button>
        </View>
      </View>
    </Screen>
  );
};

export default ChooseAvatar;
