import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabParamList } from "@navigators/types";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import tw from "@lib/tailwind";
import { Colors } from "@constants/theme";
import ListServicesScreen from "@screens/services/List";
import { BottomNavigation, Icon } from "react-native-paper";
import AccountStack from "@navigators/stacks/account";
import HomeStack from "@navigators/stacks/home";
import {
  CommonActions,
  getFocusedRouteNameFromRoute,
} from "@react-navigation/native";
import ServicesStack from "@navigators/stacks/services";

const Tab = createBottomTabNavigator<TabParamList>();

export const TabBar = () => {
  const safeAreaInsets = useSafeAreaInsets();

  const screen = (
    <View style={tw`flex-1`}>
      <Tab.Navigator
        backBehavior="history"
        screenOptions={{
          headerShown: false,
        }}
        tabBar={({ navigation, state, descriptors, insets }) => {
          const activeRoute = state.routes[state.index];
          const routeName = getFocusedRouteNameFromRoute(activeRoute) ?? "";
          const hideTabBar = [
            "Profile",
            "Change Password",
            "Add Money",
            "Card Details",
            "Payment Success",
            "Airtime Purchase",
            "Airtime EPIN Purchase",
            "Data Purchase",
            "Confirm Transaction",
            "Select Educational Payment",
            "Educational Payment",
            "TV Subscription",
            "Electricity Bill",
            "BinaPay Rewards",
            "Earning Summary",
            "Verify Account",
          ].includes(routeName);

          return (
            <BottomNavigation.Bar
              navigationState={state}
              safeAreaInsets={insets}
              activeColor={Colors.gray[800]}
              inactiveColor={Colors.gray[400]}
              activeIndicatorStyle={tw`bg-transparent`}
              style={[
                tw`bg-white border-t border-gray-100`,
                { display: hideTabBar ? "none" : "flex" },
              ]}
              onTabPress={({ route, preventDefault }) => {
                const event = navigation.emit({
                  type: "tabPress",
                  target: route.key,
                  canPreventDefault: true,
                });

                if (event.defaultPrevented) {
                  preventDefault();
                } else {
                  navigation.dispatch({
                    ...CommonActions.navigate(route.name, route.params),
                    target: state.key,
                  });
                }
              }}
              renderIcon={({ route, focused, color }) => {
                const { options } = descriptors[route.key];
                if (options.tabBarIcon) {
                  return options.tabBarIcon({ focused, color, size: 24 });
                }

                return null;
              }}
              getLabelText={({ route }) => {
                const { options } = descriptors[route.key];
                const label = options.tabBarLabel as string;

                return label;
              }}
            />
          );
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }) => (
              <Icon source="home-variant" color={color} size={size} />
            ),
          }}
        />
        <Tab.Screen
          options={{
            tabBarLabel: "Services",
            tabBarIcon: ({ color, size }) => (
              <Icon source="send" color={color} size={size} />
            ),
          }}
          name="Services"
          component={ServicesStack}
        />
        <Tab.Screen
          options={{
            tabBarLabel: "Menu",
            tabBarIcon: ({ color, size }) => (
              <Icon source="menu" color={color} size={size} />
            ),
          }}
          name="Menu"
          component={AccountStack}
        />
      </Tab.Navigator>
    </View>
  );

  return (
    <View
      style={[
        tw`h-full w-full`,
        {
          paddingTop: safeAreaInsets.top,
        },
      ]}
    >
      {screen}
    </View>
  );
};
