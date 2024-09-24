import { BankOutline, CardOutline } from "@components/icons/svg";
import { ActionWithDescription } from "@components/screens/account";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { SCREENS } from "@constants/screens";
import { Colors } from "@constants/theme/colors";
import tw from "@lib/tailwind";
import { KYCStackScreenProps } from "@navigators/types";
import { useTypedSelector } from "@store/common";
import { selectIsBvnVerified, selectIsNinVerified } from "@store/selectors/auth";
import { View } from "react-native";
import { Badge, Divider, Text } from "react-native-paper";

type Props = KYCStackScreenProps<typeof SCREENS.ACCOUNT_VERIFICATION_OPTIONS>;

export default function KYCOptionsScreen({ navigation }: Props) {
  const isBvnVerified = useTypedSelector(selectIsBvnVerified);
  const isNinVerified = useTypedSelector(selectIsNinVerified);

  return (
    <Screen>
      <ScrollableView contentContainerStyle={tw`pt-5 justify-between`}>
        <View>
          <View style={tw`px-4`}>
            <Text style={tw`text-gray-900 text-2xl font-bold leading-relaxed`}>Account Verification</Text>
            <Text style={tw`w-full text-gray-500 text-base font-normal leading-snug`}>
              Select your preferred method to verify your account information. This verification ensures the accuracy of
              your details for secure transactions.
            </Text>
          </View>

          <View style={tw`mt-5`}>
            <ActionWithDescription
              title="BVN Verification"
              description="Ensure that your BVN information matches the provided account details."
              ItemIcon={BankOutline}
              onPress={() => {
                navigation.navigate(SCREENS.BVN_VERIFICATION);
              }}
              isDisabled={isBvnVerified}
              badgeElement={
                <Badge
                  theme={{
                    colors: {
                      error: isBvnVerified ? Colors.secondary[600] : Colors.primary[600],
                      onError: "white",
                    },
                  }}>
                  {isBvnVerified ? "Completed" : "Not Completed"}
                </Badge>
              }
            />
            <Divider />
            <ActionWithDescription
              title="NIN Verification"
              description="Ensure that your NIN information matches the provided account details."
              ItemIcon={CardOutline}
              onPress={() => {
                navigation.navigate(SCREENS.NIN_VERIFICATION);
              }}
              isDisabled={isNinVerified}
              badgeElement={
                <Badge
                  theme={{
                    colors: {
                      error: isNinVerified ? Colors.secondary[600] : Colors.primary[600],
                      onError: "white",
                    },
                  }}>
                  {isNinVerified ? "Completed" : "Not Completed"}
                </Badge>
              }
            />
          </View>
        </View>

        <View>
          <View style={tw`p-4 bg-gray-50`}>
            <Text style={tw`text-gray-700 text-xl font-semibold`}>Why do we need this?</Text>

            <Text style={tw`mt-3 text-gray-500 text-base`}>
              All services are provided in accordance with the Central Bank of Nigeria's circular on virtual accounts.{" "}
              <Text variant="bodyMedium">We do not store your BVN on our servers</Text>. It is only used for
              verification purposes with our payment partners.
            </Text>
          </View>
        </View>
      </ScrollableView>
    </Screen>
  );
}
