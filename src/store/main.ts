import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  combineReducers,
  configureStore,
  Middleware,
  UnknownAction,
} from "@reduxjs/toolkit";
import {
  FLUSH,
  PAUSE,
  PERSIST,
  persistReducer,
  persistStore,
  PURGE,
  REGISTER,
  REHYDRATE,
} from "redux-persist";
import { createLogMiddleware } from "./middleware/log";
import { setupListeners } from "@reduxjs/toolkit/query";
import { authSlice, initialState as initialAuthState } from "./slice/auth";
import { settingsSlice } from "./slice/settings";

const defaultReducer = combineReducers({
  auth: authSlice.reducer,
  settings: settingsSlice.reducer,
});

const persistedReducer = persistReducer<
  ReturnType<typeof defaultReducer>,
  UnknownAction
>(
  {
    key: "Root",
    version: 1,
    storage: AsyncStorage,
  },
  (s, a) => {
    if (s && a.type === "auth/logout") {
      s = { settings: s.settings, auth: initialAuthState };
    }

    return defaultReducer(s, a);
  }
);

export const createStore = (...middlewares: Middleware[]) =>
  configureStore({
    devTools: __DEV__,
    reducer: persistedReducer,
    middleware(getDefaultMiddleware) {
      return getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
        immutableCheck: { warnAfter: 128 },
      }).concat(...middlewares);
    },
  });

export const store = createStore(createLogMiddleware());
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

