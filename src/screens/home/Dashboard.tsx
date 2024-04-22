import React, { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { StackActions } from "@react-navigation/native";
import Screen from "@components/shared/Screen";
import { Appbar, Avatar, Button, Card, IconButton } from "react-native-paper";
import { HomeStackScreenProps, TabNavScreenProps } from "@navigators/types";
import ScrollableView from "@components/shared/ScrollableView";
import tw from "@lib/tailwind";
import IconButtonWithLabel from "@components/button/IconButtonWithLabel";
import PhoneIcon from "@assets/icons/phone.svg";
import WifiIcon from "@assets/icons/wifi.svg";
import ZapIcon from "@assets/icons/lightning.svg";
import MoreIcon from "@assets/icons/three-dots-horizontal.svg";
import ArrowRight from "@assets/icons/arrow-right.svg";
import SadFaceIcon from "@assets/icons/sad-face.svg";
import { Colors } from "@constants/theme";
import UserAppbar from "@components/UserAppbar";
import { getNavigate } from "@utils/navigation";

const TransactionEmptyState = () => {
  return (
    <Card mode="contained" style={tw`bg-transparent`}>
      <Card.Content style={tw`items-center`}>
        <View
          style={tw`justify-center h-16 w-16 items-center p-4 bg-secondary-50 rounded-3xl`}
        >
          <SadFaceIcon fill={Colors.secondary[500]} width={30} height={30} />
        </View>
        <Text style={tw`font-medium text-lg text-gray-500 text-center`}>
          No Transactions!
        </Text>
        <Text style={tw`text-xs text-gray-400 text-center`}>
          No recent transactions. Your financial world is quiet at the moment.
        </Text>
      </Card.Content>
    </Card>
  );
};
const HomeScreen: React.FC<HomeStackScreenProps<"Dashboard">> = ({
  navigation,
}) => {
  const [balanceVisible, setBalanceVisible] = useState(true);

  const toggleBalance = () => setBalanceVisible(!balanceVisible);

  return (
    <Screen style={tw`pt-0`}>
      <UserAppbar />
      <ScrollableView style={tw`px-3 flex flex-1 py-6`}>
        {/* Balance */}
        <View>
          <Card mode="contained" style={tw`bg-primary-50 py-2`}>
            <Card.Content style={tw`items-center`}>
              <View style={tw`flex-row justify-center items-center`}>
                <Text style={tw`text-gray-900 font-bold text-xl text-center`}>
                  {balanceVisible ? "₦20,000.00" : "₦****.**"}
                </Text>
                <IconButton
                  icon={balanceVisible ? "eye-off-outline" : "eye-outline"}
                  onPress={toggleBalance}
                />
              </View>
              <Text style={tw`text-center text-gray-400`}>Current Balance</Text>
              <Button
                icon="wallet"
                mode="outlined"
                style={tw`border-primary mt-2`}
                onPress={() => {
                  navigation.navigate("Add Money");
                }}
              >
                Fund Wallet
              </Button>
            </Card.Content>
          </Card>
        </View>
        {/* Services */}
        <View style={tw`my-6`}>
          <Text style={tw`text-base font-medium text-gray-600 mb-3.5`}>
            Services
          </Text>
          <View style={tw`flex-row justify-around`}>
            <IconButtonWithLabel
              RenderIcon={PhoneIcon}
              size={24}
              label="Airtime+Purchase"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Airtime Purchase",
                  },
                });
              }}
            />
            <IconButtonWithLabel
              RenderIcon={WifiIcon}
              size={24}
              label="Data+Bundle"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Data Purchase",
                  },
                });
              }}
            />
            <IconButtonWithLabel
              RenderIcon={ZapIcon}
              size={24}
              label="Electricity"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "Electricity Bill",
                  },
                });
              }}
            />
            <IconButtonWithLabel
              RenderIcon={MoreIcon}
              size={24}
              label="Explore+More"
              onPress={async () => {
                const { navigate } = await getNavigate();
                navigate("Main", {
                  screen: "Services",
                  params: {
                    screen: "List",
                  },
                });
              }}
            />
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={tw`mt-8`}>
          <View style={tw`flex-row justify-between items-center mb-10`}>
            <Text style={tw`text-base font-medium text-gray-600`}>
              Recent Transactions
            </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.navigate("Transaction History");
              }}
            >
              <View style={tw`flex-row items-center gap-1`}>
                <Text style={tw`text-primary text-xs`}>See More</Text>
                <ArrowRight width={20} />
              </View>
            </TouchableOpacity>
          </View>
          <TransactionEmptyState />
        </View>
      </ScrollableView>
    </Screen>
  );
};

export default HomeScreen;
