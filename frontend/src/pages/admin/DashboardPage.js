import { Flex, Box, SimpleGrid } from "@chakra-ui/react";
import Sidebar from "../Navbar/Sidebar";
import RevenueChart from "../Navbar/RevenueChart";
import RevenuePieChart from "../Navbar/RevenuePieChart";

const adminLinks = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
    { to: "/admin/customers", label: "Thông tin khách hàng" },
    { to: "/admin/staffs", label: "Thông tin nhân viên" },
    { to: "/moviesmanagement", label: "Quản lý phim" },
    { to: "/admin/bookings", label: "Quản lý đặt phim" },
    { to: "/admin/reports", label: "Báo cáo khác" },
  ]



export default function DashboardPage() {
  return (
    <Flex flex="1" bg="#0f1117" color="white">
      <Sidebar links={adminLinks} />
      <Box flex="1" p={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <RevenueChart />
          {/* Có thể thêm chart khác sau này */}
          <RevenuePieChart />
        </SimpleGrid>
      </Box>
    </Flex>
  );
}
