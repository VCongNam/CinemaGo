import { Box, Heading, Text } from "@chakra-ui/react";
import AdminLayout from "../layouts/AdminLayout";

export default function ReportsPage() {
  return (
    <AdminLayout>
      <Box bg="white" p={6} borderRadius="lg" shadow="sm">
        <Heading size="md" mb={4}>Báo cáo khác</Heading>
        <Text color="gray.600">Trang báo cáo sẽ được phát triển thêm sau.</Text>
      </Box>
    </AdminLayout>
  );
}
