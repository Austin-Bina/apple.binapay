import { TransactionForm, TransactionStatus, TransactionType } from "@enum/transaction";

export interface WalletTransaction {
  id: number;
  payable_type: string;
  payable_id: string;
  wallet_id: number;
  type: TransactionType;
  amount: string;
  confirmed: boolean;
  meta: {
    description: string;
    type?: string; // e.g., "refund", "chargeback", etc.
  };
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PaymentTransaction {
  id: string;
  user_id: string;
  payment_channel: string | null;
  processor_transaction_id: string | null;
  transaction_type: TransactionType;
  transaction_form: TransactionForm;
  utility_transaction_id: string | null;
  virtual_account_funding_id: string | null;
  amount: string;
  balance_before: string;
  balance_after: string;
}

export interface UtilityTransaction {
  id: string;
  user_id: string;
  vendor: string;
  request_id: string;
  status: TransactionStatus;
  amount: string;
  transaction_type: TransactionForm;
  provider_logo: string;
  response: {
    [index: string]: string;
  } | null;
  details: {
    [index: string]: string;
  } | null;
  created_at: string;
  updated_at: string;
  payment_transaction: PaymentTransaction;
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
