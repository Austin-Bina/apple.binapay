import { combineReducers, configureStore, Middleware, StoreEnhancer, UnknownAction } from "@reduxjs/toolkit";
import { FLUSH, PAUSE, PERSIST, persistReducer, persistStore, PURGE, REGISTER, REHYDRATE } from "redux-persist";
import { createLogMiddleware } from "./middleware/log";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authSlice, initialState as initialAuthState } from "./slice/auth";
import { settingsSlice } from "./slice/settings";
import { initialTransactionState, transactionSlice } from "./slice/transactionSlice";
import devToolsEnhancer from "redux-devtools-expo-dev-plugin";
import ExpoFileSystemStorage from "redux-persist-expo-filesystem";
import { utilityBillsQueryApi } from "./redux-api/utilityBillsQueryApi";
import { accountTransactionsApi } from "./redux-api/accountTransactionsApi";

const defaultReducer = combineReducers({
  auth: authSlice.reducer,
  settings: settingsSlice.reducer,
  transaction: transactionSlice.reducer,
  [utilityBillsQueryApi.reducerPath]: utilityBillsQueryApi.reducer,
  [accountTransactionsApi.reducerPath]: accountTransactionsApi.reducer,
});

const persistedReducer = persistReducer<ReturnType<typeof defaultReducer>, UnknownAction>(
  {
    key: "Root",
    version: 1,
    storage: ExpoFileSystemStorage,
    blacklist: ["transaction", utilityBillsQueryApi.reducerPath],
    debug: true,
  },
  (s, a) => {
    if (s && a.type === "auth/logout") {
      s = {
        settings: s.settings,
        auth: initialAuthState,
        transaction: initialTransactionState,
        [utilityBillsQueryApi.reducerPath]: {} as any,
        [accountTransactionsApi.reducerPath]: {} as any,
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
