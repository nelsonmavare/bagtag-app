import { createSlice } from "@reduxjs/toolkit";
import { Auth, User } from "@/src/utils/types";

interface SliceState {
  auth: Auth | undefined;
  user: User | undefined;
  userAuthToken: string | undefined;
  emailToRecoverPassword: string | undefined;
}

const initialState: SliceState = {
  auth: undefined,
  user: undefined,
  userAuthToken: undefined,
  emailToRecoverPassword: undefined,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuth: (state, action: { payload: Auth | undefined }) => {
      state.auth = action.payload;
    },
    setUser: (state, action: { payload: User | undefined }) => {
      state.user = action.payload;
    },
    setAuthToken: (state, action: { payload: string | undefined }) => {
      state.userAuthToken = action.payload;
    },
    setEmailToRecoverPassword: (state, action: { payload: string | undefined }) => {
      state.emailToRecoverPassword = action.payload;
    },
  },
});

export const { setUser, setAuthToken, setEmailToRecoverPassword, setAuth } = authSlice.actions;

export const selectAuth = (state: { auth: SliceState }): Auth | undefined => state.auth.auth;

export const selectUserLogged = (state: { auth: SliceState }): User | undefined => state.auth.user;

export const selectAuthToken = (state: { auth: SliceState }): string | undefined =>
  state.auth.userAuthToken;

export const selectEmailToRecoverPassword = (state: { auth: SliceState }): string | undefined =>
  state.auth.emailToRecoverPassword;

export default authSlice.reducer;
