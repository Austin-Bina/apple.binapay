import { RegistrationFormValues } from "src/providers/complete-registration";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import API from "@lib/api";
import { saveAuthToken } from "@lib/security";
import { createSlice, createEntityAdapter, PayloadAction, EntityState } from "@reduxjs/toolkit";
import { User, WalletBalances, CryptoAsset, Network } from "@type/user";
import { AxiosError } from "axios";
import { WalletTransaction } from "@type/transaction";
import { accountTransactionsApi } from "@store/redux-api/accountTransactionsApi";
import { createTypedAsyncThunk } from "@store/common";
import { routes } from "@constants/routes";

interface AuthMetaInfo {
  access_token: string;
  pubsub_token: string;
}

type AccountSummary = {
  profile: User;
  account_summary: {
    recent_transactions: {
      [group: string]: WalletTransaction[];
    };
    unread_notifications: number;
  };
};

interface AuthState extends EntityState<User, string> {
  user: User | null;
   contact?: {
    phone?: string;
    whatsapp?: string;
    support_url?: string;
  };
  meta: AuthMetaInfo | null;
  isLoggingIn: boolean;
  isFetchingProfile: boolean;
  hasProfileError: boolean;
  newUser: boolean;
  adminNgnUsdtRate?: { buy: number; sell: number } | null;
   spreadConfig?: { spreadType: string; spread: number } | null;
}

interface LoginResponse {
  user: User;
  meta: AuthMetaInfo;
}

interface LoginPayload {
  email: string;
  password: string;
}

type RegisterPayload = RegistrationFormValues;

type UserProfile = {
  user: User;
  transactions: {
    [group: string]: WalletTransaction[];
  };
};

export const authAdapter = createEntityAdapter<User>();
export const initialState: AuthState = authAdapter.getInitialState({
  user: null,
  
  meta: null,
  isLoggingIn: false,
  isFetchingProfile: false,
  hasProfileError: false,
  newUser: false,
  adminNgnUsdtRate: null,
});

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      // in rootReducer, there is an action to CLEAR the complete Redux Store's state
    },
    resetAuth: (state) => {
      state.isLoggingIn = false;
    },
    updateUser(state, action: PayloadAction<Partial<User>>) {
      if (state.user) {
        state.user = {
          ...state.user,
          ...action.payload,
        };
      }
    },
    completeOnboarding(state) {
      state.newUser = false;
    },

    


updateSpreadConfig(state, action: PayloadAction<{ spreadType: string; spread: number }>) {
  state.spreadConfig = action.payload;
},

    updateAdminNgnUsdtRate(state, action: PayloadAction<{ buy: number; sell: number }>) {
  state.adminNgnUsdtRate = action.payload;
},
 updateContact(state, action: PayloadAction<{ phone?: string; whatsapp?: string; support_url?: string }>) {
      state.contact = action.payload;
    },


  },
  extraReducers: (builder) => {
    builder
      .addCase(doLogin.pending, (state) => {
        state.isLoggingIn = true;
      })
      .addCase(doLogin.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.meta = payload.meta;
        state.isLoggingIn = false;
      })
      .addCase(doLogin.rejected, (state) => {
        state.isLoggingIn = false;
      })
      .addCase(doLogout.pending, (state) => {
        state.isLoggingIn = true;
      })
      .addCase(doLogout.fulfilled, (state) => {
        state.isLoggingIn = false;
      })
      .addCase(doLogout.rejected, (state) => {
        state.isLoggingIn = false;
      })
      .addCase(doCompleteRegister.pending, (state) => {
        state.isLoggingIn = true;
      })
      .addCase(doCompleteRegister.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.meta = payload.meta;
        state.isLoggingIn = false;
        state.newUser = true;
      })
      .addCase(doCompleteRegister.rejected, (state) => {
        state.isLoggingIn = false;
      })
      // Fetch user profile async actions
      .addCase(fetchUserProfile.pending, (state) => {
        state.isFetchingProfile = true;
        state.hasProfileError = false;
      })
      .addCase(fetchUserProfile.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.isFetchingProfile = false;
        state.hasProfileError = false;
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.isFetchingProfile = false;
        state.hasProfileError = true;
      });
  },
});


