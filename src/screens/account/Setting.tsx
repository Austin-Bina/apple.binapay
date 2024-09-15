import Screen from "@components/ui/shared/Screen";
import tw from "@lib/tailwind";
import React, { Fragment } from "react";
import { Linking, View } from "react-native";
import { Appbar, Avatar, Divider, Text, TouchableRipple } from "react-native-paper";
import { SvgProps } from "react-native-svg";
import AngledRightArrow from "@assets/icons/angled-right-arrow.svg";
import SpeechBubbleIcon from "@assets/icons/speech-bubble-check.svg";
import KeyIcon from "@assets/icons/key.svg";
import SupportIcon from "@assets/icons/support-head.svg";
import PrivacyIcon from "@assets/icons/privacy.svg";
import LogoutIcon from "@assets/icons/logout.svg";
import { Colors } from "@constants/theme";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { AccountStackScreenProps } from "@navigators/types";
import { authSliceActions } from "@store/slice/auth";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectIsLoggingIn, selectUser } from "@store/selectors/auth";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { AvatarImage } from "@components/avatar";
import { scale } from "react-native-size-matters";

type Props = AccountStackScreenProps<"Settings">;

export default function SettingScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const isLoggingIn = useTypedSelector(selectIsLoggingIn);
  const dispatch = useTypedDispatch();

  const handleLogout = () => {
    dispatch(authSliceActions.doLogout());
  };

  return (
    <Screen>
      <Appbar.Header style={tw`bg-white`}>
        <Appbar.Content title="Menu" titleStyle={tw`font-bold`} />
      </Appbar.Header>
      <ScrollableView>
        <TouchableRipple
          style={tw`px-4 mb-10`}
          onPress={() => {
            navigation.navigate("Profile");
          }}>
          <Fragment>
            <View style={tw`flex-row items-center justify-between py-3.5`}>
              <View style={tw`flex-row items-center gap-2.5`}>
                <AvatarImage avatar={user?.avatar} size={scale(60)} svgProps={{ width: scale(60), height: scale(60) }} />
                <View>
                  <Text variant="titleMedium">{user?.name}</Text>
                  <Text variant="bodySmall">Personal Information</Text>
                </View>
              </View>
              <AngledRightArrow width={36} />
            </View>
            <Divider />
          </Fragment>
        </TouchableRipple>
        <Action
          title="Verification"
          ItemIcon={SpeechBubbleIcon}
          onPress={() => {}}
          badgeElement={
            <View style={tw`bg-secondary-50 rounded-full py-1 px-5`}>
              <Text style={tw`text-secondary-500 text-xs font-medium`}>Upgrade to Tier 2</Text>
            </View>
          }
        />
        <Action
          title="Change Password"
          ItemIcon={KeyIcon}
          onPress={() => {
            navigation.navigate("Change Password");
          }}
        />
        <Action
          title="Help & Support"
          ItemIcon={SupportIcon}
          onPress={() => {
            Linking.openURL("https://binapay.co/help");
          }}
        />
        <Action
          title="Privacy Policy"
          ItemIcon={PrivacyIcon}
          onPress={() => {
            Linking.openURL("https://binapay.co/privacy");
          }}
        />
        <View style={tw`my-5`} />
        <Action title="Logout" backgroundColor="#FEF2F2" ItemIcon={LogoutIcon} onPress={handleLogout} />
        <Text variant="bodyMedium" style={tw`text-gray-400 text-center mt-10`}>
          BinaPay v1.0.0.0
        </Text>
      </ScrollableView>
      <PleaseWaitModal visible={isLoggingIn} />
    </Screen>
  );
}

interface ActionProps {
  onPress: () => void;
  title: string;
  ItemIcon: React.FC<SvgProps>;
  badgeElement?: React.ReactNode;
  backgroundColor?: string;
}
const Action = ({ onPress, title, ItemIcon, badgeElement, backgroundColor = Colors.primary[50] }: ActionProps) => {
  return (
    <TouchableRipple onPress={onPress} style={tw`my-1`}>
      <View style={tw`flex-row justify-between items-center px-4 my-1`}>
        <View style={tw`flex-row items-center gap-3`}>
          <View
            style={[
              tw`justify-center h-12 w-12 items-center p-4 bg-primary-50 rounded-full`,
              {
                backgroundColor,
              },
            ]}>
            <ItemIcon width={24} height={24} />
          </View>
          <Text style={tw`text-base font-medium`}>{title}</Text>
        </View>
        <View style={tw`flex-row items-center`}>
          {badgeElement}
          <AngledRightArrow width={20} />
        </View>
      </View>
    </TouchableRipple>
  );
};
