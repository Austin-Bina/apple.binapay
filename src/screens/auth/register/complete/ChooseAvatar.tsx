import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, Animated, TouchableOpacity, StyleSheet } from "react-native";
import { SegmentedButtons } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { Colors } from "@constants/theme/colors";
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
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import ScrollableView from "@components/ui/shared/ScrollableView";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

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
  const insets = useSafeAreaInsets();
  const { control, watch, trigger, setError, handleSubmit } = useFormContext<RegistrationFormValues>();

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
      await storeDispatch(authSliceActions.doCompleteRegister(values)).unwrap();
      navigation.navigate("Register Success");
    } catch (error: any) {
      if (error.errors) {
        const { errors } = error;
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof RegistrationFormValues, {
                message: (fieldErrors as string[]).join(", "),
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
          <View style={s.avatarGrid}>
            {avatars.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                onPress={() => onChange(avatar.id)}
                style={[
                  s.avatarBtn,
                  selectedAvatar === avatar.id && s.avatarBtnActive,
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
    <View style={[s.root]}>
      <ScreenHeader
        title="Choose Your Avatar"
        subtitle="Select an avatar that represents you"
        onBack={() => navigation.goBack()}
      />

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* Info card */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="account-circle-outline" size={18} color={BLUE} />
          <Text style={s.infoText}>
            Pick an avatar below. You can always change it later from your profile settings.
          </Text>
        </View>

        {/* Gender selector */}
        <Text style={s.sectionLabel}>Select Gender</Text>
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

        {/* Avatars */}
        <Text style={[s.sectionLabel, { marginTop: 20 }]}>Select Avatar</Text>
        <Animated.View style={{ opacity: fadeAnim }}>
          {renderAvatars()}
        </Animated.View>

      </ScrollableView>

      {/* Footer */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[s.continueBtn, (!selectedAvatar || isLoggingIn) && s.disabledBtn]}
          disabled={!selectedAvatar || isLoggingIn}
          onPress={handleValidate}
          activeOpacity={0.85}
        >
          <Text style={s.continueBtnText}>
            {isLoggingIn ? "Setting up your account..." : "Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  scroll:          { padding: 16, paddingBottom: 100 },
  infoCard:        { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 12, marginBottom: 20 },
  infoText:        { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
  sectionLabel:    { fontSize: 12, fontWeight: "700", color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 },
  avatarGrid:      { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "space-around", paddingVertical: 8 },
  avatarBtn:       { borderWidth: 2, borderColor: "transparent", borderRadius: 999, justifyContent: "center", alignItems: "center", padding: 4 },
  avatarBtnActive: { borderColor: BLUE, backgroundColor: "#EEF3FF" },
  footer:          { paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  continueBtn:     { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  continueBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
  disabledBtn:     { opacity: 0.5 },
});

export default ChooseAvatar;
