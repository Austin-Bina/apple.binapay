import React from "react";
import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TabParamList } from "@navigators/types";
import tw from "@lib/tailwind";
import { Colors } from "@constants/theme/colors";
import { BottomNavigation, Icon } from "react-native-paper";
import AccountStack from "@navigators/stacks/account";
import HomeStack from "@navigators/stacks/home";
import AssetsStack from "@navigators/stacks/assets";
import { CommonActions, getFocusedRouteNameFromRoute } from "@react-navigation/native";
import ServicesStack from "@navigators/stacks/services";
import { SCREENS } from "@constants/screens";
import InsufficientBalanceModal from "@components/ui/modals/insufficient-balance";
import TransactionHistoryScreen from "@screens/home/TransactionHistory";

const HIDE_TAB_LIST = [
  SCREENS.PROFILE,
  SCREENS.CHANGE_PASSWORD,
  SCREENS.ADD_MONEY,
  SCREENS.PAYMENT_SUCCESS,
  SCREENS.AIRTIME_PURCHASE,
  SCREENS.AIRTIME_EPIN_PURCHASE,
  SCREENS.DATA_PURCHASE,
  SCREENS.CONFIRM_TRANSACTION,
  SCREENS.SELECT_EDUCATIONAL_PAYMENT,
  SCREENS.EDUCATIONAL_PAYMENT,
  SCREENS.EDUCATION,
  SCREENS.TV_SUBSCRIPTION,
  SCREENS.ELECTRICITY_BILL,
  SCREENS.BINAPAY_REWARDS,
  SCREENS.EARNING_SUMMARY,
  SCREENS.VERIFY_ACCOUNT,
  SCREENS.VIEW_NOTIFICATION,
  SCREENS.VIEW_TRANSACTION,
  SCREENS.WITHDRAW_CRYPTO,
  SCREENS.WITHDRAW_NAIRA,
  SCREENS.BANK_ACCOUNTS,
  SCREENS.DEPOSIT_CRYPTO,
  SCREENS.WITHDRAW_MONEY,
  SCREENS.CONVERT_CRYPTO,
  SCREENS.SUPPORT_STACK,
  SCREENS.SUPPORT_DEPARTMENT,
  SCREENS.SUPPORT_START_CONVERSATION,
  SCREENS.SUPPORT_CHAT,
  SCREENS.SUPPORT_HISTORY,
  SCREENS.P2P_MANAGER,
  SCREENS.P2P_MANAGER_STACK,
  SCREENS.P2P_CHOOSE_EXCHANGE,
  SCREENS.P2P_WHITELIST_IP,
  SCREENS.P2P_CONNECT_API,
  SCREENS.P2P_DASHBOARD,
  SCREENS.P2P_ORDER_DETAIL,
  SCREENS.P2P_SETTINGS,
  SCREENS.P2P_INSIGHTS,
  SCREENS.P2P_INTRO,
  SCREENS.P2P_ADS,
  SCREENS.P2P_EDIT_AD,
  SCREENS.P2P_MESSAGE_TEMPLATES,
  SCREENS.STATEMENT,
];

const Tab = createBottomTabNavigator<TabParamList>();

export const TabBar = () => {
  return (
    <View style={tw`flex-1`}>
      <Tab.Navigator
        screenOptions={{ headerShown: false }}
        tabBar={({ navigation, state, descriptors, insets }) => {
          const activeRoute = state.routes[state.index];
          const routeName = getFocusedRouteNameFromRoute(activeRoute) ?? "";
          const hideTabBar = HIDE_TAB_LIST.indexOf(routeName as any) !== -1;

          return (
            <BottomNavigation.Bar
              navigationState={state}
              safeAreaInsets={insets}
              activeColor={Colors.primary.DEFAULT}
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
                  return;
                }

                if (route.name === "Services") {
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{
                        name: "Services",
                        state: { routes: [{ name: "List" }], index: 0 },
                      }],
                    }),
                    target: state.key,
                  });
                } else if (route.name === "Menu") {
                  navigation.dispatch({
                    ...CommonActions.reset({
                      index: 0,
                      routes: [{
                        name: "Menu",
                        state: { routes: [{ name: "Settings" }], index: 0 },
                      }],
                    }),
                    target: state.key,
                  });
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
                return options.tabBarLabel as string;
              }}
            />
          );
        }}>
        <Tab.Screen
          name="Home"
          component={HomeStack}
          options={{
            tabBarLabel: "Home",
            tabBarIcon: ({ color, size }) => <Icon source="home-variant" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Assets"
          component={AssetsStack}
          options={{
            tabBarLabel: "Assets",
            tabBarIcon: ({ color, size }) => <Icon source="chart-line" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Services"
          component={ServicesStack}
          options={{
            tabBarLabel: "Services",
            tabBarIcon: ({ color, size }) => <Icon source="apps" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Activity"
          component={TransactionHistoryScreen}
          options={{
            tabBarLabel: "Activity",
            tabBarIcon: ({ color, size }) => <Icon source="clock-outline" color={color} size={size} />,
          }}
        />
        <Tab.Screen
          name="Menu"
          component={AccountStack}
          options={{
            tabBarLabel: "Menu",
            tabBarIcon: ({ color, size }) => <Icon source="menu" color={color} size={size} />,
          }}
        />
      </Tab.Navigator>
      <InsufficientBalanceModal />
    </View>
  );
};
