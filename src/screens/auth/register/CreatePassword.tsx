import { View } from "react-native";
import React, { useState } from "react";
import tw from "twrnc";
import CustomTextInput from "@components/form/TextInput";
import { Button, Text, TextInput } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import * as Yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import Screen from "@components/shared/Screen";
import PleaseWaitModal from "@components/modals/PleaseWaitModal";

type ResetPasswordProps = RegistrationStackScreenProps<"Create Password">;

const schema = Yup.object().shape({
  password: Yup.string().min(8, "Too short!").required("Required").trim(),
  password_confirmation: Yup.string()
    .required("Required")
    .trim()
    .oneOf([Yup.ref("password")], "passwords must match"),
});

const CreatePassword: React.FC<ResetPasswordProps> = (props) => {
  const [passwordVisible, setPasswordVisible] = useState(true);
  const [passwordConfirmationVisible, setPasswordConfirmationVisible] =
    useState(true);
  const [fetching, setFetching] = useState(false);

  const isLoggedOut = true;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      password: "password",
      password_confirmation: "password",
    },
    resolver: yupResolver(schema),
  });

  const onSubmit = handleSubmit((data) => {
    props.navigation.navigate("Create Transaction Pin");
  });

  return (
    <Screen>
      <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            Create Password
          </Text>
          <Text
            style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}
          >
            Create password to secure your account.
          </Text>

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

        <Button
          style={tw`mt-auto mb-[30px] px-2 py-2 w-full rounded-full`}
          disabled={fetching}
          onPress={onSubmit}
          mode="contained"
        >
          <Text style={tw`text-white text-center text-base font-bold`}>
            Continue
          </Text>
        </Button>
      </View>
      <PleaseWaitModal visible={fetching} />
    </Screen>
  );
};

export default CreatePassword;
