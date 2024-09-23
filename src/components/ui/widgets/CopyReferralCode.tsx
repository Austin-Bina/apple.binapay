import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import * as Clipboard from 'expo-clipboard';
import React, { Fragment, useState } from "react";
import { View } from "react-native";
import { Text, TouchableRipple, IconButton } from "react-native-paper";

interface Props {
  referralCode: string;
}

const CopyReferralCode: React.FC<Props> = ({ referralCode }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View style={tw`my-5 py-2 rounded-2xl border border-gray-100`}>
      <Text variant="headlineMedium" style={tw`text-center my-0 py-0`}>
        {referralCode}
      </Text>
      <TouchableRipple
        onPress={copyToClipboard}
        style={tw`flex-row items-center justify-center`}
      >
        <Fragment>
          <Text variant="bodySmall" style={tw`text-gray-400 -mr-1`}>
            Tap to copy referral code
          </Text>
          <IconButton
            icon={copied ? "sticker-check" : "content-copy"}
            iconColor={Colors.primary[600]}
            style={tw`my-0`}
          />
        </Fragment>
      </TouchableRipple>
    </View>
  );
};

export default CopyReferralCode;
