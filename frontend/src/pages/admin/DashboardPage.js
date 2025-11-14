import { Flex, Box, SimpleGrid } from "@chakra-ui/react";
import Sidebar from "../Navbar/SidebarAdmin";
import RevenueChart from "../Navbar/RevenueChart";
import RevenuePieChart from "../Navbar/RevenuePieChart";
import TopMoviesChart from "../Navbar/TopMoviesChart";
import CustomerStatusPieChart from "../Navbar/CustomerStatusPieChart";


export default function DashboardPage() {
  return (
    <Flex flex="1" bg="#0f1117" color="white">
      <Sidebar />
      <Box flex="1" p={6}>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          <RevenueChart />
          <RevenuePieChart />
          <TopMoviesChart />
          <CustomerStatusPieChart />
        </SimpleGrid>
      </Box>
    </Flex>
  );
}
