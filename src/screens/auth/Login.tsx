import React, { useEffect, useState } from "react";
import { TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Text, TextInput } from "react-native-paper";
import CustomTextInput from "@components/ui/form/TextInput";
import { AuthStackScreenProps } from "@navigators/types";
import { StackActions } from "@react-navigation/native";
import { Controller, useForm } from "react-hook-form";
import ScrollableView from "@components/ui/shared/ScrollableView";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { authSliceActions } from "@store/slice/auth";
import { selectIsLoggingIn } from "@store/selectors/auth";
import { EyeOpen, PasswordLock } from "@components/icons/svg";
import Banner from "@components/ui/banner";
import CustomButton from "@components/ui/form/button";
import { registerForPushNotifications } from "@helpers/registerForPushNotifications";
import { syncPushToken } from "@helpers/syncPushToken";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BRAND = "#1E3A8A";
const BLUE  = "#2563EB";

const schema = z.object({
  email: z
    .string()
    .email("Please enter a valid email")
    .trim()
    .transform((val) => val.toLowerCase()),
  password: z.string().min(8, "Password too weak").trim(),
});

type FormValues = z.infer<typeof schema>;

const LoginScreen: React.FC<AuthStackScreenProps<"Login">> = ({ navigation }) => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [hasError, setHasError] = useState(false);
  const insets = useSafeAreaInsets();

  const isLoggingIn = useTypedSelector(selectIsLoggingIn);
  const dispatch = useTypedDispatch();

  const { control, setError, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    dispatch(authSliceActions.resetAuth());
  }, [dispatch]);

  const onSubmit = handleSubmit(async function (values) {
    try {
      setHasError(false);
      await dispatch(authSliceActions.doLogin(values)).unwrap();
      const token = await registerForPushNotifications();
      if (token) await syncPushToken(token);
    } catch (error) {
      const { errors } = error as any;
      if (errors) {
        for (const [field, fieldErrors] of Object.entries(errors)) {
          if (Array.isArray(fieldErrors)) {
            setError(field as keyof FormValues, { message: fieldErrors.join(", ") });
          }
        }
        return;
      }
      setHasError(true);
    }
  });

  return (
    <View style={[s.root]}>
      <ScreenHeader
        title="Welcome Back"
        subtitle="Log in to your BinaPay account"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollableView contentContainerStyle={s.scroll}>

          {hasError && (
            <View style={s.bannerWrap}>
              <Banner title="Failed to connect" content="Something went wrong. Please try again." />
            </View>
          )}

          {/* Info card */}
          <View style={s.infoCard}>
            <Text style={s.infoText}>
              Enter your registered email and password to access your account.
            </Text>
          </View>

          {/* Form card */}
          <View style={s.formCard}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomTextInput
                  label="Email Address"
                  placeholder="example@example.com"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  label="Password"
                  placeholder="••••••••"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  secureTextEntry={!passwordVisible}
                  left={<TextInput.Icon icon={(props) => <PasswordLock {...props} />} color="#71717A" />}
                  right={
                    <TextInput.Icon
                      onPress={() => setPasswordVisible((prev) => !prev)}
                      icon={passwordVisible ? (props) => <EyeOpen {...props} /> : "eye-off-outline"}
                      color="#71717A"
                      forceTextInputFocus={false}
                    />
                  }
                />
              )}
            />

            <TouchableOpacity
              onPress={() => navigation.dispatch(StackActions.push("Forgot Password", { email: "" }))}
              style={s.forgotWrap}
            >
              <Text style={s.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={s.registerRow}>
            <Text style={s.registerText}>New to BinaPay?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register", { screen: "Start" })}>
              <Text style={s.registerLink}>Create an account here</Text>
            </TouchableOpacity>
          </View>

        </ScrollableView>
      </KeyboardAvoidingView>

      {/* Footer button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <CustomButton disabled={isLoggingIn} onPress={onSubmit}>
          Login
        </CustomButton>
      </View>

      <PleaseWaitModal visible={isLoggingIn} />
    </View>
  );
};

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#f8f9fb" },
  scroll:      { padding: 16, paddingBottom: 100 },
  bannerWrap:  { marginBottom: 12 },
  infoCard:    { backgroundColor: "#EEF3FF", borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText:    { fontSize: 13, color: "#374151", lineHeight: 18 },
  formCard:    { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 16, gap: 4 },
  forgotWrap:  { alignItems: "center", marginTop: 8 },
  forgotText:  { fontSize: 13, color: BLUE, fontWeight: "600" },
  registerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  registerText:{ fontSize: 14, color: "#6b7280" },
  registerLink:{ fontSize: 14, color: BLUE, fontWeight: "600" },
  footer:      { paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
});

export default LoginScreen;
