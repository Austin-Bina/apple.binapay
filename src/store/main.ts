import { combineReducers, configureStore, Middleware, StoreEnhancer, UnknownAction } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import { createLogMiddleware } from "./middleware/log";
import { setupListeners } from "@reduxjs/toolkit/query/react";
import { authSlice, initialState as initialAuthState } from "./slice/auth";
import { settingsSlice } from "./slice/settings";
import { initialTransactionState, transactionSlice } from "./slice/transactionSlice";
import { devToolsEnhancer } from "@redux-devtools/extension";
import ExpoFileSystemStorage from "redux-persist-expo-filesystem";
import { utilityBillsQueryApi } from "./redux-api/utilityBillsQueryApi";
import { accountTransactionsApi } from "./redux-api/accountTransactionsApi";
import { referralQueryApi } from "./redux-api/referralQueryApi";
import { notificationsApi } from "./redux-api/notificationApi";
import { supportApi } from "./redux-api/supportApi";
import { systemSettingsApi } from "./redux-api/systemSettingsApi";
import { accountsApi } from "./redux-api/accountsApi";
import { p2pApi } from "@store/redux-api/p2p";
import { fundsApi } from "@store/redux-api/fundsApi";
import { kycApi } from "@store/redux-api/kycApi";
import { statementApi } from "@store/redux-api/statementApi";

const defaultReducer = combineReducers({
  auth: authSlice.reducer,
  settings: settingsSlice.reducer,
  transaction: transactionSlice.reducer,
  [utilityBillsQueryApi.reducerPath]: utilityBillsQueryApi.reducer,
  [accountTransactionsApi.reducerPath]: accountTransactionsApi.reducer,
  [referralQueryApi.reducerPath]: referralQueryApi.reducer,
  [notificationsApi.reducerPath]: notificationsApi.reducer,
  [supportApi.reducerPath]: supportApi.reducer,
  [systemSettingsApi.reducerPath]: systemSettingsApi.reducer,
  [accountsApi.reducerPath]: accountsApi.reducer,
  [p2pApi.reducerPath]: p2pApi.reducer,
  [fundsApi.reducerPath]: fundsApi.reducer,
  [kycApi.reducerPath]: kycApi.reducer,
   [statementApi.reducerPath]: statementApi.reducer,
});

const persistedReducer = persistReducer<ReturnType<typeof defaultReducer>, UnknownAction>(
  {
    key: "binapay",
    version: 1,
    storage: ExpoFileSystemStorage,
    blacklist: ["transaction", "settings", utilityBillsQueryApi.reducerPath],
    debug: true,
  },
  (s, a) => {
    if (s && a.type === "auth/logout") {
      s = {
        settings: s.settings,
        auth: initialAuthState,
        transaction: initialTransactionState,
        [notificationsApi.reducerPath]: {} as any,
        [utilityBillsQueryApi.reducerPath]: {} as any,
        [accountTransactionsApi.reducerPath]: {} as any,
        [referralQueryApi.reducerPath]: {} as any,
        [supportApi.reducerPath]: {} as any,
        [systemSettingsApi.reducerPath]: {} as any,
        [accountsApi.reducerPath]: {} as any,
         [p2pApi.reducerPath]: {} as any,
          [fundsApi.reducerPath]: {} as any,
          [kycApi.reducerPath]: {} as any,
          [statementApi.reducerPath]: {} as any,
      };
    }

    return defaultReducer(s, a);
  },
);

export const createStore = (...middlewares: Middleware[]) =>
  configureStore({
    devTools: false,
    reducer: persistedReducer,
    middleware(getDefaultMiddleware) {
      return getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
        immutableCheck: { warnAfter: 128 },
      }).concat(...middlewares);
    },
    enhancers(getDefaultEnhancers) {
      return getDefaultEnhancers().concat(devToolsEnhancer() as StoreEnhancer);
    },
  });

export const store = createStore(
  createLogMiddleware(),
  utilityBillsQueryApi.middleware,
  accountTransactionsApi.middleware,
  referralQueryApi.middleware,
  notificationsApi.middleware,
  supportApi.middleware,
  systemSettingsApi.middleware,
  accountsApi.middleware,
  p2pApi.middleware,
  fundsApi.middleware,
  kycApi.middleware,
  statementApi.middleware,
);

export const persistor = persistStore(store);
// optional, but required for refetchOnFocus/refetchOnReconnect behaviors
// see `setupListeners` docs - takes an optional callback as the 2nd arg for customization
setupListeners(store.dispatch);

export type Store = ReturnType<typeof createStore>;
export type State = ReturnType<Store["getState"]>;
export type Dispatch = Store["dispatch"];
export type AsyncStoreSlice<R = {}, S = {}, T = {}, U = {}> =
  | ({ status: "fulfilled" } & R)
  | ({ status: "rejected" } & S)
  | ({ status: "pending" } & T)
  | ({ status: "idle" } & U);
