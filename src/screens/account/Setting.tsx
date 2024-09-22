import Screen from "@components/ui/shared/Screen";
import tw from "@lib/tailwind";
import React, { Fragment } from "react";
import { Linking, View } from "react-native";
import { Appbar, Divider, Text, TouchableRipple } from "react-native-paper";
import AngledRightArrow from "@assets/icons/angled-right-arrow.svg";
import SpeechBubbleIcon from "@assets/icons/speech-bubble-check.svg";
import KeyIcon from "@assets/icons/key.svg";
import SupportIcon from "@assets/icons/support-head.svg";
import PrivacyIcon from "@assets/icons/privacy.svg";
import LogoutIcon from "@assets/icons/logout.svg";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { AccountStackScreenProps } from "@navigators/types";
import { authSliceActions } from "@store/slice/auth";
import { useTypedDispatch, useTypedSelector } from "@store/common";
import { selectIsLoggingIn, selectUser } from "@store/selectors/auth";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { AvatarImage } from "@components/avatar";
import { scale } from "react-native-size-matters";
import { SCREENS } from "@constants/screens";
import { Action } from "@components/screens/account";
import { AccountTier } from "@enum/user";

type Props = AccountStackScreenProps<"Settings">;

export default function SettingScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const isLoggingIn = useTypedSelector(selectIsLoggingIn);
  const dispatch = useTypedDispatch();

  const tier1 = user?.account_tier === AccountTier.Tier1;

  const verificationStatusText = tier1 ? "Upgrade to Tier 2" : "Verified";

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
                <AvatarImage
                  avatar={user?.avatar}
                  size={scale(60)}
                  svgProps={{ width: scale(60), height: scale(60) }}
                />
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
          onPress={() => {
            navigation.navigate(SCREENS.VERIFY_ACCOUNT, {
              screen: SCREENS.ACCOUNT_VERIFICATION_OPTIONS,
            });
          }}
          badgeElement={
            <View style={tw`bg-secondary-50 rounded-full py-1 px-5`}>
              <Text style={tw`text-secondary-500 text-xs font-medium`}>{verificationStatusText}</Text>
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
            navigation.navigate(SCREENS.SUPPORT_STACK, {
              screen: SCREENS.DEPARTMENT_AND_HISTORY_TAB,
            });
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
