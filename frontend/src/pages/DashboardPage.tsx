import {
  Box,
  Grid,
  GridItem,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Text,
  VStack,
  Tag,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { useAppSelector } from '../app/hooks';
import { selectAuthUser } from '../features/auth/authSlice';

export const DashboardPage = () => {
  const user = useAppSelector(selectAuthUser);

  return (
    <VStack align="stretch" spacing={8}>
      <Box>
        <Heading size="lg" mb={2}>
          Welcome back{user?.name ? `, ${user.name}` : ''}!
        </Heading>
        <Text color="gray.600">
          Your security control center surfaces authentication events, compliance insights, and
          monitoring health in a single place.
        </Text>
      </Box>

      <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
        <GridItem>
          <Stat bg="white" borderRadius="lg" p={6} boxShadow="sm">
            <StatLabel>Active Sessions</StatLabel>
            <StatNumber>3</StatNumber>
            <StatHelpText>Includes this device</StatHelpText>
          </Stat>
        </GridItem>
        <GridItem>
          <Stat bg="white" borderRadius="lg" p={6} boxShadow="sm">
            <StatLabel>Alerts Resolved</StatLabel>
            <StatNumber>18</StatNumber>
            <StatHelpText>Past 30 days</StatHelpText>
          </Stat>
        </GridItem>
        <GridItem>
          <Stat bg="white" borderRadius="lg" p={6} boxShadow="sm">
            <StatLabel>MFA Enforcement</StatLabel>
            <StatNumber>100%</StatNumber>
            <StatHelpText color="green.500">Compliant</StatHelpText>
          </Stat>
        </GridItem>
      </Grid>

      <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
        <Heading size="md" mb={4}>
          Recent Identity Events
        </Heading>
        <VStack align="stretch" spacing={4}>
          {['Successful login', 'MFA verified', 'Session extended'].map((label, idx) => (
            <HStack key={label} justify="space-between" align="flex-start">
              <Box>
                <Text fontWeight="medium">{label}</Text>
                <Text fontSize="sm" color="gray.500">
                  {idx === 0
                    ? 'Primary device · 2 minutes ago'
                    : idx === 1
                      ? 'Authenticator app · 2 minutes ago'
                      : 'Token rotation · 1 hour ago'}
                </Text>
              </Box>
              <Tag colorScheme={idx === 2 ? 'purple' : 'green'}>Ok</Tag>
            </HStack>
          ))}
        </VStack>
      </Box>

      <Box bg="white" borderRadius="lg" p={6} boxShadow="sm">
        <Heading size="md" mb={4}>
          Compliance Snapshot
        </Heading>
        <HStack spacing={4} wrap="wrap">
          <Badge colorScheme="green" px={3} py={1} borderRadius="full">
            SOC 2 Type II Ready
          </Badge>
          <Badge colorScheme="blue" px={3} py={1} borderRadius="full">
            GDPR Compliant
          </Badge>
          <Badge colorScheme="orange" px={3} py={1} borderRadius="full">
            ISO 27001 Tracking
          </Badge>
        </HStack>
      </Box>
    </VStack>
  );
};