const fetchUserProfile = createTypedAsyncThunk<Pick<UserProfile, "user">>(
  "auth/fetchUserProfile",
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      // ── CRITICAL: only 3 calls needed for dashboard ──────────────────
      const [profileResponse, walletsResponse] = await Promise.all([
        API.get(route("account.getProfile")),
        API.get("/api/v1/wallets"),
      ]);

      const { profile, account_summary } = profileResponse.data as AccountSummary;
      const wallets = walletsResponse.data.wallets;

      const walletBalances: WalletBalances = {};
      wallets.forEach((wallet: any) => {
        walletBalances[wallet.slug] = {
          name: wallet.name,
          balance: wallet.balance.toString(),
        };
      });

      // Keep crypto_usd from existing state if present — don't re-fetch
      const state = getState() as any;
      const existingUser = state.auth.user;
      if (existingUser?.wallet_balances?.crypto_usd) {
        walletBalances["crypto_usd"] = existingUser.wallet_balances.crypto_usd;
      }

      const userWithWallets = {
        ...profile,
        wallet_balances: walletBalances,
        // Preserve existing crypto_assets — don't re-fetch on every dashboard visit
        crypto_assets: existingUser?.crypto_assets ?? [],
        userBankAccounts: existingUser?.userBankAccounts ?? [],
      };

      dispatch(authSliceActions.updateUser(userWithWallets));
      dispatch(
        accountTransactionsApi.util.updateQueryData(
          "fetchRecentTransactions",
          undefined,
          (draft) => {
            draft.transactions = account_summary.recent_transactions;
          },
        ),
      );

      return { user: userWithWallets };
    } catch (error: any) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;
      if (response?.status === 401) {
        dispatch(authSliceActions.logout());
        return rejectWithValue(response.data);
      }
      if (response) {
        const message = response.data?.message;
        showToast({
          message: typeof message === "string" ? message : "We had issues processing your request. Please try again.",
        });
        return rejectWithValue(response.data);
      }
      return rejectWithValue(error.response?.data);
    }
  },
);


/**
 * Justice code thats working
 */
/*
const fetchUserProfile = createTypedAsyncThunk<Pick<UserProfile, "user">>(
  "auth/fetchUserProfile",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const response = await API.get(route("account.getProfile"));
      const { profile, account_summary } = response.data as AccountSummary;

      const { recent_transactions } = account_summary;

      dispatch(
        accountTransactionsApi.util.updateQueryData("fetchRecentTransactions", undefined, (draft) => {
          draft.transactions = recent_transactions;
        }),
      );

      return {
        user: profile,
      };
    } catch (error: any) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response?.status === 401) {
        dispatch(authSliceActions.logout());

        return rejectWithValue(response.data);
      }

      if (response) {
        const { message } = response.data;

        if (message && typeof message === "string") {
          showToast({ message });
        } else {
          showToast({ message: "We had issues processing your request. Please try again." });
        }

        return rejectWithValue(response.data);
      }

      return rejectWithValue(error.response?.data);
    }
  },
);

*/
const fetchAppConfig = createTypedAsyncThunk(
  "auth/fetchAppConfig",
  async (_, { dispatch, getState }) => {
    try {
      const state = getState() as any;
      const existingUser = state.auth.user;

      // Run all non-critical fetches in parallel
      const [totalUsdRes, cryptoRes, rateRes, bankRes, contactRes] = await Promise.allSettled([
        API.get(routes.api.v1.auth.totalcryptousd),
        API.get<{ success: boolean; data: CryptoAsset[] }>(routes.api.v1.services.cryptoAssets),
        API.get(routes.api.v1.auth.ratesandspread),
        API.get(routes.api.v1.services.wallets.userwallet),
        API.get("/api/v1/contact-settings"),
      ]);

      const updates: any = {};

      // Total crypto USD
      if (totalUsdRes.status === "fulfilled") {
        const totalCryptoUsd = totalUsdRes.value.data.totalCryptoUsd ?? 0;
        updates.wallet_balances = {
          ...(existingUser?.wallet_balances ?? {}),
          crypto_usd: { name: "Total Crypto USD", balance: totalCryptoUsd.toString() },
        };
      }

      // Crypto assets
      if (cryptoRes.status === "fulfilled" && cryptoRes.value.data.success) {
        updates.crypto_assets = cryptoRes.value.data.data;
      }

      // Rates and spread
      if (rateRes.status === "fulfilled" && rateRes.value.data.success) {
        const { ngn_usdt_rate, spread } = rateRes.value.data.data;
        if (ngn_usdt_rate) {
          dispatch(authSliceActions.updateAdminNgnUsdtRate({
            buy: parseFloat(ngn_usdt_rate.buy_rate),
            sell: parseFloat(ngn_usdt_rate.sell_rate),
          }));
        }
        if (spread) {
          dispatch(authSliceActions.updateSpreadConfig({
            spreadType: spread.spread_type,
            spread: parseFloat(spread.spread),
          }));
        }
      }

      // Bank accounts
      if (bankRes.status === "fulfilled") {
        updates.userBankAccounts = bankRes.value.data.bank_accounts ?? [];
      }

      // Contact
      if (contactRes.status === "fulfilled") {
        dispatch(authSliceActions.updateContact(contactRes.value.data?.data ?? {}));
      }

      if (Object.keys(updates).length > 0) {
        dispatch(authSliceActions.updateUser(updates));
      }
    } catch (e) {
      // Non-critical — silently fail
      console.log("fetchAppConfig error:", e);
    }
  }
); 


