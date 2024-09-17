import { Animated } from "react-native";
import Screen from "@components/ui/shared/Screen";
import ScrollableView from "@components/ui/shared/ScrollableView";
import { Colors } from "@constants/theme";
import tw from "@lib/tailwind";
import { AddMoneyStackScreenProps } from "@navigators/types";
import React, { useState, useRef, useEffect } from "react";
import { SegmentedButtons } from "react-native-paper";
import { useTypedSelector } from "@store/common";
import { selectUser } from "@store/selectors/auth";
import { BankView, CardView } from "@components/screen/add-money";

type Props = AddMoneyStackScreenProps<"Fund Account Options">;

export default function AddMoneyScreen(props: Props) {
  const [value, setValue] = useState("bank");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const user = useTypedSelector(selectUser);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [value]);

  return (
    <Screen>
      <ScrollableView style={tw`pt-5`}>
        <SegmentedButtons
          value={value}
          onValueChange={setValue}
          density="regular"
          buttons={[
            {
              value: "bank",
              label: "Bank",
            },
            {
              value: "card",
              label: "Card",
            },
          ]}
          theme={{
            colors: {
              secondaryContainer: Colors.gray[700],
              onSecondaryContainer: "white",
            },
          }}
          style={tw`px-4`}
        />
        <Animated.View
          style={{
            ...tw`px-4 py-8`,
            opacity: fadeAnim,
          }}>
          {value === "bank" ? <BankView accounts={user?.accounts || []} /> : <CardView {...props} comingSoon />}
        </Animated.View>
      </ScrollableView>
    </Screen>
  );
}
