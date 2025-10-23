import { ReactElement, ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { ChakraProvider } from '@chakra-ui/react';
import { MemoryRouter } from 'react-router-dom';
import { configureStore, type PreloadedState } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import type { RootState } from '../app/store';
import theme from '../theme';

export const createTestStore = (preloadedState?: PreloadedState<RootState>) =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState,
  });

export type AppStore = ReturnType<typeof createTestStore>;
export type AppState = ReturnType<AppStore['getState']>;

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>;
  store?: AppStore;
  route?: string;
}

export const renderWithProviders = (
  ui: ReactElement,
  { preloadedState, store = createTestStore(preloadedState), route = '/', ...renderOptions }: ExtendedRenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <ChakraProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </ChakraProvider>
    </Provider>
  );

  return {
    store,
    ...render(ui, {
      wrapper: Wrapper,
      ...renderOptions,
    }),
  };
};