const fetchUserProfileSilent = createTypedAsyncThunk<Pick<UserProfile, "user">>(
  "auth/fetchUserProfileSilent",  // different action type — won't trigger isFetchingProfile
  async (_, { rejectWithValue, dispatch, getState }) => {
    try {
      const [profileResponse, walletsResponse] = await Promise.all([
        API.get(route("account.getProfile")),
        API.get("/api/v1/wallets"),
      ]);

      const { profile, account_summary } = profileResponse.data as AccountSummary;
      const wallets = walletsResponse.data.wallets;

      const walletBalances: WalletBalances = {};
      wallets.forEach((wallet: any) => {
        walletBalances[wallet.slug] = {
          name: wallet.name,
          balance: wallet.balance.toString(),
        };
      });

      const state = getState() as any;
      const existingUser = state.auth.user;
      if (existingUser?.wallet_balances?.crypto_usd) {
        walletBalances["crypto_usd"] = existingUser.wallet_balances.crypto_usd;
      }

      const userWithWallets = {
        ...profile,
        wallet_balances: walletBalances,
        crypto_assets: existingUser?.crypto_assets ?? [],
        userBankAccounts: existingUser?.userBankAccounts ?? [],
      };

      // Directly update user without triggering isFetchingProfile
      dispatch(authSliceActions.updateUser(userWithWallets));
      dispatch(
        accountTransactionsApi.util.updateQueryData(
          "fetchRecentTransactions",
          undefined,
          (draft) => {
            draft.transactions = account_summary.recent_transactions;
          },
        ),
      );

      return { user: userWithWallets };
    } catch {
      // Silent — never show errors to user for background fetches
      return { user: (getState() as any).auth.user };
    }
  },
);


const doCompleteRegister = createTypedAsyncThunk<LoginResponse, RegisterPayload>(
  "auth/doRegister",
  async (form, { rejectWithValue }) => {
    try {
      const response = await API.post(route("auth.completeOnboarding"), form);

      const { user, meta } = response.data;
      await saveAuthToken(meta.access_token);

      return {
        user,
        meta,
      };
    } catch (error: any) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        const { message } = response.data;

        const hasAuthErrorMsg = message && typeof message === "string";

        if (hasAuthErrorMsg) {
          showToast({ message: message });
        } else {
          showToast({ message: "An error occurred. Please try again." });
        }

        if (!message) {
          throw message;
        }

        return rejectWithValue(response.data);
      }

      showToast({ message: "An error occurred. Please try again." });
      return rejectWithValue(error.response?.data);
    }
  },
);

const doLogin = createTypedAsyncThunk<LoginResponse, LoginPayload>(
  "auth/doLogin",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const response = await API.post(route("auth.login"), {
        email,
        password,
      });

      const { user, meta } = response.data;

      await saveAuthToken(meta.access_token);

      return {
        user,
        meta,
      };
    } catch (error: any) {
      const axiosError = error as AxiosError<any>;
      const { response } = axiosError;

      if (response) {
        return rejectWithValue(response.data);
      }

      return rejectWithValue(error?.message);
    }
  },
);

const doLogout = createTypedAsyncThunk("auth/doLogout", async (_, { dispatch }) => {
  await API.post(route("auth.logout"));
  dispatch(authSliceActions.logout());
});

export const authSliceActions = { ...authSlice.actions, fetchUserProfileSilent,  doLogin, doCompleteRegister, fetchUserProfile, fetchAppConfig, doLogout };
