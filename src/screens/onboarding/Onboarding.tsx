import {
  FlatList,
  Animated,
  TouchableOpacity,
  View,
  Text,
  useWindowDimensions,
  ImageBackground,
} from "react-native";
import React, { useState, useRef, useEffect } from "react";
import { StackScreenProps } from "@navigators/types";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Paginator from "./Paginator";
import tw from "@lib/tailwind";
import { IconButton } from "react-native-paper";
import { Colors } from "@constants/theme";

const onboarding = [
  {
    title: "Airtime Purchase",
    description:
      "Instantly top up your mobile credit seamlessly with BinaPay. Swift, secure, and always at your fingertips.",
    background: require("@assets/images/slides/background-slide-1.png"),
  },
  {
    title: "Data Purchase",
    description:
      "Explore a world of connectivity with BinaPay. Choose from various data bundles and stay connected on your terms.",
    background: require("@assets/images/slides/background-slide-2.png"),
  },
  {
    title: "Earn as You Share",
    description:
      "Join BinaPay's affiliate program and unlock exciting rewards. Share the experience, earn rewards, and grow together.",
    background: require("@assets/images/slides/background-slide-3.png"),
  },
];

const Onboarding: React.FC<StackScreenProps<"Onboarding">> = ({
  navigation,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef<FlatList<any>>(null);
  const scrollX = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index);
  }).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const scrollTo = () => {
    if (slideRef.current && currentIndex < onboarding.length - 1) {
      slideRef.current.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    AsyncStorage.setItem("@seen_onboarding", "true");
    navigation.navigate("Auth", { screen: "Login" });
  };

  return (
    <View style={tw`flex-1 bg-white relative`}>
      <Animated.View style={[{ flex: 3, opacity: fadeAnim }]}>
        <FlatList
          ref={slideRef}
          horizontal
          data={onboarding}
          keyExtractor={(item) => item.title}
          renderItem={({ item }) => (
            <ImageBackground
              style={[{ width }, tw`justify-center`]}
              source={item.background}
            >
              <View style={tw`p-4 h-1/2 justify-end`}>
                <View>
                  <Text
                    style={tw`w-full font-bold text-3xl text-center text-gray-800 mb-2.5`}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={tw`leading-6 w-full font-light text-base text-gray text-center`}
                  >
                    {item.description}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          )}
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            {
              useNativeDriver: false,
            }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
          scrollEventThrottle={32}
        />
      </Animated.View>
      <View
        style={tw`absolute z-10 bottom-8 flex flex-col items-center w-full px-4`}
      >
        <Paginator
          data={onboarding}
          scrollX={scrollX}
          scrollTo={scrollTo}
          currentIndex={currentIndex}
        />
        <View style={tw`w-full flex-row justify-between items-center`}>
          <TouchableOpacity
            style={tw`bg-primary w-2/3 flex flex-row items-center justify-center px-8 py-4 rounded-full`}
            onPress={handleGetStarted}
          >
            <Text style={tw`text-white text-[16px] font-medium`}>
              Get Started
            </Text>
          </TouchableOpacity>
          <IconButton
            icon={require("@assets/icons/arrow-right-with-leg.png")}
            containerColor={Colors.secondary[300]}
            iconColor="white"
            onPress={scrollTo}
          />
        </View>
      </View>
    </View>
  );
};

export default Onboarding;
