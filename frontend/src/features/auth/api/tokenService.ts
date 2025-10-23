import type { AuthTokens, PendingSession, StoredPendingSession } from '../types';
import { SecureStorage } from '../../../utils/secureStorage';
import { getStorage } from '../../../utils/storage';

const TOKEN_KEY = 'tokens';
const PENDING_SESSION_KEY = 'pending-session';

const sessionStorageSecure = new SecureStorage('react-security:session', getStorage('session'));
const persistentStorageSecure = new SecureStorage('react-security:persistent', getStorage('local'));
const pendingStorage = new SecureStorage('react-security:pending', getStorage('session'));

const MAX_PENDING_SESSION_AGE = 10 * 60 * 1000;

export const tokenService = {
  async persistTokens(tokens: AuthTokens, options: { persist?: boolean } = {}): Promise<void> {
    if (options.persist) {
      await persistentStorageSecure.setItem(TOKEN_KEY, tokens);
      await sessionStorageSecure.removeItem(TOKEN_KEY);
    } else {
      await sessionStorageSecure.setItem(TOKEN_KEY, tokens);
      await persistentStorageSecure.removeItem(TOKEN_KEY);
    }
  },

  async loadTokens(): Promise<AuthTokens | null> {
    const sessionTokens = await sessionStorageSecure.getItem<AuthTokens>(TOKEN_KEY);
    if (sessionTokens) {
      return sessionTokens;
    }
    return persistentStorageSecure.getItem<AuthTokens>(TOKEN_KEY);
  },

  async clearTokens(): Promise<void> {
    await Promise.all([
      sessionStorageSecure.removeItem(TOKEN_KEY),
      persistentStorageSecure.removeItem(TOKEN_KEY),
    ]);
  },

  isAccessTokenExpired(tokens: AuthTokens | null): boolean {
    if (!tokens) {
      return true;
    }
    return Date.now() >= tokens.expiresAt;
  },

  isRefreshTokenExpired(tokens: AuthTokens | null): boolean {
    if (!tokens) {
      return true;
    }
    return Date.now() >= tokens.refreshExpiresAt;
  },

  async storePendingSession(session: StoredPendingSession): Promise<void> {
    const payload: StoredPendingSession = {
      ...session,
      issuedAt: session.issuedAt ?? Date.now(),
    };
    await pendingStorage.setItem(PENDING_SESSION_KEY, payload);
  },

  async loadPendingSession(): Promise<PendingSession | null> {
    const stored = await pendingStorage.getItem<StoredPendingSession>(PENDING_SESSION_KEY);
    if (!stored) {
      return null;
    }

    if (Date.now() - stored.issuedAt > MAX_PENDING_SESSION_AGE) {
      await pendingStorage.removeItem(PENDING_SESSION_KEY);
      return null;
    }

    return {
      sessionId: stored.sessionId,
      persistSession: stored.persistSession,
      pendingUser: stored.email
        ? {
            id: stored.sessionId,
            email: stored.email,
            name: stored.name ?? stored.email.split('@')[0],
          }
        : null,
      message: stored.message,
      issuedAt: stored.issuedAt,
    };
  },

  async clearPendingSession(): Promise<void> {
    await pendingStorage.removeItem(PENDING_SESSION_KEY);
  },
};
