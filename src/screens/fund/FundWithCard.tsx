import { SCREENS } from "@constants/screens";
import { AddMoneyParamList } from "@navigators/types";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect } from "react";

type NavigationProp = NativeStackNavigationProp<AddMoneyParamList>;

export default function FundWithCardScreen() {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    // Redirect to the new screen
    navigation.replace(SCREENS.FUND_WITH_PAYSTACK);
  }, [navigation]);

  return null;
}
