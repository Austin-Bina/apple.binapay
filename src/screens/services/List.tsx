import React, { useCallback, useMemo, useRef } from "react";
import IconButtonWithLabel from "@components/button/IconButtonWithLabel";
import Screen from "@components/shared/Screen";
import ScrollableView from "@components/shared/ScrollableView";
import UserAppbar from "@components/UserAppbar";
import tw from "@lib/tailwind";
import { ServicesStackScreenProps, TabNavScreenProps } from "@navigators/types";
import { Dimensions, View } from "react-native";
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
import BottomSheetModal from "@components/modals/BottomSheet/BottomSheet";
import { BottomSheetModalMethods } from "@gorhom/bottom-sheet/lib/typescript/types";
import { Image } from "react-native-element-image";
import { Button, Text } from "react-native-paper";

type Props = ServicesStackScreenProps<"List">;

const deviceHeight = Dimensions.get("window").height;
const deviceWidth = Dimensions.get("window").width;

export default function ListServicesScreen({ navigation }: Props) {
  const comingSoonSheet = useRef<BottomSheetModalMethods>(null);
  const attachmentActionModalSnapPoints = useMemo(
    () => [deviceHeight - 300, deviceHeight - 300],
    []
  );

  const openComingSoonModal = useCallback(() => {
    comingSoonSheet.current?.present();
  }, []);

  const closeComingSoonModal = useCallback(() => {
    comingSoonSheet.current?.dismiss();
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
            onPress={openComingSoonModal}
          />
        </View>
        <View style={tw`flex-row justify-around my-5`}>
          <IconButtonWithLabel
            RenderIcon={GraduationCapIcon}
            size={24}
            label="Education+Payments"
            onPress={openComingSoonModal}
          />
          <IconButtonWithLabel
            RenderIcon={BarCodeIcon}
            size={24}
            label="Airtime EPIN+Purchase & Printing"
            onPress={openComingSoonModal}
          />
          <IconButtonWithLabel
            RenderIcon={SwapIcon}
            size={24}
            label="Airtime Swap"
            onPress={openComingSoonModal}
          />
        </View>
        <View style={tw`flex-row justify-around my-5`}>
          <IconButtonWithLabel
            RenderIcon={AwardIcon}
            size={24}
            label="Get Reward+on BinaPay"
            onPress={openComingSoonModal}
          />
          <IconButtonWithLabel
            RenderIcon={TvIcon}
            size={24}
            label="TV+Subscription"
            onPress={openComingSoonModal}
          />
          <IconButtonWithLabel
            RenderIcon={AgentIcon}
            size={24}
            label="Agent"
            onPress={openComingSoonModal}
          />
        </View>
        <View style={tw`flex-row justify-around my-5`}>
          <IconButtonWithLabel
            RenderIcon={FlightIcon}
            size={24}
            label="Flight"
            onPress={openComingSoonModal}
          />
          <IconButtonWithLabel
            RenderIcon={GiftIcon}
            size={24}
            label="GiftCard"
            onPress={openComingSoonModal}
          />
          <IconButtonWithLabel
            RenderIcon={TicketIcon}
            size={24}
            label="Tickets"
            onPress={openComingSoonModal}
          />
        </View>
        <BottomSheetModal
          ref={comingSoonSheet}
          initialSnapPoints={attachmentActionModalSnapPoints}
          closeFilter={closeComingSoonModal}
          children={
            <View style={tw`flex-1 items-center px-2.5`}>
              <Image
                source={require("@assets/images/oops.png")}
                width={deviceWidth - 50}
                style={tw`mb-8`}
              />
              <Text variant="titleLarge" style={tw`font-bold mb-2`}>
                Service Coming Soon
              </Text>
              <Text
                variant="bodyMedium"
                style={tw`text-center text-gray-500 mb-10`}
              >
                This service is not available yet. We're actively working to add
                more features and services to improve your experience. Please
                check back later for updates.
              </Text>
              <Button
                mode="contained"
                onPress={closeComingSoonModal}
                style={tw`w-full py-2 rounded-full`}
              >
                Back
              </Button>
            </View>
          }
        />
      </ScrollableView>
    </Screen>
  );
}
