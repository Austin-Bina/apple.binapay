import { State } from "@store/main";
import { createSelector } from "@reduxjs/toolkit";

export const selectUser = (state: State) => state.auth.user;
export const selectUserId = (state: State) => state.auth.user?.id;
export const selectLoggedIn = (state: State) => !!state.auth.user?.id;
export const selectNewUser = (state: State) => state.auth.newUser;
export const selectIsLoggingIn = (state: State) => state.auth.isLoggingIn;

// Profile
export const selectIsFetchingProfile = (state: State) => state.auth.isFetchingProfile;
export const selectHasFetchError = (state: State) => state.auth.hasProfileError;

export const selectIsAccountVerified = (state: State) =>
  state.auth.user?.is_bvn_verified || state.auth.user?.is_nin_verified;
export const selectIsBvnVerified = (state: State) => !!state.auth.user?.is_bvn_verified;
export const selectIsNinVerified = (state: State) => !!state.auth.user?.is_nin_verified;
  /*export const selectUserWalletBalance = (state: State) => state.auth.user?.wallet_balance || 0; */

export const selectNairaBalance = (state: State) => state.auth.user?.wallet_balances?.naira?.balance || "0";
export const selectUsdBalance = (state: State) => state.auth.user?.wallet_balances?.usd?.balance || "0";
export const selectCryptoAssets = (state: State) => state.auth.user?.crypto_assets || [];

//support  contact details
export const selectContact = (state: State) => state.auth.contact;
export const selectContactPhone = (state: State) => state.auth.contact?.phone || "";
export const selectContactWhatsapp = (state: State) => state.auth.contact?.whatsapp || "";
export const selectContactSupportUrl = (state: State) => state.auth.contact?.support_url || "";

const DEFAULT_NGN_USDT_RATE = { buy: 1, sell: 1 };
const DEFAULT_SPREAD = { spreadType: "percent" as const, spread: 0 };

export const selectNgnUsdtRateWithSpread = createSelector(
  (state: State) => state.auth.adminNgnUsdtRate,
  (state: State) => state.auth.spreadConfig,
  (rate, spread) => ({
    buy: rate?.buy ?? DEFAULT_NGN_USDT_RATE.buy,
    sell: rate?.sell ?? DEFAULT_NGN_USDT_RATE.sell,
    spreadType: (spread?.spreadType === "flat" ? "flat" : "percent") as "percent" | "flat",
    spread: spread?.spread ?? DEFAULT_SPREAD.spread,
  })
);


