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
      const state = getState() as any;
      // Fetch profile first
      const profileResponse = await API.get(route("account.getProfile"));
      const { profile, account_summary } = profileResponse.data as AccountSummary;

      // Fetch wallets separately
      const walletsResponse = await API.get("/api/v1/wallets");
      const wallets = walletsResponse.data.wallets;

      // Map wallet balances dynamically using slug
      const walletBalances: WalletBalances = {};
      wallets.forEach((wallet: any) => {
        walletBalances[wallet.slug] = {
          name: wallet.name,
          balance: wallet.balance.toString(),
        };
      });

      // Fetch totalCryptoUsd
const totalUsdRes = await API.get(routes.api.v1.auth.totalcryptousd);
const totalCryptoUsd = totalUsdRes.data.totalCryptoUsd ?? 0;

      // Add totalCryptoUsd as a wallet
walletBalances["crypto_usd"] = {
  name: "Total Crypto USD",
  balance: totalCryptoUsd.toString(),
};
       // 4️⃣ Fetch crypto assets from API
      const cryptoRes = await API.get<{ success: boolean; data: CryptoAsset[] }>(
        routes.api.v1.services.cryptoAssets
      );

      const cryptoAssets: CryptoAsset[] = cryptoRes.data.data;

       // 4️⃣ Fetch admin NGN/USDT rate and spread
     
 const rateRes = await API.get(routes.api.v1.auth.ratesandspread);

 
console.log("Full rates and spread response:", rateRes.data);

if (rateRes.data.success) {
  const { ngn_usdt_rate, spread } = rateRes.data.data;

 if (ngn_usdt_rate) {
  const { buy_rate, sell_rate } = ngn_usdt_rate;
  dispatch(
    authSliceActions.updateAdminNgnUsdtRate({
      buy: parseFloat(buy_rate),   // convert string to number
      sell: parseFloat(sell_rate), // convert string to number
    })
  );
}

if (spread) {
  dispatch(
    authSliceActions.updateSpreadConfig({
      spreadType: spread.spread_type,
      spread: parseFloat(spread.spread), // already fine
    })
  );
}


}


        // Fetch user bank accounts 
         const res = await API.get(routes.api.v1.services.wallets.userwallet);
          const userBankAccounts = res.data.bank_accounts || [];

      
    
      
      // Fetch contact info
const contactRes = await API.get("/api/v1/contact-settings");
const contact = contactRes.data?.data || {};

// Save to Redux
dispatch(authSliceActions.updateContact(contact));


      // Merge wallet balances into user profile
      const userWithWallets = {
        ...profile,
        wallet_balances: walletBalances,
         crypto_assets: cryptoAssets,
          userBankAccounts,        
      };

      // Save user to Redux store
      dispatch(authSliceActions.updateUser(userWithWallets));

      // Update transactions cache
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
          message:
            typeof message === "string"
              ? message
              : "We had issues processing your request. Please try again.",
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

export const authSliceActions = { ...authSlice.actions,  doLogin, doCompleteRegister, fetchUserProfile, doLogout };
