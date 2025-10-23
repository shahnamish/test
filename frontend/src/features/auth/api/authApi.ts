import type {
  SignUpPayload,
  LoginPayload,
  VerifyMfaPayload,
  SignUpResponse,
  LoginResponse,
  VerifyMfaResponse,
  RefreshResponse,
  RehydrateResponse,
  AuthUser,
  AuthTokens,
} from '../types';
import { getStorage } from '../../../utils/storage';

const PREFIX = 'react-security';
const USERS_KEY = `${PREFIX}:users`;
const SESSIONS_KEY = `${PREFIX}:sessions`;
const TOKENS_KEY = `${PREFIX}:tokens`;

const ACCESS_TOKEN_TTL = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days
const MFA_SESSION_TTL = 10 * 60 * 1000; // 10 minutes
const DEMO_MFA_CODE = '123456';

interface StoredUser extends AuthUser {
  passwordHash: string;
}

interface StoredSession {
  sessionId: string;
  userId: string;
  code: string;
  createdAt: number;
  expiresAt: number;
  message: string;
}

interface StoredToken {
  userId: string;
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number;
  refreshExpiresAt: number;
  createdAt: number;
}

const localStorageAdapter = getStorage('local');

const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

const readCollection = <T>(key: string): T[] => {
  const raw = localStorageAdapter.getItem(key);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw) as T[];
  } catch (error) {
    console.warn(`Failed to parse storage key ${key}`, error);
    return [];
  }
};

const writeCollection = <T>(key: string, values: T[]) => {
  localStorageAdapter.setItem(key, JSON.stringify(values));
};

const sanitizeUser = (user: StoredUser): AuthUser => ({
  id: user.id,
  email: user.email,
  name: user.name,
  createdAt: user.createdAt,
  lastLoginAt: user.lastLoginAt,
  mfaEnabled: user.mfaEnabled,
});

