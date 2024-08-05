import { Animated, Dimensions, ImageBackground, View } from "react-native";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { HomeStackScreenProps } from "@navigators/types";
import React, { useState, useRef, useEffect } from "react";
import { Button, IconButton, SegmentedButtons, Text } from "react-native-paper";
import * as Clipboard from 'expo-clipboard';
import { Image } from "react-native-element-image";
import Banner from "@components/ui/banner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import NairaInput from "@components/ui/form/NairaInput";
import { scale } from "react-native-size-matters";

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
          density="regular"
          buttons={[
            {
              value: "bank",
              label: "Bank",
            },
            {
              value: "card",
              label: "Card",
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

const schema = z.object({
  amount: z.string(),
});

const CardView: React.FC<CardViewProps> = ({ navigation }) => {
  const { control, watch, setValue, handleSubmit } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "5000",
    },
  });
  const values = watch();
  const onSubmit = () => {
    navigation.navigate("Card Details");
  };

  return (
    <View>
      <Text variant="titleLarge" style={tw`text-gray-800 mb-2 font-bold`}>
        Fund with Card
      </Text>
      <Text variant="bodyMedium" style={tw`text-gray-400`}>
        Use your card to conveniently add funds to your BinaPay wallet.
      </Text>
      <Banner
        style={tw`mt-6`}
        message="Funding wallet with card attracts additional charges of 4% only."
      />
      <View>
        <NairaInput name="amount" control={control} />
        <View
          style={tw`bg-green-50 mt-4 flex-row justify-center items-center p-2.5 rounded-xl gap-1 w-full`}
        >
          <Text
            variant="bodyMedium"
            style={tw`text-green-600 text-center font-bold`}
          >
            You get ₦{values.amount}
          </Text>
        </View>
      </View>
      <Button
        style={tw`mt-10 mb-[30px] w-full rounded-full`}
        contentStyle={tw`py-2`}
        onPress={onSubmit}
        mode="contained"
      >
        <Text style={tw`text-white text-center text-base font-bold`}>
          Continue
        </Text>
      </Button>

      <Image
        source={require("@assets/images/secured-by-paystack.png")}
        width={scale(deviceWidth - 200)}
        style={tw`mx-auto`}
      />
    </View>
  );
};

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

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(accountNumber);
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
