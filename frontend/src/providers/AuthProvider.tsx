import { Center, Spinner, VStack, Text } from '@chakra-ui/react';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { bootstrapAuth, selectAuthState } from '../features/auth/authSlice';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { status, mfaRequired } = useAppSelector(selectAuthState);

  useEffect(() => {
    if (status.bootstrap === 'idle') {
      dispatch(bootstrapAuth());
    }
  }, [dispatch, status.bootstrap]);

  useEffect(() => {
    if (mfaRequired && !location.pathname.includes('/mfa')) {
      // Intentionally left blank; routing layer handles redirects.
    }
  }, [mfaRequired, location.pathname]);

  if (status.bootstrap === 'idle' || status.bootstrap === 'loading') {
    return (
      <Center minH="100vh" bg="gray.50">
        <VStack spacing={3}>
          <Spinner size="xl" color="brand.500" thickness="4px" />
          <Text fontSize="sm" color="gray.500">
            Preparing secure workspace...
          </Text>
        </VStack>
      </Center>
    );
  }

  return <>{children}</>;
};
