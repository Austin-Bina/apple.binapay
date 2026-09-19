import { View, StyleSheet, TouchableOpacity } from "react-native";
import React, { useCallback, useState } from "react";
import CustomTextInput from "@components/ui/form/TextInput";
import { Text, TextInput } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { Controller, useFormContext } from "react-hook-form";
import { passwordFields, RegistrationFormValues, useCompleteRegisterForm } from "@providers/complete-registration";
import { EyeOpen, PasswordLock } from "@components/icons/svg";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

type ResetPasswordProps = RegistrationStackScreenProps<"Complete Registration">;

const CreatePassword: React.FC<ResetPasswordProps> = ({ navigation }) => {
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(true);
  const insets = useSafeAreaInsets();

  const { dispatch } = useCompleteRegisterForm();
  const { control, trigger } = useFormContext<RegistrationFormValues>();

  const handleNext = useCallback(async function () {
    trigger(passwordFields).then((allGood) => {
      if (allGood) {
        dispatch({ type: "updateScreenIndex", index: 1 });
      }
    });
  }, [dispatch, trigger]);

  return (
    <View style={[s.root]}>
      <ScreenHeader
        title="Create Password"
        subtitle="Secure your BinaPay account"
        onBack={() => navigation.goBack()}
      />

      <View style={s.content}>
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="lock-outline" size={18} color={BLUE} />
          <Text style={s.infoText}>
            Choose a strong password that is easy to remember but hard for others to guess.
          </Text>
        </View>

        <View style={s.formCard}>
          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Password"
                placeholder="••••••••"
                secureTextEntry={passwordVisible}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                mode="outlined"
                left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordVisible((prev) => !prev)}
                    icon={passwordVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
          />
          <Controller
            control={control}
            name="password_confirmation"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Confirm Password"
                placeholder="••••••••"
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                secureTextEntry={passwordConfirmationVisible}
                mode="outlined"
                left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordConfirmationVisible((prev) => !prev)}
                    icon={passwordConfirmationVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
          />
        </View>
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity style={s.continueBtn} onPress={handleNext} activeOpacity={0.85}>
          <Text style={s.continueBtnText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  root:            { flex: 1, backgroundColor: "#f8f9fb" },
  content:         { flex: 1, padding: 16 },
  infoCard:        { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText:        { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },
  formCard:        { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", gap: 4 },
  footer:          { paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  continueBtn:     { backgroundColor: BLUE, paddingVertical: 14, borderRadius: 12, alignItems: "center" },
  continueBtnText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});

export default CreatePassword;
