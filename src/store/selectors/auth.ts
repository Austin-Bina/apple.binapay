import { State } from "@store/main";

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
export const selectUserWalletBalance = (state: State) => state.auth.user?.wallet_balance || 0;
