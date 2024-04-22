import { Animated, Dimensions, ImageBackground, View } from "react-native";
import Screen from "@components/shared/Screen";
import ScrollableView from "@components/shared/ScrollableView";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import React, { useState, useRef, useEffect } from "react";
import {
  Button,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
} from "react-native-paper";
import InfoIcon from "@assets/icons/info.svg";
import Clipboard from "@react-native-clipboard/clipboard";
import { Image } from "react-native-element-image";
import CustomTextInput from "@components/form/TextInput";

type Props = HomeStackScreenProps<"Add Money">;
const deviceWidth = Dimensions.get("window").width;

export default function AddMoneyScreen(props: Props) {
  const [value, setValue] = useState("bank");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Screen>
      <ScrollableView style={tw`pt-10`}>
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          buttons={[
            {
              value: "bank",
              label: "Bank",
              style: tw`py-2 rounded-full border border-gray-200`,
            },
            {
              value: "card",
              label: "Card",
              style: tw`py-2 rounded-full border border-gray-200`,
            },
          ]}
          theme={{
            colors: {
              secondaryContainer: Colors.gray[700],
              onSecondaryContainer: "white",
            },
          }}
          style={tw`px-4`}
        />
        <Animated.View
          style={{
            ...tw`px-4 py-8`,
            opacity: fadeAnim,
          }}
        >
          {value === "bank" ? <BankView /> : <CardView {...props} />}
        </Animated.View>
      </ScrollableView>
    </Screen>
  );
}

const BankView = () => (
  <View>
    <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
      Fund with Bank Transfer
    </Text>
    <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
      Transfer the desired amount to the following bank account. Once the
      transfer is complete, your BinaPay wallet will be credited
    </Text>
    <Banner message="Automated bank transfer attracts additional charges of 4% only." />
    <View>
      <ImageBackground
        source={require("@assets/images/card-background-waves.png")}
        style={tw`bg-primary-900 p-4 rounded-lg shadow-xl shadow-primary/20 mt-4`}
      >
        <BankCard
          accountName="Abdul Godswill"
          bankName="Wema Bank"
          accountNumber="0176823456"
        />
      </ImageBackground>
    </View>
    <View>
      <ImageBackground
        source={require("@assets/images/card-background-waves.png")}
        style={tw`bg-primary-900 p-4 rounded-lg shadow-xl shadow-primary/20 mt-4`}
      >
        <BankCard
          accountName="Abdul Godswill"
          bankName="Money Point"
          accountNumber="0176823456"
        />
      </ImageBackground>
    </View>
  </View>
);

type CardViewProps = HomeStackScreenProps<"Add Money">;

const CardView: React.FC<CardViewProps> = ({ navigation }) => {
  const [amount, setAmount] = useState(5000);
  const calculatedAmount = amount - amount * 0.04;

  const onSubmit = () => {
    navigation.navigate("Card Details");
  };

  return (
    <View>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
        Fund with Card
      </Text>
      <Text variant="bodyMedium" style={tw`text-gray-400 mb-6`}>
        Use your card to conveniently add funds to your BinaPay wallet.
      </Text>
      <Banner message="Funding wallet with card attracts additional charges of 4% only." />

      <View>
        <TextInput
          style={tw`text-center w-full bg-white my-5`}
          contentStyle={tw`font-bold text-2xl text-gray-700`}
          outlineStyle={tw.style(
            "rounded-2xl",
            false ? "border-red-500" : "border-gray-300"
          )}
          onChangeText={(value) => {
            const number = Number.parseFloat(value.replace("₦", "")) || 0;
            setAmount(number);
          }}
          mode="outlined"
          value={`₦${amount.toFixed(2)}`}
          keyboardType="numeric"
        />

        <View
          style={tw`bg-green-50 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full`}
        >
          <Text
            variant="bodyMedium"
            style={tw`text-green-600 text-center font-bold`}
          >
            You get ₦{calculatedAmount.toFixed(2)}
          </Text>
        </View>
      </View>
      <Button
        style={tw`mt-10 mb-[30px] px-2 py-2 w-full rounded-full`}
        onPress={onSubmit}
        mode="contained"
      >
        <Text style={tw`text-white text-center text-base font-bold`}>
          Continue
        </Text>
      </Button>

      <Image
        source={require("@assets/images/secured-by-paystack.png")}
        width={deviceWidth - 200}
        style={tw`mx-auto`}
      />
    </View>
  );
};

interface BannerProps {
  message: string;
}
const Banner: React.FC<BannerProps> = ({ message }) => (
  <View
    style={tw`bg-secondary-50 flex-row items-center p-2.5 rounded-xl gap-1 w-full`}
  >
    <InfoIcon width={24} height={24} />
    <Text variant="bodySmall" style={tw`text-secondary-500 w-11/12`}>
      {message}
    </Text>
  </View>
);

interface BankCardProps {
  accountName: string;
  bankName: string;
  accountNumber: string;
}

const BankCard: React.FC<BankCardProps> = ({
  accountName,
  bankName,
  accountNumber,
}) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    Clipboard.setString(accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View>
      <View style={tw`flex-row justify-between`}>
        <Text style={tw`text-white`}>Account Name</Text>
        <Text style={tw`text-base font-bold text-white`}>{accountName}</Text>
      </View>
      <View style={tw`flex-row justify-between`}>
        <Text style={tw`text-white`}>Bank Name</Text>
        <Text style={tw`text-base font-bold text-white`}>{bankName}</Text>
      </View>
      <View style={tw`flex-row items-center justify-between`}>
        <Text style={tw`text-white`}>Account Number</Text>
        <View style={tw`flex-row font-bold items-center`}>
          <Text style={tw`text-base text-white`}>{accountNumber}</Text>
          <IconButton
            onPress={copyToClipboard}
            icon={copied ? "sticker-check" : "content-copy"}
            iconColor="white"
          />
        </View>
      </View>
    </View>
  );
};
