import {
  NavigatorScreenParams,
  type CompositeNavigationProp,
} from "@react-navigation/native";
import {
  type NativeStackScreenProps,
  type NativeStackNavigationProp,
} from "@react-navigation/native-stack";
import {
  type BottomTabScreenProps,
  type BottomTabNavigationProp,
} from "@react-navigation/bottom-tabs";

export type StackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Onboarding: undefined;
  Busy: undefined;
  Auth: NavigatorScreenParams<AuthParamList>;
  "One Time Password": { email: string };
  "Forget Password": { email: string };
  "Reset Password": { email: string };
  "Reset Password Successful": undefined;
};
export type StackScreenProps<T extends keyof StackParamList> =
  NativeStackScreenProps<StackParamList, T>;

export type RegistrationParamList = {
  Start: undefined;
  "Verify Email": { email: string };
  "Create Password": undefined;
  "Create Transaction Pin": undefined;
  "Choose Avatar": undefined;
  "Register Success": undefined;
};
export type RegistrationStackScreenProps<
  T extends keyof RegistrationParamList,
> = NativeStackScreenProps<RegistrationParamList, T>;

export type AuthParamList = {
  Login: undefined;
  Register: NavigatorScreenParams<RegistrationParamList>;
};
export type AuthStackScreenProps<T extends keyof AuthParamList> =
  NativeStackScreenProps<AuthParamList, T>;

export type AccountParamList = {
  Profile: undefined;
  Settings: undefined;
  "Change Password": undefined;
};
export type AccountStackScreenProps<T extends keyof AccountParamList> =
  NativeStackScreenProps<AccountParamList, T>;

export type TabParamList = {
  Home: NavigatorScreenParams<HomeParamList>;
  Services: NavigatorScreenParams<ServicesParamList>;
  Menu: NavigatorScreenParams<AccountParamList>;
};
export type TabNavScreenProps<T extends keyof TabParamList> =
  BottomTabScreenProps<TabParamList, T>;

export type HomeParamList = {
  Dashboard: undefined;
  Notification: undefined;
  "Add Money": undefined;
  "Card Details": undefined;
  "Payment Success": undefined;
  "Transaction History": undefined;
  "Transaction Details": undefined;
};
export type HomeStackScreenProps<T extends keyof HomeParamList> =
  NativeStackScreenProps<HomeParamList, T>;

export type ServicesParamList = {
  List: undefined;
  "Airtime Purchase": undefined;
  "Data Purchase": undefined;
  "Electricity Bill": undefined;
  "Educational Payment": undefined;
  "Airtime EPIN Purchase": undefined;
  "Airtime Swap": undefined;
};
export type ServicesStackScreenProps<T extends keyof ServicesParamList> =
  NativeStackScreenProps<ServicesParamList, T>;

export type StackNavigationProp<T extends keyof StackParamList> =
  CompositeNavigationProp<
    NativeStackNavigationProp<StackParamList, T>,
    BottomTabNavigationProp<TabParamList>
  >;
