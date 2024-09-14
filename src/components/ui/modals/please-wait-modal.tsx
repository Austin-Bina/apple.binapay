import React, { useEffect, useRef } from "react";
import { Modal, ModalProps, Portal } from "react-native-paper";
import { StyleSheet, View, Animated, Easing, Image } from "react-native";
import tw from "@lib/tailwind";

export default function PleaseWaitModal({ style, visible, ...rest }: Omit<ModalProps, "children">) {
  const shakeAnimation = useRef(new Animated.Value(0)).current;

  const startShake = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shakeAnimation, {
          toValue: 1,
          duration: 100,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: -1,
          duration: 100,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnimation, {
          toValue: 0,
          duration: 100,
          easing: Easing.bounce,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  useEffect(() => {
    if (visible) {
      startShake();
    } else {
      shakeAnimation.stopAnimation();
    }
  }, [visible]);

  const shakeInterpolation = shakeAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: [-10, 10],
  });

  return (
    <Portal>
      <Modal
        theme={{
          colors: {
            backdrop: "rgba(46, 48, 56, 0.3)",
          },
        }}
        visible={visible}
        dismissable={false}
        style={[tw`flex-1 items-center justify-center`, style]}
        {...rest}>
        <View style={styles.modalContainerStyle}>
          <Animated.View style={{ transform: [{ translateX: shakeInterpolation }] }}>
            <Image source={require("@assets/icons/logo-small.png")} style={styles.iconStyle} />
          </Animated.View>
        </View>
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  modalContainerStyle: {
    backgroundColor: "#ffffff",
    width: 50,
    height: 50,
    padding: 5,
    borderRadius: 12,
    elevation: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  iconStyle: {
    width: 40,
    height: 40,
  },
});
