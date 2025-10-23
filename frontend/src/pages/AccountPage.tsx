import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Badge,
  Divider,
  Switch,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { useAppSelector } from '../app/hooks';
import { selectAuthUser } from '../features/auth/authSlice';

export const AccountPage = () => {
  const user = useAppSelector(selectAuthUser);

  if (!user) {
    return null;
  }

  return (
    <VStack align="stretch" spacing={8} maxW="3xl">
      <Heading size="lg">Account Overview</Heading>

      <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Text fontWeight="semibold">Email</Text>
            <Text color="gray.600">{user.email}</Text>
          </HStack>
          <Divider />
          <HStack justify="space-between">
            <Text fontWeight="semibold">Account ID</Text>
            <Text color="gray.600" fontFamily="mono" fontSize="sm">
              {user.id}
            </Text>
          </HStack>
          <Divider />
          <HStack justify="space-between">
            <Text fontWeight="semibold">Member Since</Text>
            <Text color="gray.600">{new Date(user.createdAt).toLocaleDateString()}</Text>
          </HStack>
          {user.lastLoginAt && (
            <>
              <Divider />
              <HStack justify="space-between">
                <Text fontWeight="semibold">Last Login</Text>
                <Text color="gray.600">{new Date(user.lastLoginAt).toLocaleString()}</Text>
              </HStack>
            </>
          )}
        </VStack>
      </Box>

      <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
        <Heading size="md" mb={4}>
          Security Settings
        </Heading>
        <VStack align="stretch" spacing={4}>
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="mfa-status" mb={0}>
              Multi-Factor Authentication
            </FormLabel>
            <Switch id="mfa-status" isChecked={user.mfaEnabled} isDisabled />
            {user.mfaEnabled && (
              <Badge ml={2} colorScheme="green">
                Enabled
              </Badge>
            )}
          </FormControl>
          <Divider />
          <FormControl display="flex" alignItems="center">
            <FormLabel htmlFor="session-persistence" mb={0}>
              Remember this device
            </FormLabel>
            <Switch id="session-persistence" defaultChecked />
          </FormControl>
        </VStack>
      </Box>
    </VStack>
  );
};
