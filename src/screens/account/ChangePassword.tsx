import { View, StyleSheet, SafeAreaView } from "react-native";
import React, { useState } from "react";
import CustomTextInput from "@components/ui/form/TextInput";
import { Button, Text, TextInput } from "react-native-paper";
import { AccountStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { TouchableOpacity } from "react-native-gesture-handler";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import { AxiosError } from "axios";
import { getNavigate } from "@utils/navigation";
import { EyeOpen, PasswordLock } from "@components/icons/svg";
import { SCREENS } from "@constants/screens";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ScreenHeader from "@components/ui/shared/ScreenHeader";

type ResetPasswordProps = AccountStackScreenProps<"Change Password">;

const BLUE = "#2563EB";
const BRAND = "#1E3A8A";

const schema = z
  .object({
    current_password: z.string().trim().min(8, "Password too weak"),
    password: z.string().trim().min(8, "Password too weak"),
    password_confirmation: z.string().trim().min(8, "Password too weak"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });
type FormValues = z.infer<typeof schema>;

export default function ChangePassword(props: ResetPasswordProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const user = useTypedSelector(selectUser);
  const { control, handleSubmit, setError } = useForm<FormValues>({
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
    resolver: zodResolver(schema),
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsProcessing(true);
    try {
      await API.post(route("auth.changePassword"), data);
      const { reset } = await getNavigate();
      reset({ routes: [{ name: "Reset Password Successful" }] });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response) {
        const { errors } = response.data;
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, { message: fieldErrors.join(", ") });
            }
          }
        }
        return;
      }
      showToast({ message: "Something went wrong. Please try again." });
    } finally {
      setIsProcessing(false);
    }
  });

  const handlePasswordResetNavigation = async () => {
    const { navigate } = await getNavigate();
    navigate(SCREENS.FORGOT_PASSWORD, { email: user?.email || "" });
  };

  return (
     <View style={s.root}>
      {/* Header */}
        <ScreenHeader
          title="Change Password"
          subtitle="Update your account password"
          onBack={() => navigation.goBack()}
          rightIcon="shield-check-outline"       
        />

      <ScrollableView contentContainerStyle={s.scroll}>
        {/* Info card */}
        <View style={s.infoCard}>
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color={BLUE} />
          <Text style={s.infoText}>
            Complete the fields below to change your password. Use at least 8 characters.
          </Text>
        </View>

        <View style={s.form}>
          <Controller
            control={control}
            name="current_password"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Current Password"
                secureTextEntry={currentPasswordVisible}
                onBlur={onBlur}
                value={value}
                onChangeText={onChange}
                error={!!error}
                errorMessage={error?.message}
                mode="outlined"
                left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setCurrentPasswordVisible((prev) => !prev)}
                    icon={currentPasswordVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                    color="#71717A"
                    forceTextInputFocus={false}
                  />
                }
              />
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="New Password"
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
                label="Confirm New Password"
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

        <TouchableOpacity style={s.forgotLink} onPress={handlePasswordResetNavigation}>
          <Text style={s.forgotText}>Forgot Current Password?</Text>
        </TouchableOpacity>

        <View style={s.footer}>
          <Button
            style={s.submitBtn}
            contentStyle={s.submitBtnContent}
            disabled={isProcessing}
            onPress={onSubmit}
            mode="contained"
          >
            <Text style={s.submitBtnText}>Reset Password</Text>
          </Button>
        </View>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: "#f8f9fb" },
  header:         { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  backBtn:        { width: 32, height: 32, borderRadius: 10, backgroundColor: "#EEF3FF", justifyContent: "center", alignItems: "center" },
  headerTitle:    { fontSize: 16, fontWeight: "700", color: "#1E3A8A" },
  headerSub:      { fontSize: 11, color: "#6b7280", marginTop: 1 },

  scroll:         { padding: 16, paddingBottom: 40 },

  infoCard:       { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#EEF3FF", borderRadius: 12, padding: 14, marginBottom: 20 },
  infoText:       { flex: 1, fontSize: 13, color: "#374151", lineHeight: 18 },

  form:           { gap: 4 },

  forgotLink:     { alignItems: "center", marginTop: 20, marginBottom: 8 },
  forgotText:     { fontSize: 13, fontWeight: "700", color: "#2563EB" },

  footer:         { marginTop: 16 },
  submitBtn:      { borderRadius: 12 },
  submitBtnContent:{ paddingVertical: 6 },
  submitBtnText:  { color: "#fff", fontSize: 15, fontWeight: "700" },
});
