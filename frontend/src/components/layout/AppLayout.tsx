import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Stack,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUser, FiHome, FiShield } from 'react-icons/fi';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { logout, selectAuthUser } from '../../features/auth/authSlice';

interface NavItem {
  label: string;
  to: string;
  icon: typeof FiHome;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: FiHome },
  { label: 'Account', to: '/account', icon: FiUser },
];

export const AppLayout = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectAuthUser);
  const location = useLocation();
  const headerBg = useColorModeValue('white', 'gray.900');
  const headerBorder = useColorModeValue('gray.200', 'gray.700');

  const handleSignOut = async () => {
    await dispatch(logout());
  };

  return (
    <Flex minH="100vh" bg="gray.50" direction="column">
      <Box as="header" bg={headerBg} borderBottomWidth="1px" borderColor={headerBorder} px={8} py={4}>
        <Flex align="center" justify="space-between">
          <HStack spacing={3}>
            <Icon as={FiShield} color="brand.500" boxSize={6} />
            <Text fontWeight="semibold" fontSize="lg">
              Security Portal
            </Text>
          </HStack>
          <HStack spacing={3}>
            <Text fontSize="sm" color="gray.500">
              {user?.email}
            </Text>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </HStack>
        </Flex>
      </Box>

      <Flex flex="1" overflow="hidden">
        <Box
          as="nav"
          width={{ base: '100%', md: '240px' }}
          borderRightWidth={{ base: 0, md: '1px' }}
          borderColor={headerBorder}
          bg="white"
          py={6}
          px={4}
        >
          <Stack spacing={2}>
            {NAV_ITEMS.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Button
                  as={NavLink}
                  key={item.to}
                  to={item.to}
                  justifyContent="flex-start"
                  variant={isActive ? 'solid' : 'ghost'}
                  leftIcon={<Icon as={item.icon} />}
                >
                  {item.label}
                </Button>
              );
            })}
          </Stack>
        </Box>

        <Box as="main" flex="1" px={{ base: 4, md: 8 }} py={8} overflowY="auto">
          <Outlet />
        </Box>
      </Flex>
    </Flex>
  );
};
