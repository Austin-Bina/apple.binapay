import React, { useCallback, useRef } from "react";
import IconButtonWithLabel from "@components/ui/button";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import UserAppbar from "@components/UserAppbar";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps } from "@navigators/types";
import { View } from "react-native";
import PhoneIcon from "@assets/icons/phone.svg";
import WifiIcon from "@assets/icons/wifi.svg";
import ZapIcon from "@assets/icons/lightning.svg";
import GraduationCapIcon from "@assets/icons/graduation-cap.svg";
import BarCodeIcon from "@assets/icons/bar-code.svg";
import SwapIcon from "@assets/icons/swap.svg";
import AwardIcon from "@assets/icons/awards.svg";
import TvIcon from "@assets/icons/tv-screen.svg";
import AgentIcon from "@assets/icons/man-with-cap.svg";
import FlightIcon from "@assets/icons/flight.svg";
import GiftIcon from "@assets/icons/gift-box.svg";
import TicketIcon from "@assets/icons/tickets.svg";
import BottomSheetModal from "@components/ui/modals/BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";
import { getNavigate } from "@utils/navigation";
import { scale } from "react-native-size-matters";

type Props = ServicesStackScreenProps<"List">;

export default function ListServicesScreen({ navigation }: Props) {
  const bottomSheet = useRef<BottomSheetModalMethods>(null);

  const openBottomSheet = useCallback(() => {
    bottomSheet.current?.present();
  }, []);

  const closeBottomSheet = useCallback(() => {
    bottomSheet.current?.dismiss();
  }, []);

  return (
    <Screen>
      <UserAppbar />
      <ScrollableView style={tw`px-3 flex-1 py-6`}>
        <View style={tw`flex-row justify-around my-5`}>
          <IconButtonWithLabel
            RenderIcon={PhoneIcon}
            size={24}
            label="Airtime+Purchase"
            onPress={() => {
              navigation.navigate("Airtime Purchase");
            }}
          />
          <IconButtonWithLabel
            RenderIcon={WifiIcon}
            size={24}
            label="Data+Bundle"
            onPress={() => {
              navigation.navigate("Data Purchase");
            }}
          />
          <IconButtonWithLabel
            RenderIcon={ZapIcon}
            size={24}
            label="Electricity"
            onPress={() => {
              navigation.navigate("Electricity Bill");
            }}
          />
        </View>
        <View style={tw`flex-row justify-around my-5`}>
          <IconButtonWithLabel
            RenderIcon={TvIcon}
            size={24}
            label="TV+Subscription"
            onPress={() => {
              navigation.navigate("TV Subscription");
            }}
          />
          <IconButtonWithLabel
            RenderIcon={GraduationCapIcon}
            size={24}
            label="Education+Payments"
            onPress={() => {
              navigation.navigate("Education", {
                screen: "Select Educational Payment",
              });
            }}
          />
          <IconButtonWithLabel
            RenderIcon={BarCodeIcon}
            size={24}
            label="Airtime EPIN+Purchase & Printing"
            onPress={() => {
              navigation.navigate("Airtime EPIN Purchase");
            }}
          />
        </View>
        <View style={tw`flex-row justify-around my-5`}>
          <IconButtonWithLabel
            RenderIcon={AwardIcon}
            size={24}
            label="Get Reward+on BinaPay"
            onPress={async () => {
              const { navigate } = await getNavigate();
              navigate("Main", {
                screen: "Menu",
                params: {
                  screen: "BinaPay Rewards",
                },
              });
            }}
          />
          <IconButtonWithLabel
            RenderIcon={SwapIcon}
            size={24}
            label="Airtime Swap"
            onPress={openBottomSheet}
            isDisabled
          />
          <IconButtonWithLabel RenderIcon={AgentIcon} size={24} label="Agent" onPress={openBottomSheet} />
        </View>
        <View style={tw`flex-row justify-around my-5`}>
          <IconButtonWithLabel RenderIcon={FlightIcon} size={24} label="Flight" onPress={openBottomSheet} />
          <IconButtonWithLabel RenderIcon={GiftIcon} size={24} label="GiftCard" onPress={openBottomSheet} />
          <IconButtonWithLabel RenderIcon={TicketIcon} size={24} label="Tickets" onPress={openBottomSheet} />
        </View>
        <BottomSheetModal
          ref={bottomSheet}
          initialSnapPoints={["55%", "55%"]}
          closeFilter={closeBottomSheet}
          children={
            <View style={tw`flex-1 items-center px-2.5`}>
              <Image source={require("@assets/images/oops.png")} width={scale(240)} style={tw`mb-6`} />
              <Text variant="titleLarge" style={tw`font-bold mb-2`}>
                Service Coming Soon
              </Text>
              <Text variant="bodyMedium" style={tw`text-center text-gray-500 mb-10`}>
                This service is not available yet. We're actively working to add more features and services to improve
                your experience. Please check back later for updates.
              </Text>
              <Button
                mode="contained"
                onPress={closeBottomSheet}
                style={tw`w-full rounded-full`}
                contentStyle={tw`py-2`}>
                Back
              </Button>
            </View>
          }
        />
      </ScrollableView>
    </Screen>
  );
}
