import { Flex, Box } from "@chakra-ui/react";
import Navbar from "../Navbar/Navbar";

export default function CustomerLayout({ children }) {
  return (
    <Flex direction="column" h="100vh" bg="#0f1117" color="white">
      {/* Navbar giữ màu cam chủ đạo */}
      <Navbar title="CINEMAGO - Customer" />

      {/* Nội dung chính */}
      <Box flex="1" p={6} bg="#0f1117" color="white">
        {children}
      </Box>
    </Flex>
  );
}
