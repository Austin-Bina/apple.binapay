import { View } from "react-native";
import React, { useState } from "react";
import CustomTextInput from "@components/ui/form/TextInput";
import { Button, Text, TextInput } from "react-native-paper";
import { AccountStackScreenProps, StackScreenProps } from "@navigators/types";
import * as Yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Screen from "@components/ui/shared/Screen";
import PleaseWaitModal from "@components/ui/modals/PleaseWaitModal";
import { TouchableOpacity } from "react-native-gesture-handler";
import tw from "@lib/tailwind";
import ScrollableView from "@components/ui/shared/ScrollableView";

type ResetPasswordProps = AccountStackScreenProps<"Change Password">;

const schema = Yup.object().shape({
  current_password: Yup.string()
    .min(8, "Too short!")
    .required("Required")
    .trim(),
  password: Yup.string().min(8, "Too short!").required("Required").trim(),
  password_confirmation: Yup.string()
    .required("Required")
    .trim()
    .oneOf([Yup.ref("password")], "passwords must match"),
});

const ChangePassword: React.FC<ResetPasswordProps> = (props) => {
  const [currentPasswordVisible, setCurrentPasswordVisible] = useState(true);
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] =
    useState(true);
  const [fetching, setFetching] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      current_password: "password",
      password: "password",
      password_confirmation: "password",
    },
    resolver: yupResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    console.log(data);
    props.navigation.navigate("Settings");
  });

  return (
    <Screen>
      <ScrollableView>
        <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
          <View>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
              Change Password
            </Text>
            <Text
              style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}
            >
              Complete the fields below to change your password.
            </Text>

            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  label="Current Password"
                  secureTextEntry={currentPasswordVisible}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.current_password}
                  errorMessage={errors.current_password?.message}
                  mode="outlined"
                  left={<TextInput.Icon icon="lock-outline" color="#71717A" />}
                  right={
                    <TextInput.Icon
                      onPress={() => setCurrentPasswordVisible((prev) => !prev)}
                      icon={
                        currentPasswordVisible
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      color="#71717A"
                      forceTextInputFocus={false}
                    />
                  }
                />
              )}
              name="password"
            />
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  label="Password"
                  secureTextEntry={passwordVisible}
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.password}
                  errorMessage={errors.password?.message}
                  mode="outlined"
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
              name="password"
            />
            <Controller
              control={control}
              render={({ field: { onChange, onBlur, value } }) => (
                <CustomTextInput
                  label="Confirm Password"
                  onBlur={onBlur}
                  value={value}
                  onChangeText={onChange}
                  error={!!errors.password_confirmation}
                  errorMessage={errors.password_confirmation?.message}
                  secureTextEntry={passwordConfirmationVisible}
                  mode="outlined"
                  left={<TextInput.Icon icon="lock-outline" color="#71717A" />}
                  right={
                    <TextInput.Icon
                      onPress={() =>
                        setPasswordConfirmationVisible((prev) => !prev)
                      }
                      icon={
                        passwordConfirmationVisible
                          ? "eye-off-outline"
                          : "eye-outline"
                      }
                      color="#71717A"
                      forceTextInputFocus={false}
                    />
                  }
                />
              )}
              name="password_confirmation"
            />
          </View>

          <View style={tw`items-center my-10`}>
            <TouchableOpacity onPress={() => {}}>
              <Text
                variant="bodySmall"
                style={tw`text-primary font-bold text-center`}
              >
                Forgot Current Password?
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            style={tw`mt-auto mb-[30px] w-full rounded-full`}
            contentStyle={tw`p-2`}
            disabled={fetching}
            onPress={onSubmit}
            mode="contained"
          >
            <Text style={tw`text-white text-center text-base font-bold`}>
              Reset Password
            </Text>
          </Button>
        </View>
        <PleaseWaitModal visible={fetching} />
      </ScrollableView>
    </Screen>
  );
};

export default ChangePassword;
