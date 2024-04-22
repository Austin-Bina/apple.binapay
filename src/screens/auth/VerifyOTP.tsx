import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Button, HelperText } from "react-native-paper";
import {
  RegistrationStackScreenProps,
  StackScreenProps,
} from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/shared/Screen";
import OtpInput from "@components/form/OtpInput";
import { Colors } from "@constants/theme";

type Props = StackScreenProps<"One Time Password">;

const maximumLength = 6;

const VerifyOTPScreen: React.FC<Props> = (props) => {
  const params = props.route.params;

  const [token, setToken] = useState("");
  const [pinReady, setPinReady] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setPinReady(token.length === maximumLength);
  }, [token]);

  const onSubmit = () => {
    props.navigation.navigate("Reset Password", { email: params.email });
  };

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-10`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            Verify Your Email Address
          </Text>
          <Text
            style={tw`w-full mb-10 text-gray-500 text-base font-normal leading-snug`}
          >
            A verification code has been sent to your email. Please enter it
            below to verify your email address.
          </Text>
          <View style={tw`mb-10`}>
            <View style={tw`flex flex-row items-center justify-center`}>
              <OtpInput
                code={token}
                maximumLength={maximumLength}
                setCode={setToken}
              />
            </View>
            <HelperText type="error" style={tw`text-left`}>
              Please enter a valid OTP
            </HelperText>
          </View>
        </View>
        <Text style={tw`text-sm text-center`}>
          Resend the OTP in <Text style={tw`text-primary`}>10 Sec</Text>
        </Text>
        <View>
          <Button
            style={tw`flex items-center mb-4 justify-center py-2 w-full rounded-[94px]`}
            loading={fetching}
            mode="contained"
            disabled={!pinReady || fetching}
            onPress={onSubmit}
          >
            Continue
          </Button>
          <Button
            style={tw`flex items-center mb-[30px] justify-center py-2 w-full rounded-[94px]`}
            loading={fetching}
            mode="outlined"
            textColor={Colors.gray[500]}
            onPress={() => {}}
          >
            Resend OTP
          </Button>
        </View>
      </View>
    </Screen>
  );
};

export default VerifyOTPScreen;