const randomString = () => {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

const hashPassword = async (password: string) => {
  const encoder = new TextEncoder();
  const cryptoObj = globalThis.crypto;

  if (cryptoObj?.subtle) {
    const data = encoder.encode(password);
    const digest = await cryptoObj.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('');
  }

  // Fallback hash for non-crypto environments (not secure, used for tests only)
  return password
    .split('')
    .reverse()
    .join('');
};

const generateMfaCode = () => DEMO_MFA_CODE;

const pruneExpiredSessions = () => {
  const sessions = readCollection<StoredSession>(SESSIONS_KEY);
  const now = Date.now();
  const filtered = sessions.filter((session) => session.expiresAt > now);
  writeCollection(SESSIONS_KEY, filtered);
};

const pruneExpiredTokens = () => {
  const tokens = readCollection<StoredToken>(TOKENS_KEY);
  const now = Date.now();
  const filtered = tokens.filter((token) => token.refreshExpiresAt > now);
  writeCollection(TOKENS_KEY, filtered);
};

const issueTokens = (userId: string): { tokens: AuthTokens; record: StoredToken } => {
  const accessToken = `${userId}.${randomString()}`;
  const refreshToken = `${randomString()}.${userId}`;
  const createdAt = Date.now();
  const accessExpiresAt = createdAt + ACCESS_TOKEN_TTL;
  const refreshExpiresAt = createdAt + REFRESH_TOKEN_TTL;

  return {
    tokens: {
      accessToken,
      refreshToken,
      expiresAt: accessExpiresAt,
      refreshExpiresAt,
    },
    record: {
      userId,
      accessToken,
      refreshToken,
      accessExpiresAt,
      refreshExpiresAt,
      createdAt,
    },
  };
};

const persistTokenRecord = (record: StoredToken) => {
  pruneExpiredTokens();
  const tokens = readCollection<StoredToken>(TOKENS_KEY).filter((entry) => entry.userId !== record.userId);
  tokens.push(record);
  writeCollection(TOKENS_KEY, tokens);
};

const findTokenByAccess = (accessToken: string): StoredToken | undefined => {
  return readCollection<StoredToken>(TOKENS_KEY).find((token) => token.accessToken === accessToken);
};

const findTokenByRefresh = (refreshToken: string): StoredToken | undefined => {
  return readCollection<StoredToken>(TOKENS_KEY).find((token) => token.refreshToken === refreshToken);
};

const revokeTokensForUser = (userId: string) => {
  const tokens = readCollection<StoredToken>(TOKENS_KEY).filter((token) => token.userId !== userId);
  writeCollection(TOKENS_KEY, tokens);
};

const revokeTokensByAccess = (accessToken: string) => {
  const tokens = readCollection<StoredToken>(TOKENS_KEY).filter((token) => token.accessToken !== accessToken);
  writeCollection(TOKENS_KEY, tokens);
};

const createPendingSession = (user: StoredUser, message: string): SignUpResponse => {
  pruneExpiredSessions();
  const sessions = readCollection<StoredSession>(SESSIONS_KEY);
  const sessionId = randomString();
  const newSession: StoredSession = {
    sessionId,
    userId: user.id,
    code: generateMfaCode(),
    createdAt: Date.now(),
    expiresAt: Date.now() + MFA_SESSION_TTL,
    message,
  };
  writeCollection(SESSIONS_KEY, [...sessions, newSession]);

  return {
    sessionId,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
    mfaRequired: true,
    message,
  };
};

const findUserByEmail = (email: string): StoredUser | undefined => {
  const users = readCollection<StoredUser>(USERS_KEY);
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
};

const upsertUser = (updatedUser: StoredUser) => {
  const users = readCollection<StoredUser>(USERS_KEY);
  const next = users.filter((user) => user.id !== updatedUser.id);
  next.push(updatedUser);
  writeCollection(USERS_KEY, next);
};

export const authApi = {
  async signUp(payload: SignUpPayload): Promise<SignUpResponse> {
    await delay();
    const existingUser = findUserByEmail(payload.email);
    if (existingUser) {
      throw new Error('An account already exists with this email address.');
    }

    const passwordHash = await hashPassword(payload.password);
    const now = new Date().toISOString();
    const user: StoredUser = {
      id: randomString(),
      email: payload.email.toLowerCase(),
      name: payload.name ?? payload.email.split('@')[0],
      passwordHash,
      createdAt: now,
      lastLoginAt: now,
      mfaEnabled: true,
    };

    const users = readCollection<StoredUser>(USERS_KEY);
    users.push(user);
    writeCollection(USERS_KEY, users);

    return createPendingSession(user, 'Check your authenticator for the verification code.');
  },

  async login(payload: LoginPayload): Promise<LoginResponse> {
    await delay();
    const user = findUserByEmail(payload.email);
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const passwordHash = await hashPassword(payload.password);
    if (user.passwordHash !== passwordHash) {
      throw new Error('Invalid email or password.');
    }

    user.lastLoginAt = new Date().toISOString();
    upsertUser(user);

    return createPendingSession(user, 'Complete MFA to finish signing in.');
  },

  async verifyMfa(payload: VerifyMfaPayload): Promise<VerifyMfaResponse> {
    await delay();
    pruneExpiredSessions();
    const sessions = readCollection<StoredSession>(SESSIONS_KEY);
    const session = sessions.find((entry) => entry.sessionId === payload.sessionId);

    if (!session) {
      throw new Error('Verification session expired. Please sign in again.');
    }

    if (session.code !== payload.code) {
      throw new Error('Invalid verification code.');
    }

    const users = readCollection<StoredUser>(USERS_KEY);
    const user = users.find((record) => record.id === session.userId);

    if (!user) {
      throw new Error('Account not found. Please contact support.');
    }

    const { tokens, record } = issueTokens(user.id);
    persistTokenRecord(record);

    const remainingSessions = sessions.filter((entry) => entry.sessionId !== payload.sessionId);
    writeCollection(SESSIONS_KEY, remainingSessions);

    user.lastLoginAt = new Date().toISOString();
    upsertUser(user);

    return {
      tokens,
      user: sanitizeUser(user),
    };
  },

  async refreshTokens(refreshToken: string): Promise<RefreshResponse> {
    await delay(150);
    pruneExpiredTokens();
    const storedToken = findTokenByRefresh(refreshToken);
    if (!storedToken) {
      throw new Error('Session expired. Please sign in again.');
    }

    if (Date.now() > storedToken.refreshExpiresAt) {
      revokeTokensForUser(storedToken.userId);
      throw new Error('Session expired. Please sign in again.');
    }

    const users = readCollection<StoredUser>(USERS_KEY);
    const user = users.find((record) => record.id === storedToken.userId);
    if (!user) {
      revokeTokensForUser(storedToken.userId);
      throw new Error('Account not found.');
    }

    const { tokens, record } = issueTokens(user.id);
    persistTokenRecord(record);

    return {
      tokens,
      user: sanitizeUser(user),
    };
  },

  async rehydrate(tokens: AuthTokens): Promise<RehydrateResponse | null> {
    await delay(100);
    pruneExpiredTokens();
    const storedToken = findTokenByAccess(tokens.accessToken);
    if (!storedToken) {
      return null;
    }

    if (Date.now() > storedToken.accessExpiresAt) {
      return null;
    }

    const users = readCollection<StoredUser>(USERS_KEY);
    const user = users.find((record) => record.id === storedToken.userId);

    if (!user) {
      revokeTokensForUser(storedToken.userId);
      return null;
    }

    return {
      tokens: {
        accessToken: storedToken.accessToken,
        refreshToken: storedToken.refreshToken,
        expiresAt: storedToken.accessExpiresAt,
        refreshExpiresAt: storedToken.refreshExpiresAt,
      },
      user: sanitizeUser(user),
    };
  },

  async logout(tokens: AuthTokens): Promise<void> {
    await delay(50);
    revokeTokensByAccess(tokens.accessToken);
  },
};
