import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AuthState,
  AuthUser,
  LoginPayload,
  SignUpPayload,
  VerifyMfaPayload,
  PendingSession,
} from './types';
import { authApi } from './api/authApi';
import { tokenService } from './api/tokenService';
import type { RootState } from '../../app/store';

const initialState: AuthState = {
  user: null,
  tokens: null,
  pendingUser: null,
  pendingSessionId: null,
  mfaRequired: false,
  persistSession: false,
  mfaMessage: null,
  status: {
    bootstrap: 'idle',
    signUp: 'idle',
    login: 'idle',
    verifyMfa: 'idle',
    logout: 'idle',
    refresh: 'idle',
  },
  error: null,
};

const mapError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred.';
};

export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  async (_, { rejectWithValue }) => {
    try {
      const tokens = await tokenService.loadTokens();
      const pendingSession = await tokenService.loadPendingSession();

      if (!tokens) {
        return {
          tokens: null,
          user: null,
          pendingSession,
        };
      }

      const session = await authApi.rehydrate(tokens);

      if (!session) {
        await tokenService.clearTokens();
        return {
          tokens: null,
          user: null,
          pendingSession,
        };
      }

      return {
        tokens: session.tokens,
        user: session.user,
        pendingSession,
      };
    } catch (error) {
      return rejectWithValue(mapError(error));
    }
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (payload: SignUpPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.signUp(payload);
      await tokenService.storePendingSession({
        sessionId: response.sessionId,
        email: response.user.email,
        name: response.user.name,
        persistSession: payload.rememberDevice ?? false,
        issuedAt: Date.now(),
      });
      return {
        ...response,
        persistSession: payload.rememberDevice ?? false,
      };
    } catch (error) {
      return rejectWithValue(mapError(error));
    }
  }
);

export const login = createAsyncThunk(
  'auth/login',
  async (payload: LoginPayload, { rejectWithValue }) => {
    try {
      const response = await authApi.login(payload);
      await tokenService.storePendingSession({
        sessionId: response.sessionId,
        email: response.user.email,
        name: response.user.name,
        persistSession: payload.rememberDevice ?? false,
        issuedAt: Date.now(),
      });
      return {
        ...response,
        persistSession: payload.rememberDevice ?? false,
      };
    } catch (error) {
      return rejectWithValue(mapError(error));
    }
  }
);

export const verifyMfa = createAsyncThunk(
  'auth/verifyMfa',
  async (payload: VerifyMfaPayload, { getState, rejectWithValue }) => {
    try {
      const result = await authApi.verifyMfa(payload);
      const persistSession = (getState() as RootState).auth.persistSession;
      await tokenService.persistTokens(result.tokens, { persist: persistSession });
      await tokenService.clearPendingSession();
      return result;
    } catch (error) {
      return rejectWithValue(mapError(error));
    }
  }
);

export const refreshSession = createAsyncThunk(
  'auth/refreshSession',
  async (_, { getState, rejectWithValue }) => {
    try {
      const tokens = await tokenService.loadTokens();
      if (!tokens) {
        throw new Error('No active session to refresh.');
      }
      const persistSession = (getState() as RootState).auth.persistSession;
      const result = await authApi.refreshTokens(tokens.refreshToken);
      await tokenService.persistTokens(result.tokens, { persist: persistSession });
      return result;
    } catch (error) {
      return rejectWithValue(mapError(error));
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { tokens } = (getState() as RootState).auth;
      if (tokens) {
        await authApi.logout(tokens);
      }
      await tokenService.clearTokens();
      await tokenService.clearPendingSession();
      return;
    } catch (error) {
      return rejectWithValue(mapError(error));
    }
  }
);

