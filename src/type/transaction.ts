import { TransactionForm, TransactionStatus, TransactionType } from "@enum/transaction";

export interface TransactionMeta {
  description: string;
  form: string;
  transaction_id: string;
  wallet_address?: string;
  tx_hash?: string;
  // ✅ Optional: direction and symbol info (for conversion or crypto)
  direction?: "debit" | "credit";
  from_symbol?: string;
  to_symbol?: string;
  crypto_asset_symbol?: string;
  decimal_places?: number;

  // ✅ Optional: new fields for future flexibility
  rate?: string | number;
  network?: string;
  reference?: string;
  service?: string;
  channel?: string;

  // ✅ Catch-all for any backend fields
  [key: string]: any;
}

export interface WalletTransaction {
  id: number;
  amount: string;
  type: "withdraw" | "deposit";
  confirmed: boolean;
  wallet_id: number;
  meta: TransactionMeta;
  created_at: string;
  payment_transaction?: PaymentTransaction;
  response: Record<string, string> | null;
  wallet_address?: string;
  
  // ✅ Optional wallet info
  wallet?: {
    name?: string;
    slug?: string;
    decimal_places?: number;
  };

  // ✅ Optional new backend fields
  status?: TransactionStatus;
  transaction_type?: TransactionType;
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
    Token?: string | Array<{ serial: string; pin: string }>;
    quantity?: string;
    business_name?: string;
// NEW FIELDS 
 epins?: ViewEpin[];

  };
  created_at: string;
  status: TransactionStatus;
}


interface ViewEpin {
  id: string;
  serial: string;
  pin: string;
  amount: string;
  provider: string;
  business_name: string;
}

interface PaymentDetailsProps {
  sample?: boolean;
  values: ViewEpin;
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
  _refetchPrices?: boolean;
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
  transactionDetails:     { label: string; value: string }[];
  logo: string;
   status?: TransactionStatus;
  hasDetails: boolean;
  transactionDate: string;
   reference?: string;
  hasHighlighted?:        { value: string; copyable: boolean };
   transferDetails?:       TransferDetails;
  receiptType?:           'transfer' | 'airtime' | 'data' | 'electricity' | 'cable' | 'crypto' | 'generic';
  paymentStatus?:         string;
  // NEW FIELD FOR EPINS, can be used for both utility and wallet transactions
   epins?: ViewEpin[];

  /*epins?: Array<{
    serial: string;
    pin: string;
    provider: string;
    amount: string;
    business_name: string;
  }>;*/
 
}

export interface TransferDetails {
  beneficiary_name:    string | null;
  beneficiary_account: string | null;
  bank_name:           string | null;
  sender_name:         string | null;
  session_id:          string | null;
  reference:           string | null;
  provider:            string | null;
  payment_status:      string;
  amount:              string | null;
  narration:           string | null;
}
