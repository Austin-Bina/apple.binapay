import { SystemSettings } from "@type/app";

const systemUser = {
  id: "system",
  name: "BinaPay Support",
  avatar: require("@assets/icon.png"),
};

const bvn_nin_mask = [/\d/, /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, "-", /\d/, /\d/, /\d/, /\d/];
const phone_mask = [/\d/, /\d/, /\d/, /\d/, "  ",/\d/, /\d/, /\d/, " ", /\d/, /\d/, /\d/, /\d/];

const defaultSystemSettings: SystemSettings = {
  customers: {
      bvn_verification_limit: 1,
      nin_verification_limit: 1,
      bvn_verification_charge: 10,
      nin_verification_charge: 60,

      airtime_discount_percentage: 0,
      epin_discount_percentage: 0,

      data_charge_percentage: 4,
      electricity_discount_percentage: 4,
      cable_charge_percentage: 4,
      education_charge_percentage: 4,
  },
  transaction: {} as any,
  bank: {
      accounts: [],
      manual_funding_enabled: false,
      manual_funding_fee: 20,
      min_transaction_amount: 100,
      max_transaction_amount: 1000000,
      daily_transaction_limit: 5,
  },
};

const MAX_CACHE_AGE_SEC = 30;
export { systemUser, bvn_nin_mask, phone_mask, defaultSystemSettings, MAX_CACHE_AGE_SEC };
