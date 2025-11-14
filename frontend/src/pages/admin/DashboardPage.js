import { Flex, Box, SimpleGrid, Spinner, Center } from "@chakra-ui/react";
import Sidebar from "../Navbar/SidebarAdmin";
import RevenueChart from "../Navbar/RevenueChart";
import RevenuePieChart from "../Navbar/RevenuePieChart";
import TopMoviesChart from "../Navbar/TopMoviesChart";
import CustomerStatusPieChart from "../Navbar/CustomerStatusPieChart";
import { useAdminAuth } from "../../hooks/useAdminAuth";


export default function DashboardPage() {
  const isAuthorized = useAdminAuth();

  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg="#0f1117">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

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
