import { Box, Heading, Text, Flex } from "@chakra-ui/react";
import Sidebar from "../Navbar/Sidebar";

export default function ReportsPage() {
  const adminLinks = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
    { to: "/admin/customers", label: "Thông tin khách hàng" },
    { to: "/admin/staffs", label: "Thông tin nhân viên" },
    { to: "/moviesmanagement", label: "Quản lí phim" },
    { to: "/admin/reports", label: "Báo cáo khác" },
  ]
  return (
    <Flex flex="1" bg="#0f1117" color="white">
      <Sidebar links={adminLinks} />
      <Box flex="1" p={6}>
        <Box bg="white" p={6} borderRadius="lg" shadow="sm">
          <Heading size="md" mb={4}>Báo cáo khác</Heading>
          <Text color="gray.600">Trang báo cáo sẽ được phát triển thêm sau.</Text>
        </Box>
      </Box>
    </Flex>
  );
}
