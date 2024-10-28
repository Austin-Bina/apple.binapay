import { TransactionForm, TransactionStatus, TransactionType } from "@enum/transaction";

export interface WalletTransaction {
  id: number;
  amount: string;
  type: "withdraw" | "deposit";
  confirmed: boolean;
  wallet_id: number;
  meta: {
    description: string;
    form: string;
    transaction_id: string;
  };
  created_at: string;
  payment_transaction?: PaymentTransaction;
  response: Record<string, string> | null;
}

export interface PaymentTransaction {
  id: string;
  transaction_type: TransactionForm;
  utility_transaction_id: string;
  virtual_account_funding_id: string | null;
  balance_before: string;
  balance_after: string;
  utilityTransaction: UtilityTransaction | null;
}

export interface UtilityTransaction {
  id: string;
  provider_logo: string;
  details: {
    provider: string;
    phone: string;
    amount: string;
    data_amount: string;
    data_bundle: string;
    ported_number: boolean;
    type: string;
    requestId: string;
    Token?: string | Array<{ serial: string; pin: string }>; // For Epins
    // Epins
    quantity?: string;
    business_name?: string;
  };
  created_at: string;
}
export interface TransactionInfo {
  transaction: UtilityTransaction | null;
  was_billed: boolean;
  billed_amount: number;
  was_refunded: boolean;
}

export interface TransactionResponse {
  error: boolean;
  error_code: string;
  code: number | string;
  title: string;
  description: string;
  transaction_info: TransactionInfo;
  errorFields?: {
    name: any;
    message: any;
  }[];
}
export interface BankAccount {
  account_name: string;
  bank_name: string;
  account_number: string;
  logo?: string;
}

export interface ViewTransaction {
  transactionTitle: string;
  transactionDescription: string;
  transactionDetails: {
    label: string;
    value: any;
  }[];
  hasDetails: boolean;
  logo: string;
  transactionDate: string;
  hasHighlighted?: {
    value: string;
    copyable: boolean;
  };
  epins?: Array<{
    serial: string;
    pin: string;
    provider: string;
    amount: string;
    business_name: string;
  }>;
}
