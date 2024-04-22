import tw from "@lib/tailwind";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { useTheme } from "react-native-paper";
export type Props = { delayMs?: number };

const Busy: React.FC<Props> = ({ delayMs = 500 }) => {
  const [doAnimate, setDoAnimate] = useState<boolean>(false);

  const theme = useTheme();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDoAnimate(true);
    }, delayMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [delayMs]);

  return (
    <View style={tw`flex items-center flex-col h-full justify-center bg-white`}>
      {doAnimate ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : null}
    </View>
  );
};

export default Busy;
