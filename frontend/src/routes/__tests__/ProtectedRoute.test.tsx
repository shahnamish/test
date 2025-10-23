import { screen } from '@testing-library/react';
import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import type { AuthState } from '../../features/auth/types';

describe('ProtectedRoute', () => {
  const baseAuthState: AuthState = {
    user: null,
    tokens: null,
    pendingUser: null,
    pendingSessionId: null,
    mfaRequired: false,
    persistSession: false,
    mfaMessage: null,
    status: {
      bootstrap: 'succeeded',
      signUp: 'idle',
      login: 'idle',
      verifyMfa: 'idle',
      logout: 'idle',
      refresh: 'idle',
    },
    error: null,
  };

  it('redirects unauthenticated users to login', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Secure</div>} />
        </Route>
        <Route path="/login" element={<div>Login Screen</div>} />
      </Routes>,
      {
        route: '/',
        preloadedState: {
          auth: baseAuthState,
        },
      },
    );

    expect(screen.getByText(/login screen/i)).toBeInTheDocument();
  });

  it('redirects when MFA is still required', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Secure</div>} />
        </Route>
        <Route path="/mfa" element={<div>MFA Screen</div>} />
      </Routes>,
      {
        route: '/',
        preloadedState: {
          auth: {
            ...baseAuthState,
            mfaRequired: true,
          },
        },
      },
    );

    expect(screen.getByText(/mfa screen/i)).toBeInTheDocument();
  });

  it('renders protected content when authenticated', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Secure Zone</div>} />
        </Route>
      </Routes>,
      {
        route: '/',
        preloadedState: {
          auth: {
            ...baseAuthState,
            user: {
              id: 'user-1',
              email: 'demo@example.com',
              name: 'Demo',
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
              mfaEnabled: true,
            },
            tokens: {
              accessToken: 'access-token',
              refreshToken: 'refresh-token',
              expiresAt: Date.now() + 60_000,
              refreshExpiresAt: Date.now() + 120_000,
            },
          },
        },
      },
    );

    expect(screen.getByText(/secure zone/i)).toBeInTheDocument();
  });
});
