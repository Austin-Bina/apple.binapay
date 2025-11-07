import Screen from "@components/ui/shared/Screen";
import tw from "@lib/tailwind";
import React, { Fragment, useState, useEffect } from "react";
import { Linking, View } from "react-native";
import { Appbar, Divider, Text, TouchableRipple, ActivityIndicator } from "react-native-paper";
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
import { selectIsBvnVerified, selectIsLoggingIn, selectIsNinVerified, selectUser } from "@store/selectors/auth";
import PleaseWaitModal from "@components/ui/modals/please-wait-modal";
import { AvatarImage } from "@components/avatar";
import { scale } from "react-native-size-matters";
import { SCREENS } from "@constants/screens";
import { Action } from "@components/screens/account";
import { routes } from "@constants/routes";
import { useAppVersion } from "@providers/app-version-provider";
import { showToast } from "@helpers/toast";
import UpdatesIcon from "@assets/icons/bar-code.svg";

type Props = AccountStackScreenProps<"Settings">;

export default function SettingScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const isLoggingIn = useTypedSelector(selectIsLoggingIn);
  const dispatch = useTypedDispatch();

  const isBvnVerified = useTypedSelector(selectIsBvnVerified);
  const isNinVerified = useTypedSelector(selectIsNinVerified);
  const { checkForUpdates, isCheckingForUpdates, currentVersion, buildNumber } = useAppVersion();
  const [wasChecking, setWasChecking] = useState(false);

  const verificationStatusText = isBvnVerified || isNinVerified ? "Verified" : "Not verified";

  const handleLogout = () => {
    dispatch(authSliceActions.doLogout());
  };
  
  const handleCheckForUpdates = () => {
    checkForUpdates();
    
    showToast({ 
      message: "Checking for updates...",
      duration: 2000,
    });
  };

  useEffect(() => {
    if (isCheckingForUpdates) {
      setWasChecking(true);
    } else if (wasChecking) {
      showToast({ 
        message: "You're using the latest version",
        duration: 2000,
      });
      setWasChecking(false);
    }
  }, [isCheckingForUpdates, wasChecking]);

  const formattedVersion = `${currentVersion}${buildNumber ? ` (${buildNumber})` : ''}`;

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
          title="Manage Bank Accounts"
          ItemIcon={KeyIcon}
          onPress={() => {
            navigation.navigate("Bank Accounts");
          }}
        />

        <Action
          title="Change Pin"
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
            Linking.openURL(routes.web.v1.public.privacy);
          }}
        />
        
        <Action
          title="Check for Updates"
          ItemIcon={UpdatesIcon}
          onPress={handleCheckForUpdates}
          badgeElement={
            <View style={tw`flex-row items-center`}>
              {isCheckingForUpdates && (
                <ActivityIndicator size={16} color="#4F46E5" style={tw`mr-2`} />
              )}
              <View style={tw`bg-blue-50 rounded-full py-1 px-3`}>
                <Text style={tw`text-blue-600 text-xs font-medium`}>v{formattedVersion}</Text>
              </View>
            </View>
          }
        />
        
        <View style={tw`my-5`} />
        <Action title="Logout" backgroundColor="#FEF2F2" ItemIcon={LogoutIcon} onPress={handleLogout} />
        
        <View style={tw`items-center my-10`}>
          <Text variant="bodyMedium" style={tw`text-gray-400 text-center`}>
            BinaPay v{formattedVersion}
          </Text>
        </View>
      </ScrollableView>
      <PleaseWaitModal visible={isLoggingIn} />
    </Screen>
  );
}
