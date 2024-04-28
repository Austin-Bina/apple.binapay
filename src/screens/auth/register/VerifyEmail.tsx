import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Button } from "react-native-paper";
import { RegistrationStackScreenProps } from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import { Colors } from "@constants/theme";

type Props = RegistrationStackScreenProps<"Verify Email">;

const maximumLength = 6;

const VerifyEmail: React.FC<Props> = (props) => {
  const params = props.route.params;

  const [token, setToken] = useState("123456");
  const [pinReady, setPinReady] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setPinReady(token.length === maximumLength);
  }, [token]);

  const onSubmit = () => {
    props.navigation.navigate("Create Password");
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
            {/* <HelperText type="error" style={tw`text-left`}>
              Please enter a valid OTP
            </HelperText> */}
          </View>
          <Text style={tw`text-sm text-center`}>
            Resend the OTP in <Text style={tw`text-primary`}>10 Sec</Text>
          </Text>
        </View>

        <View style={tw`gap-4 mb-5`}>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2`}
            loading={fetching}
            mode="contained"
            disabled={!pinReady || fetching}
            onPress={onSubmit}
          >
            Continue
          </Button>
          <Button
            style={tw`w-full rounded-full`}
            contentStyle={tw`py-2 w-full`}
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

export default VerifyEmail;
