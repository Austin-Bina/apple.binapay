import { State } from "@store/main";

export const selectUser = (state: State) => state.auth.user;
export const selectUserId = (state: State) => state.auth.user?.id;
export const selectLoggedIn = (state: State) => !!state.auth.user?.id;
export const selectIsLoggingIn = (state: State) => state.auth.isLoggingIn;
export const selectIsFetchingProfile = (state: State) => state.auth.isFetchingProfile;
