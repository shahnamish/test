import { FormEvent, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Link,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import {
  clearAuthError,
  login,
  selectAuthError,
  selectAuthState,
  selectIsAuthenticated,
  setPersistSession,
} from '../features/auth/authSlice';

export const LoginPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { status, mfaRequired } = useAppSelector(selectAuthState);
  const error = useAppSelector(selectAuthError);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);

  const isLoading = status.login === 'loading';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(clearAuthError());

    try {
      await dispatch(login({ email, password, rememberDevice })).unwrap();
      dispatch(setPersistSession(rememberDevice));
      toast({
        title: 'Credentials accepted',
        description: 'Complete MFA to access your workspace.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      navigate('/mfa');
    } catch (err) {
      toast({
        title: 'Sign in failed',
        description: err instanceof Error ? err.message : 'Please check your credentials and try again.',
        status: 'error',
      });
    }
  };

  if (isAuthenticated && !mfaRequired) {
    navigate('/');
  }

  return (
    <Box as="form" onSubmit={handleSubmit} bg="white" p={8} borderRadius="lg" boxShadow="md">
      <Stack spacing={6}>
        <Heading size="md" textAlign="left">
          Sign in
        </Heading>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormControl id="email" isRequired>
          <FormLabel>Email address</FormLabel>
          <Input
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder="analyst@example.com"
            bg="gray.50"
          />
        </FormControl>

        <FormControl id="password" isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            name="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
            bg="gray.50"
          />
        </FormControl>

        <Checkbox
          isChecked={rememberDevice}
          onChange={(event) => setRememberDevice(event.target.checked)}
          colorScheme="brand"
        >
          Remember this device
        </Checkbox>

        <Button type="submit" isLoading={isLoading} loadingText="Signing in">
          Continue
        </Button>

        <Text fontSize="sm" textAlign="center" color="gray.600">
          Don&apos;t have an account?{' '}
          <Link as={RouterLink} to="/signup" color="brand.500">
            Create one now
          </Link>
        </Text>
      </Stack>
    </Box>
  );
};
