import { Animated } from "react-native";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { AddMoneyStackScreenProps } from "@navigators/types";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { SegmentedButtons } from "react-native-paper";
import { useTypedSelector } from "@store/common";
import { selectIsAccountVerified, selectUser } from "@store/selectors/auth";
import { BankView, ManualFundView } from "@components/screens/add-money";
import { SCREENS } from "@constants/screens";

type Props = AddMoneyStackScreenProps<typeof SCREENS.FUND_ACCOUNT_OPTIONS>;

export default function AddMoneyScreen(props: Props) {
  const [value, setValue] = useState("bank");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const user = useTypedSelector(selectUser);
  const isVerified = useTypedSelector(selectIsAccountVerified);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [value]);

  const sortedButtons = useMemo(() => {
    const buttons = [
      {
        value: "manual",
        label: "Manual Funding",
      },
      {
        value: "bank",
        label: "Bank",
      },
    ];

    return !isVerified ? buttons : buttons.reverse();
  }, [isVerified, user, props]);

  return (
    <Screen>
      <ScrollableView>
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          density="regular"
          buttons={sortedButtons}
          theme={{
            colors: {
              secondaryContainer: Colors.gray[700],
              onSecondaryContainer: "white",
            },
          }}
          style={tw`px-4 pt-4`}
        />
        <Animated.View
          style={{
            ...tw`px-4 py-8 flex-1`,
            opacity: fadeAnim,
          }}>
          {value === "bank" ? <BankView accounts={user?.accounts || []} /> : <ManualFundView {...props} />}
        </Animated.View>
      </ScrollableView>
    </Screen>
  );
}
