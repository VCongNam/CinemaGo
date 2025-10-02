import { Flex, Box } from "@chakra-ui/react";
import Sidebar from "../Navbar/Sidebar";
import AdminHeader from "../Navbar/AdminHeader";

const adminLinks = [
  { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
  { to: "/admin/customers", label: "Thông tin khách hàng" },
  { to: "/admin/staffs", label: "Thông tin nhân viên" },
  { to: "/admin/reports", label: "Báo cáo khác" },
];

export default function AdminLayout({ children }) {
  return (
    <Flex h="100vh" direction="column" bg="#0f1117" color="white">
      <AdminHeader />
      <Flex flex="1">
        {/* Sidebar nền tối hơn chút */}
        <Sidebar
          links={adminLinks}
          bg="#1a1c23"
          color="white"
          linkHoverColor="orange.400"
        />

        {/* Nội dung chính */}
        <Box flex="1" p={6} bg="#0f1117" color="white">
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
