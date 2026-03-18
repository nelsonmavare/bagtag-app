import { /* Tuple, */ configureStore } from "@reduxjs/toolkit";
import { combineReducers } from "redux";
// import thunk from 'redux-thunk';
import AuthSlice from "./AuthSlice";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
/* import thunk from 'redux-thunk'; */
import AsyncStorage from "@react-native-async-storage/async-storage";
import TagSlice from "./TagSlice";
import AppSlice from "./AppSlice";
const rootReducer = combineReducers({
  auth: AuthSlice,
  tag: TagSlice,
  app: AppSlice,
});

const persistConfig = {
  key: "root",
  storage: AsyncStorage,
  whitelist: ["auth" /* "app" */],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const reduxStore = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistedStore = persistStore(reduxStore);
