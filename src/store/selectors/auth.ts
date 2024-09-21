import { AccountTier } from "@enum/user";
import { State } from "@store/main";

export const selectUser = (state: State) => state.auth.user;
export const selectUserId = (state: State) => state.auth.user?.id;
export const selectLoggedIn = (state: State) => !!state.auth.user?.id;
export const selectNewUser = (state: State) => state.auth.newUser;
export const selectIsLoggingIn = (state: State) => state.auth.isLoggingIn;
export const selectIsFetchingProfile = (state: State) => state.auth.isFetchingProfile;
export const selectIsAccountVerified = (state: State) => state.auth.user?.account_tier !== AccountTier.Tier1;
