import { View, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import React, { useState } from "react";
import { Text } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import CustomTextInput from "@components/ui/form/TextInput";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { StackActions } from "@react-navigation/native";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import API from "@lib/api";
import { route } from "@helpers/route";
import { AxiosError } from "axios";
import { showToast } from "@helpers/toast";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import MaskedInput from "@components/ui/form/mask-input";
import ScreenHeader from "@components/ui/shared/ScreenHeader";
import CustomButton from "@components/ui/form/button";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE  = "#2563EB";
const BRAND = "#1E3A8A";

const schema = z.object({
  name: z.string().min(3, "Name is too short").trim(),
  email: z
    .string()
    .email("Please enter a valid email")
    .trim()
    .transform((val) => val.toLowerCase()),
  referral_code: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const RegisterScreen: React.FC<RegistrationStackScreenProps<"Start">> = ({ navigation }) => {
  const [isLoading, setIsLoading] = useState(false);
  const insets = useSafeAreaInsets();

  const { control, setError, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", referral_code: "" },
  });

  const onSubmit = handleSubmit(async function (data) {
    setIsLoading(true);
    try {
      await API.post(route("auth.register"), data);
      navigation.navigate("Verify Email", { email: data.email });
    } catch (error) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response) {
        const { message, errors } = response.data;
        const hasAuthErrorMsg = message && typeof message === "string";
        if (hasAuthErrorMsg) {
          showToast({ message });
        } else {
          showToast({ message: "Something went wrong. Please try again." });
        }
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, { message: (fieldErrors as string[]).join(", ") });
            }
          }
        }
      }
      showToast({ message: "We could not reach our servers, please try this again." });
    } finally {
      setIsLoading(false);
    }
  });

  return (
    <View style={[s.root]}>
      <ScreenHeader
        title="Create Account"
        subtitle="Join BinaPay in a few quick steps"
        onBack={() => navigation.goBack()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollableView contentContainerStyle={s.scroll}>

          {/* Info card */}
          <View style={s.infoCard}>
            <Text style={s.infoText}>
              Fill in your details below to get started. All fields are required unless marked optional.
            </Text>
          </View>

          {/* Form card */}
          <View style={s.formCard}>
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomTextInput
                  label="Full name"
                  placeholder="John Doe"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                />
              )}
            />

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
              name="referral_code"
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <CustomTextInput
                  label="Referral Code (Optional)"
                  placeholder="X5ATNH24-WOODR"
                  mode="outlined"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!error}
                  errorMessage={error?.message}
                />
              )}
            />
          </View>

          {/* Login link */}
          <View style={s.loginRow}>
            <Text style={s.loginText}>Already a BinaPay User?</Text>
            <TouchableOpacity onPress={() => navigation.dispatch(StackActions.push("Auth", { screen: "Login" }))}>
              <Text style={s.loginLink}>Login here</Text>
            </TouchableOpacity>
          </View>

          {/* Terms */}
          <Text style={s.terms}>
            By registering, you accept BinaPay's{" "}
            <Text style={s.termsLink}>Terms & Conditions</Text> and{" "}
            <Text style={s.termsLink}>Privacy Policy</Text>.
            {" "}Your data will be securely encrypted.
          </Text>

        </ScrollableView>
      </KeyboardAvoidingView>

      {/* Footer button */}
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <CustomButton disabled={isLoading} onPress={onSubmit}>
          Continue
        </CustomButton>
      </View>

      <PleaseWaitModal visible={isLoading} />
    </View>
  );
};

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: "#f8f9fb" },
  scroll:    { padding: 16, paddingBottom: 100 },
  infoCard:  { backgroundColor: "#EEF3FF", borderRadius: 12, padding: 12, marginBottom: 16 },
  infoText:  { fontSize: 13, color: "#374151", lineHeight: 18 },
  formCard:  { backgroundColor: "#fff", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "#f0f0f0", marginBottom: 16, gap: 4 },
  loginRow:  { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 16 },
  loginText: { fontSize: 14, color: "#6b7280" },
  loginLink: { fontSize: 14, color: BLUE, fontWeight: "600" },
  terms:     { fontSize: 12, color: "#6b7280", textAlign: "center", lineHeight: 18, paddingHorizontal: 8 },
  termsLink: { color: BLUE, fontWeight: "500" },
  footer:    { paddingHorizontal: 16, paddingTop: 10, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#f0f0f0" },
});

export default RegisterScreen;
