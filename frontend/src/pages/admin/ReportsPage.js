import { Box, Heading, Text, Flex } from "@chakra-ui/react";
import Sidebar from "../Navbar/SidebarAdmin";

export default function ReportsPage() {

  return (
    <Flex flex="1" bg="#0f1117" color="white">
      <Sidebar/>
      <Box flex="1" p={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>Báo cáo khác</Heading>
          <Text color="gray.600">Trang báo cáo sẽ được phát triển thêm sau.</Text>
        </Box>
      </Box>
    </Flex>
  );
}
