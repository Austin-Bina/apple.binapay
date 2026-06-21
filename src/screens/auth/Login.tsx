import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import tw from "@lib/tailwind";
import CustomTextInput from "@components/ui/form/TextInput";
import { AuthStackScreenProps } from "@navigators/types";
import { StackActions } from "@react-navigation/native";
import { Controller, useForm } from "react-hook-form";
import Screen from "@components/ui/shared/Screen";
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

  const isLoggingIn = useTypedSelector(selectIsLoggingIn);
  const dispatch = useTypedDispatch();

  const { control, setError, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    dispatch(authSliceActions.resetAuth());
  }, [dispatch]);

  const onSubmit = handleSubmit(async function (values) {
    try {
      setHasError(false);

      //await dispatch(authSliceActions.doLogin(values)).unwrap();
     await dispatch(authSliceActions.doLogin(values)).unwrap();

// Ask permission + get token
const token = await registerForPushNotifications();

// Save token
if (token) {
  await syncPushToken(token);
}


    } catch (error) {
      const { errors } = error as any;

      if (errors) {
        if (errors) {
          for (const [field, fieldErrors] of Object.entries(errors)) {
            if (Array.isArray(fieldErrors)) {
              setError(field as keyof FormValues, {
                message: fieldErrors.join(", "),
              });
            }
          }
        }

        return;
      }

      setHasError(true);
    }
  });

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`py-5 px-4 justify-between`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Welcome Back to BinaPay</Text>
          <Text style={tw`w-full mb-[30px] text-gray-500 text-base font-normal leading-snug`}>
            Log in to your account to continue.
          </Text>

          {hasError && (
            <View style={tw`mb-3`}>
              <Banner title="Failed to connect" content="Something went wrong. Please try again." />
            </View>
          )}

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
          <Text
            onPress={() => {
              navigation.dispatch(
                StackActions.push("Forgot Password", {
                  email: "",
                }),
              );
            }}
            style={tw`text-primary text-sm text-center my-5`}>
            Forgot Password?
          </Text>
          <View style={tw`flex flex-row items-center justify-center mb-10 gap-2`}>
            <Text style={tw`text-gray-700`}>New to BinaPay?</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Register", { screen: "Start" });
              }}>
              <Text style={tw`text-primary`}>Create an account here</Text>
            </TouchableOpacity>
          </View>
        </View>
        <CustomButton disabled={isLoggingIn} onPress={onSubmit}>
          Login
        </CustomButton>
      </ScrollableView>
      <PleaseWaitModal visible={isLoggingIn} />
    </Screen>
  );
};

export default LoginScreen;
