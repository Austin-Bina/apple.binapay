import React, { useState } from "react";
import { View, StyleSheet, TouchableOpacity, Platform, StatusBar } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import { AccountStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import CustomTextInput from "@components/ui/form/TextInput";
import ScrollableView from "@components/ui/shared/ScrollableView";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
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

type ResetPasswordProps = AccountStackScreenProps<"Change Password">;

const BRAND      = "#1E3A8A";
const BLUE       = "#2563EB";
const BLUE_LIGHT = "#EEF3FF";
const BG         = "#F2F2F7";
const SURFACE    = "#FFFFFF";
const SEPARATOR  = "#E5E7EB";
const SUBLABEL   = "#6B7280";

const IOS_SHADOW = Platform.select({
  ios:     { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 6 },
  android: { elevation: 2 },
});

const schema = z
  .object({
    current_password:      z.string().trim().min(8, "Password too weak"),
    password:              z.string().trim().min(8, "Password too weak"),
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

  // ── All original state + logic — untouched ────────────────────────────────
  const [currentPasswordVisible, setCurrentPasswordVisible]         = useState(true);
  const [passwordVisible, setPasswordVisible]                       = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] = useState(true);
  const [isProcessing, setIsProcessing]                             = useState(false);

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
    <View style={[s.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" />

      {/* ── iOS nav bar ── */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialCommunityIcons name="chevron-left" size={26} color={BRAND} />
        </TouchableOpacity>
        <View style={s.navCenter}>
          <Text style={s.navTitle}>Change Password</Text>
          <Text style={s.navSub}>Update your account password</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <ScrollableView contentContainerStyle={s.scroll}>

        {/* Info banner */}
        <View style={[s.infoCard, IOS_SHADOW]}>
          <MaterialCommunityIcons name="shield-lock-outline" size={20} color={BLUE} />
          <Text style={s.infoText}>
            Complete the fields below to change your password. Use at least 8 characters.
          </Text>
        </View>

        {/* Form card */}
        <View style={[s.formCard, IOS_SHADOW]}>
          <Controller
            control={control} name="current_password"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Current Password"
                secureTextEntry={currentPasswordVisible}
                onBlur={onBlur} value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message} mode="outlined"
                left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setCurrentPasswordVisible(prev => !prev)}
                    icon={currentPasswordVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                    color="#71717A" forceTextInputFocus={false}
                  />
                }
              />
            )}
          />
          <Controller
            control={control} name="password"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="New Password"
                secureTextEntry={passwordVisible}
                onBlur={onBlur} value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message} mode="outlined"
                left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordVisible(prev => !prev)}
                    icon={passwordVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                    color="#71717A" forceTextInputFocus={false}
                  />
                }
              />
            )}
          />
          <Controller
            control={control} name="password_confirmation"
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <CustomTextInput
                label="Confirm New Password"
                secureTextEntry={passwordConfirmationVisible}
                onBlur={onBlur} value={value} onChangeText={onChange}
                error={!!error} errorMessage={error?.message} mode="outlined"
                left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                right={
                  <TextInput.Icon
                    onPress={() => setPasswordConfirmationVisible(prev => !prev)}
                    icon={passwordConfirmationVisible ? "eye-off-outline" : (props) => <EyeOpen {...props} />}
                    color="#71717A" forceTextInputFocus={false}
                  />
                }
              />
            )}
          />
        </View>

        {/* Forgot link */}
        <TouchableOpacity style={s.forgotLink} onPress={handlePasswordResetNavigation} activeOpacity={0.7}>
          <Text style={s.forgotText}>Forgot Current Password?</Text>
        </TouchableOpacity>

        {/* Submit */}
        <Button
          style={s.submitBtn}
          contentStyle={s.submitBtnContent}
          disabled={isProcessing}
          onPress={onSubmit}
          mode="contained">
          <Text style={s.submitBtnText}>Reset Password</Text>
        </Button>
      </ScrollableView>

      <PleaseWaitModal visible={isProcessing} />
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1, backgroundColor: BG },
  navBar:           { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, backgroundColor: SURFACE, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: SEPARATOR },
  backBtn:          { width: 36, height: 36, borderRadius: 18, backgroundColor: BLUE_LIGHT, justifyContent: "center", alignItems: "center" },
  navCenter:        { flex: 1, alignItems: "center" },
  navTitle:         { fontSize: 16, fontWeight: "700", color: BRAND, letterSpacing: -0.3 },
  navSub:           { fontSize: 11, color: SUBLABEL, marginTop: 1 },
  scroll:           { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  infoCard:         { flexDirection: "row", alignItems: "flex-start", gap: 12, backgroundColor: BLUE_LIGHT, borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: StyleSheet.hairlineWidth, borderColor: "#BFDBFE" },
  infoText:         { flex: 1, fontSize: 13, color: "#374151", lineHeight: 19 },
  formCard:         { backgroundColor: SURFACE, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, borderColor: SEPARATOR, padding: 14, marginBottom: 4, gap: 4 },
  forgotLink:       { alignItems: "center", marginTop: 18, marginBottom: 10 },
  forgotText:       { fontSize: 14, fontWeight: "700", color: BLUE },
  submitBtn:        { borderRadius: 14, marginTop: 8 },
  submitBtnContent: { paddingVertical: 7 },
  submitBtnText:    { color: SURFACE, fontSize: 15, fontWeight: "700" },
});
