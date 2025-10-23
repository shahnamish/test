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
  selectAuthError,
  selectAuthState,
  setPersistSession,
  signUp,
} from '../features/auth/authSlice';

export const SignUpPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const toast = useToast();
  const { status } = useAppSelector(selectAuthState);
  const error = useAppSelector(selectAuthError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberDevice, setRememberDevice] = useState(true);

  const isLoading = status.signUp === 'loading';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    dispatch(clearAuthError());

    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please check your password and try again.',
        status: 'warning',
      });
      return;
    }

    try {
      await dispatch(signUp({ email, password, name, rememberDevice })).unwrap();
      dispatch(setPersistSession(rememberDevice));
      toast({
        title: 'Account created!',
        description: 'Complete multi-factor authentication setup.',
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      navigate('/mfa');
    } catch (err) {
      toast({
        title: 'Registration failed',
        description: err instanceof Error ? err.message : 'Please try again later.',
        status: 'error',
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} bg="white" p={8} borderRadius="lg" boxShadow="md">
      <Stack spacing={6}>
        <Heading size="md" textAlign="left">
          Create your account
        </Heading>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <FormControl id="name">
          <FormLabel>Name (optional)</FormLabel>
          <Input
            name="name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            autoComplete="name"
            placeholder="Taylor Martinez"
            bg="gray.50"
          />
        </FormControl>

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
            autoComplete="new-password"
            placeholder="••••••••"
            bg="gray.50"
          />
        </FormControl>

        <FormControl id="confirmPassword" isRequired>
          <FormLabel>Confirm password</FormLabel>
          <Input
            name="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
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

        <Button type="submit" isLoading={isLoading} loadingText="Creating account">
          Sign up
        </Button>

        <Text fontSize="sm" textAlign="center" color="gray.600">
          Already have an account?{' '}
          <Link as={RouterLink} to="/login" color="brand.500">
            Sign in
          </Link>
        </Text>
      </Stack>
    </Box>
  );
};
