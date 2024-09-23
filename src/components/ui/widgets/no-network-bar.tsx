import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { StatusBar, Animated, Easing, StyleSheet, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { MD3Theme, useTheme } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const createStyles = (theme: MD3Theme) => {
  return StyleSheet.create({
    container: {
      backgroundColor: theme.colors.errorContainer,
      position: "absolute",
      top: 0,
    },
    offlineText: {
      // For texts displayed on contrast backgrounds (color-danger-800 in this case)
      // We have predefined text-control-color variable
      color: theme.colors.error,
      padding: 16,
      textAlign: "center",
      fontWeight: "500",
      fontSize: 14,
    },
  });
};

const OfflineBar = () => {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const insets = useSafeAreaInsets();

  const animationConstants = useMemo(
    () => ({
      DURATION: 800,
      TO_VALUE: 4,
      INPUT_RANGE: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4],
      OUTPUT_RANGE: [0, -15, 0, 15, 0, -15, 0, 15, 0],
    }),
    [],
  );

  const [connected, setConnected] = useState<boolean | null>(true);
  const animation = useRef(new Animated.Value(0)).current;

  // Took Reference from https://egghead.io/lessons/react-create-a-button-shake-animation-in-react-native#/tab-code
  const triggerAnimation = useCallback(() => {
    animation.setValue(0);
    Animated.timing(animation, {
      duration: animationConstants.DURATION,
      toValue: animationConstants.TO_VALUE,
      useNativeDriver: true,
      easing: Easing.bounce,
    }).start();
  }, [animation, animationConstants]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const { isConnected } = state;
      setConnected(isConnected);
      if (isConnected) {
        triggerAnimation();
      }
    });
    return () => {
      unsubscribe();
    };
  }, [triggerAnimation]);

  const interpolated = animation.interpolate({
    inputRange: animationConstants.INPUT_RANGE,
    outputRange: animationConstants.OUTPUT_RANGE,
  });
  const animationStyle = {
    transform: [{ translateX: interpolated }],
  };

  return !connected ? (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top,
          paddingLeft: insets.left,
          paddingRight: insets.right,
          zIndex: 100,
        },
      ]}>
      <StatusBar backgroundColor={theme.colors.errorContainer} />
      <Animated.Text style={[styles.offlineText, animationStyle]}>
        You must connect to Wi-fi or a cellular network to get online again
      </Animated.Text>
    </View>
  ) : null;
};

export default OfflineBar;
