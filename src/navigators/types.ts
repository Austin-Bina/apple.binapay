import { CompositeScreenProps, NavigatorScreenParams, type CompositeNavigationProp } from "@react-navigation/native";
import { type NativeStackScreenProps, type NativeStackNavigationProp } from "@react-navigation/native-stack";
import { type BottomTabScreenProps, type BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { TransactionForm } from "@enum/transaction";
import { SCREENS } from "@constants/screens";

/**
 * Stack Param Lists
 * Group for main stack-based navigation parameter lists.
 */
export type StackParamList = {
  [SCREENS.MAIN]: NavigatorScreenParams<TabParamList>;
  [SCREENS.ONBOARDING]: undefined;
  [SCREENS.BUSY]: undefined;
  [SCREENS.AUTH]: NavigatorScreenParams<AuthParamList>;
  [SCREENS.REQUEST_ONE_TIME_PASSWORD]: { email: string };
  [SCREENS.FORGOT_PASSWORD]: { email: string };
  [SCREENS.RESET_PASSWORD]: { email: string; code: string };
  [SCREENS.RESET_PASSWORD_SUCCESS]: undefined;
};
export type StackScreenProps<T extends keyof StackParamList> = NativeStackScreenProps<StackParamList, T>;

/**
 * Registration Param Lists
 * Group for registration-related screens and parameters.
 */
export type RegistrationParamList = {
  Start: undefined;
  "Verify Email": { email: string };
  "Register Success": undefined;
  "Complete Registration": { email: string };
};
export type RegistrationStackScreenProps<T extends keyof RegistrationParamList> = NativeStackScreenProps<
  RegistrationParamList,
  T
>;

/**
 * Authentication Param Lists
 * Group for login and registration flows under Auth.
 */
export type AuthParamList = {
  Login: undefined;
  Register: NavigatorScreenParams<RegistrationParamList>;
};
export type AuthStackScreenProps<T extends keyof AuthParamList> = NativeStackScreenProps<AuthParamList, T>;

/**
 * Account Param Lists
 * Group for account-related screens.
 */
export type AccountParamList = {
  [SCREENS.PROFILE]: undefined;
  [SCREENS.SETTINGS]: undefined;
  [SCREENS.CHANGE_PASSWORD]: undefined;
  [SCREENS.BINAPAY_REWARDS]: undefined;
  [SCREENS.EARNING_SUMMARY]: undefined;
  [SCREENS.VERIFY_ACCOUNT]: NavigatorScreenParams<KYCParamList>;
  [SCREENS.SUPPORT_STACK]: NavigatorScreenParams<SupportParamList>;
};
export type AccountStackScreenProps<T extends keyof AccountParamList> = NativeStackScreenProps<AccountParamList, T>;

/**
 * Tab Navigation Param Lists
 * Group for bottom tab navigation, including Home, Services, and Account screens.
 */
export type TabParamList = {
  Home: NavigatorScreenParams<HomeParamList>;
  Services: NavigatorScreenParams<ServicesParamList>;
  Menu: NavigatorScreenParams<AccountParamList>;
};
export type TabNavScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;

/**
 * Home Param Lists
 * Group for home screen-related navigations.
 */
export type HomeParamList = {
  [SCREENS.DASHBOARD]: undefined;
  [SCREENS.NOTIFICATION]: NavigatorScreenParams<NotificationParamList>;
  [SCREENS.ADD_MONEY]: NavigatorScreenParams<AddMoneyParamList>;
  [SCREENS.TRANSACTION_HISTORY]: undefined;
  [SCREENS.TRANSACTION_DETAILS]: undefined;
};
export type HomeStackScreenProps<T extends keyof HomeParamList> = NativeStackScreenProps<HomeParamList, T>;

/**
 * Add Money Param Lists
 * Group for screens related to adding money.
 */
export type AddMoneyParamList = {
  [SCREENS.MANUAL_FUND_STACK]: NavigatorScreenParams<ManualFundParamList>;
  [SCREENS.PAYMENT_SUCCESS]: undefined;
};
export type AddMoneyStackScreenProps<T extends keyof AddMoneyParamList> = NativeStackScreenProps<AddMoneyParamList, T>;

/**
 * Manual Fund Param Lists
 * Group for manual funding-related screens.
 */
export type ManualFundParamList = {
  [SCREENS.START_MANUAL_FUNDING]: undefined;
  [SCREENS.FUND_WITH_BANK]: undefined;
  [SCREENS.FUND_WITH_CARD]: undefined;
  [SCREENS.MANUAL_FUND]: { amount: string };
  [SCREENS.MANUAL_FUND_PROOF]: { reference: string };
  [SCREENS.MANUAL_FUND_WAIT]: undefined;
};
export type ManualFundStackScreenProps<T extends keyof ManualFundParamList> = NativeStackScreenProps<
  ManualFundParamList,
  T
>;

/**
 * Notification Param Lists
 * Group for notification-related screens.
 */
export type NotificationParamList = {
  "List Notifications": undefined;
  "View Notification": { id: string };
};
export type NotificationStackScreenProps<T extends keyof NotificationParamList> = NativeStackScreenProps<
  NotificationParamList,
  T
>;

/**
 * Services Param Lists
 * Group for utility and service-related screens.
 */
export type ServicesParamList = {
  List: undefined;
  "Airtime Purchase": undefined;
  "Data Purchase": undefined;
  "Electricity Bill": undefined;
  Education: NavigatorScreenParams<EducationParamList>;
  "Airtime EPIN Purchase": undefined;
  "Airtime Swap": undefined;
  [SCREENS.VIEW_TRANSACTION]: { transactionId: TransactionForm; type?: "utility" | "wallet" };
  "Confirm Transaction": { transactionId: TransactionForm };
  "TV Subscription": undefined;
};
export type ServicesStackScreenProps<T extends keyof ServicesParamList> = NativeStackScreenProps<ServicesParamList, T>;

/**
 * Education Param Lists
 * Group for education-related payment screens.
 */
export type EducationParamList = {
  "Select Educational Payment": undefined;
  "Educational Payment": { provider: string };
};
export type EducationStackScreenProps<T extends keyof EducationParamList> = NativeStackScreenProps<
  EducationParamList,
  T
>;

/**
 * KYC Param Lists
 * Group for Know Your Customer (KYC) verification-related screens.
 */
export type KYCParamList = {
  [SCREENS.ACCOUNT_VERIFICATION_OPTIONS]: undefined;
  [SCREENS.NAME_CHECK_VERIFICATION]: undefined;
  [SCREENS.BVN_VERIFICATION]: undefined;
};
export type KYCStackScreenProps<T extends keyof KYCParamList> = NativeStackScreenProps<KYCParamList, T>;

/**
 * Composite Navigation Props
 * Group for combined navigation props across stacks and tabs.
 */
export type StackNavigationProp<T extends keyof StackParamList> = CompositeNavigationProp<
  NativeStackNavigationProp<StackParamList, T>,
  BottomTabNavigationProp<TabParamList>
>;

/**
 * Support Param Lists
 * Group for support-related screens.
 */
export type SupportParamList = {
  [SCREENS.DEPARTMENT_AND_HISTORY_TAB]: undefined;
  // [SCREENS.SUPPORT_DEPARTMENT]: undefined;
  [SCREENS.SUPPORT_START_CONVERSATION]: { departmentId: string };
  [SCREENS.SUPPORT_CHAT]: {
    ticketId: string;
    departmentId: string;
  };
  // [SCREENS.SUPPORT_HISTORY]: undefined;
};
export type SupportTabsParamList = {
  [SCREENS.SUPPORT_DEPARTMENT]: undefined;
  [SCREENS.SUPPORT_HISTORY]: undefined;
};
// export type SupportStackScreenProps<T extends keyof SupportParamList> = NativeStackScreenProps<SupportParamList, T>;

export type SupportStackScreenProps<T extends keyof SupportTabsParamList> = CompositeScreenProps<
  BottomTabScreenProps<SupportTabsParamList, T>,
  NativeStackScreenProps<SupportParamList>
>;
