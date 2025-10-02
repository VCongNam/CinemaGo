import { VStack, Box, Link } from "@chakra-ui/react";
import { NavLink } from "react-router-dom";

export default function Sidebar({ links }) {
  return (
    <Box
      as="aside"
      w="220px"
      bg="#1a1d29" // nền tối
      color="white"
      p={4}
      borderRight="1px solid"
      borderColor="gray.700"
      minH="100vh"
    >
      <VStack align="stretch" spacing={3}>
        {links.map((link) => (
          <Link
            key={link.to}
            as={NavLink}
            to={link.to}
            p={2}
            borderRadius="md"
            _hover={{ bg: "orange.500", color: "white" }}
            _activeLink={{ bg: "orange.400", fontWeight: "bold", color: "white" }}
          >
            {link.label}
          </Link>
        ))}
      </VStack>
    </Box>
  );
}
