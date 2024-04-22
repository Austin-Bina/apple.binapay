import React, { useState } from "react";
import { TouchableOpacity, View } from "react-native";
import { Button, Text, TextInput } from "react-native-paper";
import tw from "@lib/tailwind";
import * as Yup from "yup";
import CustomTextInput from "@components/form/TextInput";
import { AuthStackScreenProps } from "@navigators/types";
import { StackActions } from "@react-navigation/native";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Screen from "@components/shared/Screen";
import ScrollableView from "@components/shared/ScrollableView";
import PleaseWaitModal from "@components/modals/PleaseWaitModal";
import { getNavigate } from "@utils/navigation";

const schema = Yup.object().shape({
  email: Yup.string().email("Invalid email").required("Required"),
  password: Yup.string().min(6, "Too short!").required("Required"),
});

const LoginScreen: React.FC<AuthStackScreenProps<"Login">> = ({
  navigation,
}) => {
  const [fetching, setFetching] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      email: 'ttebify@gmail.com',
      password: 'password',
    }
  });

  const onSubmit = handleSubmit(async function (values) {
    console.log(values);

    const { reset } = await getNavigate();
    reset({ routes: [{ name: "Main" }] });
  });

  return (
    <Screen>
      <ScrollableView style={tw`pt-10 px-4`}>
        <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
          Welcome Back to BinaPay
        </Text>
        <Text
          style={tw`w-full mb-[30px] text-gray-500 text-base font-normal leading-snug`}
        >
          Log in to your account to continue.
        </Text>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              label="Email Address"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!errors.email}
              errorMessage={errors.email?.message}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <CustomTextInput
              label="Password"
              mode="outlined"
              onBlur={onBlur}
              value={value}
              onChangeText={onChange}
              error={!!errors.password}
              errorMessage={errors.password?.message}
              secureTextEntry={passwordVisible}
              left={<TextInput.Icon icon="lock-outline" color="#71717A" />}
              right={
                <TextInput.Icon
                  onPress={() => setPasswordVisible((prev) => !prev)}
                  icon={passwordVisible ? "eye-off-outline" : "eye-outline"}
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
              StackActions.push("Forget Password", {
                email: "",
              })
            );
          }}
          style={tw`text-primary text-sm text-center my-5`}
        >
          Forgot Password?
        </Text>
        <View style={tw`flex flex-row items-center justify-center mb-10 gap-2`}>
          <Text style={tw`text-gray-700`}>New to BinaPay?</Text>
          <TouchableOpacity
            onPress={() => {
              navigation.navigate("Register", { screen: "Start" });
            }}
          >
            <Text style={tw`text-primary`}>Create an account here</Text>
          </TouchableOpacity>
        </View>
      </ScrollableView>
      <View style={tw`px-4 mb-[30px]`}>
        <Button
          style={tw`mt-auto px-2 py-2 w-full rounded-full`}
          loading={fetching}
          disabled={fetching}
          mode="contained"
          onPress={onSubmit}
        >
          <Text
            style={tw`text-white text-center text-base font-medium leading-normal`}
          >
            {fetching ? "Wait..." : "Login"}
          </Text>
        </Button>
      </View>
      <PleaseWaitModal visible={fetching} />
    </Screen>
  );
};

export default LoginScreen;
