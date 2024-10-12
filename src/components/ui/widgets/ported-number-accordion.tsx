import { ArrowRight } from "@components/icons/svg";
import tw from "@lib/tailwind";
import React, { useState, useRef, useEffect, Fragment } from "react";
import { View, Animated, StyleSheet, TouchableWithoutFeedback } from "react-native";
import { Checkbox, HelperText, Text, TouchableRipple } from "react-native-paper";

type Props = {
  onPress: () => void;
  checked: boolean;
};

const PortedNumberAccordion = ({ onPress, checked }: Props) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleAccordion = () => {
    setIsExpanded(!isExpanded);
  };

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const animatedHeight = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 100],
  });

  return (
    <View style={tw.style("border border-gray-300 rounded-xl my-4 overflow-hidden", checked && "bg-primary-100 border-primary-100")}>
      <TouchableRipple onPress={onPress} style={tw`flex-row items-center p-1`}>
        <Fragment>
          <Checkbox status={checked ? "checked" : "indeterminate"} />
          <Text style={tw`ml-1`}>Is this a ported number?</Text>
        </Fragment>
      </TouchableRipple>

      <TouchableWithoutFeedback onPress={toggleAccordion}>
        <Text style={tw`text-primary-500 mx-4 flex-row items-center py-1`}>What is a ported number?</Text>
      </TouchableWithoutFeedback>

      <Animated.View style={{ height: animatedHeight, overflow: "hidden" }}>
        <View style={styles.accordionContent}>
          <Text style={tw`text-gray-700 p-4`}>
            A ported number is a telephone number that has been transferred from one service provider to another. This
            allows users to keep their existing phone number while changing their mobile network operator.
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  accordionContent: {
    backgroundColor: "#f9f9f9",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
});

export default PortedNumberAccordion;
