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
import { showToast } from "@helpers/toast";
import { EyeOpen, PasswordLock } from "@components/icons/svg";

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
      await dispatch(authSliceActions.doLogin(values)).unwrap();
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

      showToast({ message: "Something went wrong. Please try again." });
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
                secureTextEntry={passwordVisible}
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
        <View style={tw`px-4 pb-4 pt-1`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            loading={isLoggingIn}
            disabled={isLoggingIn}
            mode="contained"
            onPress={onSubmit}>
            Login
          </Button>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isLoggingIn} />
    </Screen>
  );
};

export default LoginScreen;