const setAsyncStatus = (state: AuthState, key: keyof AuthState['status'], value: AuthState['status'][typeof key]) => {
  state.status[key] = value;
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    setPersistSession(state, action: PayloadAction<boolean>) {
      state.persistSession = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(bootstrapAuth.pending, (state) => {
        setAsyncStatus(state, 'bootstrap', 'loading');
      })
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        setAsyncStatus(state, 'bootstrap', 'succeeded');
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        if (action.payload.tokens) {
          state.mfaRequired = false;
        }
        if (action.payload.pendingSession) {
          state.pendingSessionId = action.payload.pendingSession.sessionId;
          state.persistSession = action.payload.pendingSession.persistSession ?? false;
          state.pendingUser = action.payload.pendingSession.pendingUser ?? null;
          state.mfaRequired = true;
        }
        state.error = null;
      })
      .addCase(bootstrapAuth.rejected, (state, action) => {
        setAsyncStatus(state, 'bootstrap', 'failed');
        state.error = action.payload as string;
        state.tokens = null;
        state.user = null;
      })
      .addCase(signUp.pending, (state) => {
        setAsyncStatus(state, 'signUp', 'loading');
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        setAsyncStatus(state, 'signUp', 'succeeded');
        state.pendingSessionId = action.payload.sessionId;
        state.pendingUser = action.payload.user;
        state.mfaRequired = action.payload.mfaRequired;
        state.persistSession = action.payload.persistSession;
      })
      .addCase(signUp.rejected, (state, action) => {
        setAsyncStatus(state, 'signUp', 'failed');
        state.error = action.payload as string;
      })
      .addCase(login.pending, (state) => {
        setAsyncStatus(state, 'login', 'loading');
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        setAsyncStatus(state, 'login', 'succeeded');
        state.pendingSessionId = action.payload.sessionId;
        state.pendingUser = action.payload.user;
        state.mfaRequired = action.payload.mfaRequired;
        state.persistSession = action.payload.persistSession;
      })
      .addCase(login.rejected, (state, action) => {
        setAsyncStatus(state, 'login', 'failed');
        state.error = action.payload as string;
      })
      .addCase(verifyMfa.pending, (state) => {
        setAsyncStatus(state, 'verifyMfa', 'loading');
        state.error = null;
      })
      .addCase(verifyMfa.fulfilled, (state, action) => {
        setAsyncStatus(state, 'verifyMfa', 'succeeded');
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
        state.pendingSessionId = null;
        state.pendingUser = null;
        state.mfaRequired = false;
      })
      .addCase(verifyMfa.rejected, (state, action) => {
        setAsyncStatus(state, 'verifyMfa', 'failed');
        state.error = action.payload as string;
      })
      .addCase(refreshSession.pending, (state) => {
        setAsyncStatus(state, 'refresh', 'loading');
      })
      .addCase(refreshSession.fulfilled, (state, action) => {
        setAsyncStatus(state, 'refresh', 'succeeded');
        state.tokens = action.payload.tokens;
        state.user = action.payload.user;
      })
      .addCase(refreshSession.rejected, (state, action) => {
        setAsyncStatus(state, 'refresh', 'failed');
        state.error = action.payload as string;
      })
      .addCase(logout.pending, (state) => {
        setAsyncStatus(state, 'logout', 'loading');
      })
      .addCase(logout.fulfilled, (state) => {
        setAsyncStatus(state, 'logout', 'succeeded');
        state.tokens = null;
        state.user = null;
        state.pendingSessionId = null;
        state.pendingUser = null;
        state.mfaRequired = false;
        state.persistSession = false;
      })
      .addCase(logout.rejected, (state, action) => {
        setAsyncStatus(state, 'logout', 'failed');
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthError, setPersistSession } = authSlice.actions;

export const selectAuthState = (state: RootState) => state.auth;
export const selectIsAuthenticated = (state: RootState) => Boolean(state.auth.tokens);
export const selectAuthUser = (state: RootState): AuthUser | null => state.auth.user;
export const selectAuthError = (state: RootState) => state.auth.error;
export const selectAuthStatus = (state: RootState) => state.auth.status;
export const selectPendingSession = (state: RootState): PendingSession | null => {
  if (!state.auth.pendingSessionId) {
    return null;
  }
  return {
    sessionId: state.auth.pendingSessionId,
    pendingUser: state.auth.pendingUser,
    persistSession: state.auth.persistSession,
  };
};

export default authSlice.reducer;
