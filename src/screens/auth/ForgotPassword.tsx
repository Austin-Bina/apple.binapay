import { TouchableOpacity, View } from "react-native";
import React, { useState } from "react";
import tw from "@lib/tailwind";
import { Button, Text } from "react-native-paper";
import { StackScreenProps } from "@navigators/types";
import { Controller, useForm } from "react-hook-form";
import Screen from "@components/ui/shared/Screen";
import CustomTextInput from "@components/ui/form/TextInput";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
});

const ForgetPassword: React.FC<StackScreenProps<"Forgot Password">> = ({
  navigation,
  route,
}) => {
  const [fetching, setFetching] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: route.params.email,
    },
  });

  const onSubmit = handleSubmit(async function (values) {
    console.log(values);
    navigation.navigate("One Time Password", { email: values.email });
  });

  return (
    <Screen>
      <View style={tw`flex flex-col px-4 pt-10 justify-between h-full`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            Forgot Your Password?
          </Text>
          <Text
            style={tw`w-full text-gray-500 text-base font-normal leading-snug mb-10`}
          >
            Enter your registered email address to receive a password reset
            link.
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
          <View
            style={tw`flex flex-row items-center justify-center mb-10 gap-2`}
          >
            <Text style={tw`text-gray-700`}>Remember your login details?</Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Auth", { screen: "Login" });
              }}
            >
              <Text style={tw`text-primary`}>Log in here</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Button
          style={tw`mt-auto mb-[30px] w-full rounded-full`}
          contentStyle={tw`p-2`}
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

export default ForgetPassword;
