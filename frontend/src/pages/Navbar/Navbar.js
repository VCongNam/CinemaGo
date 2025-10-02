import { Flex, Heading, Spacer, Button } from "@chakra-ui/react";

export default function Navbar({ title }) {
  return (
    <Flex
      as="nav"
      bg="#1a1d29"          // nền tối
      color="white"
      p={4}
      align="center"
      boxShadow="md"
    >
      <Heading size="md" color="orange.400">
        {title}
      </Heading>
      <Spacer />
      <Button
        colorScheme="orange"
        size="sm"
        bg="orange.400"
        _hover={{ bg: "orange.500" }}
      >
        Đăng xuất
      </Button>
    </Flex>
  );
}
