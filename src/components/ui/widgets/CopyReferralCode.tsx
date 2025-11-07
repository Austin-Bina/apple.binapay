import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import * as Clipboard from "expo-clipboard";
import React, { Fragment, useState } from "react";
import { View } from "react-native";
import { Text, TouchableRipple, IconButton } from "react-native-paper";

interface Props {
  referralCode: string;
  labelText?: string;
}

const CopyReferralCode: React.FC<Props> = ({ referralCode, labelText = "Tap to copy referral code" }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
  <TouchableRipple
    onPress={copyToClipboard}
    style={tw`self-center flex-row items-center gap-2 px-3 py-1 rounded-full border border-gray-300 bg-gray-50`}
  >
    <Fragment>
      <Text style={tw`text-sm font-medium text-gray-700`}>{referralCode}</Text>
      <IconButton
        icon={copied ? "check" : "content-copy"}
       iconColor={copied ? Colors.gray[50] : Colors.primary[600]}
       style={tw`m-0 bg-primary-100 rounded-full`}
        size={18}
      />
    </Fragment>
  </TouchableRipple>
);

/**
 * justice version
 *//*
  return (
    <View style={tw`my-5 py-2 rounded-2xl border border-gray-100`}>
      <Text variant="headlineMedium" style={tw`text-center my-0 py-0`}>
        {referralCode}
      </Text>
      <TouchableRipple onPress={copyToClipboard} style={tw`flex-row items-center justify-center`}>
        <Fragment>
          <Text variant="bodySmall" style={tw`text-gray-400 -mr-1`}>
            {labelText}
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

  */
};

export default CopyReferralCode;
