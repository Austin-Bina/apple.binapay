import { useNavigation } from "@react-navigation/native";
import { SCREENS } from "@constants/screens";

export const useGoToDashboard = () => {
  const navigation = useNavigation<any>();

  return () => {
    navigation.getParent()?.reset({
      routes: [
        {
          name: SCREENS.MAIN,
          params: { screen: SCREENS.DASHBOARD },
        },
      ],
    });
  };
};
