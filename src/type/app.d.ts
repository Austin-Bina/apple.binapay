import { getTransactionDetails } from "@helpers/transaction";
import * as DocumentPicker from "expo-document-picker";

type ProviderDetails = {
  id: number;
  serviceId: string;
  name: string;
  logo: any;
};

export type ServiceProvidersMap = {
  internet: {
    [key: string]: ProviderDetails & {
      type: string[];
    };
  };
  education: {
    [key: string]: ProviderDetails & { description: string };
  };
  entertainment: {
    [key: string]: ProviderDetails;
  };
  electricity: {
    [key: string]: ProviderDetails;
  };
};

export interface RouteOptions {
  params?: Record<string, string | number>;
  version?: "v1";
  type?: "api" | "web";
}

export interface DataPlan {
  id: number;
  dataplan_id: string;
  network: number;
  plan_type: string;
  plan_network: string;
  month_validate: string;
  plan: string;
  plan_amount: string;
}
export interface CablePlan {
  cable: string;
  cableplan_id: string;
  id: number;
  package: string;
  plan_amount: string;
}
export interface EducationPlan {
  id: string;
  serviceId: string;
  name: string;
  description: string;
  minimum_amount: string;
  maximum_amount: string;
  convinience_fee: string;
  product_type: string;
  logo: string;
}

export interface EpinPlan {
  id: string;
  name: string;
  plan_amount: string;
  label: string;
}

export interface ServiceDetails {
  title: string;
  description: string;
  banner?: string;
  convenience_fee: string;
  inputFields: {
    label: string;
    name: string;
    placeholder?: string;
    options?: {
      name: string;
      variation_code: string;
      variation_amount: string;
      fixedPrice: "Yes" | "No";
    }[];
  }[];
}

export type InternetProviders = "mtn" | "airtel" | "9mobile" | "glo";

export interface CustomPagination<T> {
  data: T[];
  current_page: number;
  from: number | null;
  to: number | null;
  per_page: number;
  total: number;
}

export interface BinaNotification {
  id: string;
  type: "deposit" | "service_purchase" | "marketing";
  notifiable_id: string;
  notifiable_type: string;
  data: {
    title: string;
    message: string;
    details: { [key: string]: string | number };
  };
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ExpoAttachment = DocumentPicker.DocumentPickerAsset;

export interface GiftedChatMessageData {
  id: string;
  _id: string | number;
  type: string;
  body: string;
  attachment?: string;
  sent: boolean;
  received: boolean;
  created_at: number;
}
export interface DraftMessage {
  _id: string | number;
  type: "text" | "attachment";
  message?: string;
  attachment?: string;
}

export interface CustomerSettings {
  // Verification settings
  bvn_verification_limit: number;
  nin_verification_limit: number;
  bvn_verification_charge: number;
  nin_verification_charge: number;

  // Percentage charges
  data_charge_percentage: number;
  epin_discount_percentage: number;

  // Discounts (for various services)
  airtime_discount_percentage: number;
  electricity_discount_percentage: number;
  cable_charge_percentage: number;
  education_charge_percentage: number;
}

export interface TransactionSettings {
  airtime: {
    active: boolean;
    vendor: string;
    networks: string[];
  };
  data: {
    active: boolean;
    vendor: string;
    networks: string[];
  };
  education: {
    active: boolean;
    vendor: string;
    networks: string[];
  };
  epin: {
    active: boolean;
    vendor: string;
    networks: string[];
  };
  electricity: {
    active: boolean;
    vendor: string;
    networks: string[];
  };
  active_payment_processors: PaymentProcessor[];
  payment_provider_fees: {
    name: PaymentProcessor;
    charge_percentage: number;
    cap: number;
  }[];
}

export interface BankAccountSettings {
  accounts: Array<{
    account_name: string;
    account_number: string;
    bank_name: string;
  }>;
  manual_funding_enabled: boolean;
  manual_funding_fee: number;
  min_transaction_amount: number;
  max_transaction_amount: number;
  daily_transaction_limit: number;
}

export interface SystemSettings {
  customers: CustomerSettings;
  transaction: TransactionSettings;
  bank: BankAccountSettings;
}

export interface PrintProps {
  appLogo: string; // URL for the logo image
  transactionTitle: string; // Title for the transaction
  transactionDate: string; // Date of the transaction
  logo: string; // URL for the provider logo image
  hasDetails: boolean; // Whether transaction has details to display
  transactionDetails: ReturnType<typeof getTransactionDetails>; // Array of transaction details (label-value pairs)
  transactionDescription?: string; // Optional description if no transaction details exist
  promotionalText: string; // Promotional text to display in the footer
  supportEmail: string; // Support email address
}
