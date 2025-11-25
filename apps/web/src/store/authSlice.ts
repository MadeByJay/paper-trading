import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthenticatedUser } from './apiSlice';

export type AuthState = {
  token: string | null;
  user: AuthenticatedUser | null;
  defaultAccountId: string | null;
};

type SetCredentialsPayload = {
  token: string;
  user: AuthenticatedUser;
  defaultAccountId: string | null;
};

const initialState: AuthState = {
  token: null,
  user: null,
  defaultAccountId: null,
};

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action: PayloadAction<SetCredentialsPayload>) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.defaultAccountId = action.payload.defaultAccountId;
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
      state.defaultAccountId = null;
    },
  },
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export const authReducer = authSlice.reducer;
