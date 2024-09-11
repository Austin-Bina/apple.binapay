import { TransactionType } from "@enum/transaction";

export interface Transaction {
  id: number;
  payable_type: string;
  payable_id: string;
  wallet_id: number;
  type: TransactionType;
  amount: string;
  confirmed: boolean;
  meta: {
    description: string;
    type?: string;  // e.g., "refund", "chargeback", etc.
  };
  uuid: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}
