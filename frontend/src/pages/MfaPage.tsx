import { FormEvent, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Heading,
  HStack,
  PinInput,
  PinInputField,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  clearAuthError,
  selectAuthError,
  selectAuthState,
  selectPendingSession,
  verifyMfa,
} from '../features/auth/authSlice';

export const MfaPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const [code, setCode] = useState('');
  const error = useAppSelector(selectAuthError);
  const { status, mfaMessage } = useAppSelector(selectAuthState);
  const pendingSession = useAppSelector(selectPendingSession);

  const isLoading = status.verifyMfa === 'loading';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!pendingSession) {
      navigate('/login', { replace: true });
      return;
    }

    dispatch(clearAuthError());

    try {
      await dispatch(verifyMfa({ sessionId: pendingSession.sessionId, code })).unwrap();
      toast({
        title: 'Multi-factor authentication complete',
        description: 'You now have secure access to the platform.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      navigate('/', { replace: true });
    } catch (err) {
      toast({
        title: 'Verification failed',
        description: err instanceof Error ? err.message : 'Please try again.',
        status: 'error',
      });
    }
  };

  if (!pendingSession) {
    return (
      <Box bg="white" p={8} borderRadius="lg" boxShadow="md">
        <Stack spacing={4} textAlign="center">
          <Heading size="md">No verification required</Heading>
          <Text color="gray.600">Your verification window expired. Please sign in again.</Text>
          <Button onClick={() => navigate('/login')}>Return to sign in</Button>
        </Stack>
      </Box>
    );
  }

  return (
    <Box as="form" onSubmit={handleSubmit} bg="white" p={8} borderRadius="lg" boxShadow="md">
      <Stack spacing={6} align="center">
        <Heading size="md">Multi-factor authentication</Heading>
        <Text color="gray.600" textAlign="center">
          Enter the 6-digit code from your authenticator app to finish signing in.
        </Text>
        {mfaMessage && (
          <Text fontSize="sm" color="gray.500" textAlign="center">
            {mfaMessage}
          </Text>
        )}
        <Text fontSize="xs" color="gray.400">
          Demo environment hint: use <strong>123456</strong>
        </Text>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <HStack spacing={2}>
          <PinInput value={code} onChange={setCode} otp size="lg">
            <PinInputField name="code" />
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
            <PinInputField />
          </PinInput>
        </HStack>

        <Button type="submit" isLoading={isLoading} loadingText="Verifying">
          Verify
        </Button>
      </Stack>
    </Box>
  );
};
