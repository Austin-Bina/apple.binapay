import { AccountStatus, AccountTier } from "@enum/user";

export interface DVA {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  payment_channel_id: number;
}

export interface User {
  id: string;
  name: string;
  firstname: string;
  lastname: string;
  email: string;
  avatar: string;
  phone: string;
  birthdate: string;
  gender: string | null;
  referral_code: string;
  email_verified_at: string;
  onboarding_step: string;
  account_tier: AccountTier;
  status: AccountStatus;
  accounts: DVA[];
  wallet_balance: number;
  created_at: string;
}
