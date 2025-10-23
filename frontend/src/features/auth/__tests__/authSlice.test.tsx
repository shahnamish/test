import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
  login,
  signUp,
  logout,
  clearAuthError,
  setPersistSession,
  selectIsAuthenticated,
  selectAuthUser,
  selectAuthError,
} from '../authSlice';
import type { RootState } from '../../../app/store';

const createMockStore = () =>
  configureStore({
    reducer: {
      auth: authReducer,
    },
  });

describe('authSlice', () => {
  describe('reducers', () => {
    it('should clear auth error', () => {
      const store = createMockStore();
      store.dispatch(clearAuthError());
      expect(selectAuthError(store.getState() as RootState)).toBe(null);
    });

    it('should set persist session', () => {
      const store = createMockStore();
      store.dispatch(setPersistSession(true));
      expect(store.getState().auth.persistSession).toBe(true);
    });
  });

  describe('selectors', () => {
    it('should select authentication state', () => {
      const store = createMockStore();
      expect(selectIsAuthenticated(store.getState() as RootState)).toBe(false);
    });

    it('should select user', () => {
      const store = createMockStore();
      expect(selectAuthUser(store.getState() as RootState)).toBe(null);
    });

    it('should select error', () => {
      const store = createMockStore();
      expect(selectAuthError(store.getState() as RootState)).toBe(null);
    });
  });

  describe('async thunks', () => {
    it('should handle pending login', () => {
      const store = createMockStore();
      store.dispatch(login.pending('', { email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.status.login).toBe('loading');
    });

    it('should handle pending signup', () => {
      const store = createMockStore();
      store.dispatch(signUp.pending('', { email: 'test@test.com', password: 'pass' }));
      expect(store.getState().auth.status.signUp).toBe('loading');
    });

    it('should handle logout fulfilled', async () => {
      const store = createMockStore();
      await store.dispatch(logout());
      expect(store.getState().auth.user).toBe(null);
      expect(store.getState().auth.tokens).toBe(null);
    });
  });
});
