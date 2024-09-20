import { NavigatorScreenParams, type CompositeNavigationProp } from "@react-navigation/native";
import { type NativeStackScreenProps, type NativeStackNavigationProp } from "@react-navigation/native-stack";
import { type BottomTabScreenProps, type BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TransactionForm } from "@enum/transaction";
import { SCREENS } from "@constants/screens";

export type StackParamList = {
  Main: NavigatorScreenParams<TabParamList>;
  Onboarding: undefined;
  Busy: undefined;
  Auth: NavigatorScreenParams<AuthParamList>;
  "One Time Password": { email: string };
  "Forgot Password": { email: string };
  "Reset Password": { email: string };
  "Reset Password Successful": undefined;
};
export type StackScreenProps<T extends keyof StackParamList> = NativeStackScreenProps<StackParamList, T>;

export type RegistrationParamList = {
  Start: undefined;
  "Verify Email": { email: string };
  "Register Success": undefined;
  "Complete Registration": {
    email: string;
  };
};
export type RegistrationStackScreenProps<T extends keyof RegistrationParamList> = NativeStackScreenProps<
  RegistrationParamList,
  T
>;

export type AuthParamList = {
  Login: undefined;
  Register: NavigatorScreenParams<RegistrationParamList>;
};
export type AuthStackScreenProps<T extends keyof AuthParamList> = NativeStackScreenProps<AuthParamList, T>;

export type AccountParamList = {
  Profile: undefined;
  Settings: undefined;
  "Change Password": undefined;
  "BinaPay Rewards": undefined;
  "Earning Summary": undefined;
  "Verify Account": undefined;
};
export type AccountStackScreenProps<T extends keyof AccountParamList> = NativeStackScreenProps<AccountParamList, T>;

export type TabParamList = {
  Home: NavigatorScreenParams<HomeParamList>;
  Services: NavigatorScreenParams<ServicesParamList>;
  Menu: NavigatorScreenParams<AccountParamList>;
};
export type TabNavScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;

export type HomeParamList = {
  [SCREENS.DASHBOARD]: undefined;
  [SCREENS.NOTIFICATION]: NavigatorScreenParams<NotificationParamList>;
  [SCREENS.ADD_MONEY]: undefined;
  [SCREENS.TRANSACTION_HISTORY]: undefined;
  [SCREENS.TRANSACTION_DETAILS]: undefined;
};
export type HomeStackScreenProps<T extends keyof HomeParamList> = NativeStackScreenProps<HomeParamList, T>;

export type AddMoneyParamList = {
  [SCREENS.FUND_ACCOUNT_OPTIONS]: undefined;
  [SCREENS.MANUAL_FUND]: undefined;
  [SCREENS.CARD_DETAILS]: undefined;
  [SCREENS.PAYMENT_SUCCESS]: undefined;
};
export type AddMoneyStackScreenProps<T extends keyof AddMoneyParamList> = NativeStackScreenProps<AddMoneyParamList, T>;

export type NotificationParamList = {
  "List Notifications": undefined;
  "View Notification": { id: string };
};
export type NotificationStackScreenProps<T extends keyof NotificationParamList> = NativeStackScreenProps<
  NotificationParamList,
  T
>;

export type ServicesParamList = {
  List: undefined;
  "Airtime Purchase": undefined;
  "Data Purchase": undefined;
  "Electricity Bill": undefined;
  Education: NavigatorScreenParams<EducationParamList>;
  "Airtime EPIN Purchase": undefined;
  "Airtime Swap": undefined;
  [SCREENS.VIEW_TRANSACTION]: {
    transactionId: TransactionForm;
    type?: "utility" | "wallet";
  };
  "Confirm Transaction": {
    transactionId: TransactionForm;
  };
  "TV Subscription": undefined;
};
export type ServicesStackScreenProps<T extends keyof ServicesParamList> = NativeStackScreenProps<ServicesParamList, T>;

export type EducationParamList = {
  "Select Educational Payment": undefined;
  "Educational Payment": {
    provider: string;
  };
};
export type EducationStackScreenProps<T extends keyof EducationParamList> = NativeStackScreenProps<
  EducationParamList,
  T
>;

export type StackNavigationProp<T extends keyof StackParamList> = CompositeNavigationProp<
  NativeStackNavigationProp<StackParamList, T>,
  BottomTabNavigationProp<TabParamList>
>;
