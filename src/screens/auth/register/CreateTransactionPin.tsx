import React, { useState, useEffect } from "react";
import { View, Text } from "react-native";
import { Button, HelperText } from "react-native-paper";
import {
  RegistrationStackScreenProps,
  StackScreenProps,
} from "@navigators/types";
import tw from "@lib/tailwind";
import Screen from "@components/ui/shared/Screen";
import OtpInput from "@components/ui/form/OtpInput";
import { Colors } from "@constants/theme";

type Props = RegistrationStackScreenProps<"Create Transaction Pin">;

const maximumLength = 4;

const CreateTransactionPin: React.FC<Props> = (props) => {
  const params = props.route.params;

  const [token, setToken] = useState("1234");
  const [pinReady, setPinReady] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    setPinReady(token.length === maximumLength);
  }, [token]);

  const onSubmit = () => {
    props.navigation.navigate("Choose Avatar");
  };

  return (
    <Screen>
      <View style={tw`flex flex-col justify-between h-full px-4 pt-10`}>
        <View>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>
            Set Your Transaction PIN
          </Text>
          <Text style={tw`w-full mb-10 text-gray-500 font-normal`}>
            Secure your transactions with a 4-digit PIN. Choose a PIN that is
            easy for you to remember but hard for others to guess.
          </Text>
          <View style={tw`mb-10`}>
            <View style={tw`flex flex-row items-center justify-center`}>
              <OtpInput
                code={token}
                maximumLength={maximumLength}
                setCode={setToken}
              />
            </View>
          </View>
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

export default CreateTransactionPin;
