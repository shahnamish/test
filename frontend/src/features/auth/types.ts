export type AsyncStatus = 'idle' | 'loading' | 'succeeded' | 'failed';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  lastLoginAt?: string;
  mfaEnabled: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

export interface PendingUser {
  id: string;
  email: string;
  name?: string;
}

export interface PendingSession {
  sessionId: string;
  pendingUser: PendingUser | null;
  persistSession: boolean;
  message?: string;
  issuedAt?: number;
}

export interface StoredPendingSession {
  sessionId: string;
  email: string;
  name?: string;
  persistSession: boolean;
  message?: string;
  issuedAt: number;
}

export interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  pendingUser: PendingUser | null;
  pendingSessionId: string | null;
  mfaRequired: boolean;
  persistSession: boolean;
  mfaMessage: string | null;
  status: {
    bootstrap: AsyncStatus;
    signUp: AsyncStatus;
    login: AsyncStatus;
    verifyMfa: AsyncStatus;
    logout: AsyncStatus;
    refresh: AsyncStatus;
  };
  error: string | null;
}

export interface SignUpPayload {
  email: string;
  password: string;
  name?: string;
  rememberDevice?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberDevice?: boolean;
}

export interface VerifyMfaPayload {
  sessionId: string;
  code: string;
}

export interface SignUpResponse {
  sessionId: string;
  user: PendingUser;
  mfaRequired: boolean;
  message?: string;
}

export interface LoginResponse {
  sessionId: string;
  user: PendingUser;
  mfaRequired: boolean;
  message?: string;
}

export interface VerifyMfaResponse {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface RefreshResponse {
  tokens: AuthTokens;
  user: AuthUser;
}

export interface RehydrateResponse {
  tokens: AuthTokens;
  user: AuthUser;
}
