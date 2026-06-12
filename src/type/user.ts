import { AccountStatus, AccountTier } from "@enum/user";

export interface WalletBalances {
  [slug: string]: { name: string; balance: string; decimal_places?: number };
}

export interface Network {
  id: number;
  name: string;
  fee: number;
  min_withdrawal: number;
  deposit_address: string;
  qr_code: string | null;
  network_slug: string;
  nowpayments_network_slug: string;
}


export interface CryptoAsset {
  id: number;
  name: string;
  symbol: string;
  networks: Network[];
  withdrawal_enabled: boolean;
conversion_enabled: boolean;
deposit_enabled: boolean;
  icon_url?: string;
  price_usd?: number;
  balance?: number;
  decimal_places?: number;
  min_conversion: number;
}

export interface userBankAccounts{
  account_name: string;
  account_number: string;
  bank_name: string;
  id: number;
}

export interface DVA {
  id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  payment_channel_id: number;
  fee_type: "percentage" | "flat";
  charge_percentage: number;
  flat_fee: number;
  cap: number;
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
  support_id: string | null;
  affiliate_id: string;
  referred_by: string | null;
  email_verified_at: string;
  onboarding_step: string;
  is_bvn_verified: boolean;
  is_nin_verified: boolean;
  status: AccountStatus;
  accounts: DVA[];
  wallet_balance: number;
  wallet_balances?: WalletBalances;
   wallets?: { slug: string; name: string; balance: number }[];
  created_at: string;
  phone_verified_at?: string | null;
  verification_attempts: number;
   crypto_assets?: CryptoAsset[];
    admin_ngn_usdt_rate?: {
    buy: number;
    sell: number;
  };
   spreadConfig?: { spreadType: "percent" | "flat"; spread: number };
   userBankAccounts: userBankAccounts[];
  auto_process_crypto_deposits: boolean;
  auto_withdraw_bank_account_id: string | null;
  kyc_tier?: number;
daily_transfer_limit?: number;
 per_txn_limit?: number;
  wallet_balance_limit?: number;
    is_email_verified?: boolean;
  is_phone_verified?: boolean;
  is_face_verified?: boolean;
  is_address_verified?: boolean;
}

export interface ReferralReward {
  id: string;
  referrer_id: string;
  referee_id: string;
  registration_date: string;
  reward_amount: number;
  total_reward_earned: number;
  reward_per_withdrawal: number;
  reward_percentage: number;
  total_trading_volume: number;
  total_volume: number;
  max_reward_cap: number;
  referee: {
    id: string;
    name: string;
    avatar: string;
  };
}

export interface ReferralLeaderboardItem {
  referrer_id: string;
  total_earned: number;
  total_volume: number;
  referrer: {
    name: string;
    avatar: string;
  };
}

