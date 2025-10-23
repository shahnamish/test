import { Outlet } from 'react-router-dom';
import { Box, Flex, Heading, VStack } from '@chakra-ui/react';

export const AuthLayout = () => {
  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50">
      <Box maxW="md" w="full" p={8}>
        <VStack spacing={8} align="stretch">
          <Heading textAlign="center" size="lg" color="brand.700">
            Security Platform
          </Heading>
          <Outlet />
        </VStack>
      </Box>
    </Flex>
  );
};
