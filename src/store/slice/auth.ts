import { RegistrationFormValues } from "src/providers/complete-registration";
import { route } from "@helpers/route";
import { showToast } from "@helpers/toast";
import API from "@lib/api";
import { saveAuthToken } from "@lib/security";
import { createSlice, createEntityAdapter, PayloadAction, EntityState } from "@reduxjs/toolkit";
import { DVA, User } from "@type/user";
import { AxiosError } from "axios";
import { WalletTransaction } from "@type/transaction";
import { accountTransactionsApi } from "@store/redux-api/accountTransactionsApi";
import { createTypedAsyncThunk } from "@store/common";
import { notificationsApi } from "@store/redux-api/notificationApi";

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
  meta: AuthMetaInfo | null;
  isLoggingIn: boolean;
  isFetchingProfile: boolean;
  newUser: boolean;
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
  newUser: false,
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
      })
      .addCase(fetchUserProfile.fulfilled, (state, { payload }) => {
        state.user = payload.user;
        state.isFetchingProfile = false;
      })
      .addCase(fetchUserProfile.rejected, (state) => {
        state.isFetchingProfile = false;
      });
  },
});

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

      showToast({ message: "We had issues processing your request. Please try again." });
      return rejectWithValue(error.response?.data);
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

      showToast({ message: "An error occurred. Please try again." });
      return rejectWithValue(error.response?.data);
    }
  },
);

const doLogout = createTypedAsyncThunk("auth/doLogout", async (_, { dispatch }) => {
  await API.post(route("auth.logout"));
  dispatch(authSliceActions.logout());
});

export const authSliceActions = { ...authSlice.actions, doLogin, doCompleteRegister, fetchUserProfile, doLogout };
