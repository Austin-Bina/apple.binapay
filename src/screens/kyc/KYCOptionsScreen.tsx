import { SpeechBubbleCheck } from "@components/icons/svg";
import { Action, ActionWithDescription } from "@components/screens/account";
import Banner from "@components/ui/banner";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { Colors } from "@constants/theme";
import { AccountTier } from "@enum/user";
import tw from "@lib/tailwind";
import { KYCStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectIsAccountVerified, selectUser } from "@store/selectors/auth";
import { View } from "react-native";
import { Badge, Divider, Text } from "react-native-paper";

type Props = KYCStackScreenProps<typeof SCREENS.ACCOUNT_VERIFICATION_OPTIONS>;

export default function KYCOptionsScreen({ navigation }: Props) {
  const user = useTypedSelector(selectUser);
  const isVerified = useTypedSelector(selectIsAccountVerified);

  const tier1 = user?.account_tier === AccountTier.Tier1;
  const tier2 = user?.account_tier === AccountTier.Tier2;

  return (
    <Screen>
      <ScrollableView>
        <View style={tw`px-4 pt-5`}>
          <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Account Verification</Text>
          <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug`}>
            Select your preferred method to verify your account information. This verification ensures the accuracy of
            your details for secure transactions.
          </Text>

          {tier1 && (
            <Banner
              message="Your account is not yet verified. Certain services will be unavailable until you complete the verification process."
              style={tw`mt-5`}
              variant="info"
            />
          )}
        </View>

        <View style={tw`mt-5`}>
          <ActionWithDescription
            title="Name Verification"
            description="Confirm that your bank account details are accurate."
            ItemIcon={SpeechBubbleCheck}
            onPress={() => {
              navigation.navigate(SCREENS.NAME_CHECK_VERIFICATION);
            }}
            isDisabled={isVerified}
            badgeElement={
              <Badge
                theme={{
                  colors: {
                    error: Colors.primary[600],
                    onError: "white",
                  },
                }}>
                {isVerified ? "Completed" : "Not Completed"}
              </Badge>
            }
          />

          <Divider />

          <ActionWithDescription
            title="BVN Validation"
            description="Ensure that your BVN information matches the provided account details."
            ItemIcon={SpeechBubbleCheck}
            onPress={() => {
              navigation.navigate(SCREENS.BVN_VERIFICATION);
            }}
          />
        </View>
      </ScrollableView>
    </Screen>
  );
}
