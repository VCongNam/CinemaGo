import { SimpleGrid } from "@chakra-ui/react";
import AdminLayout from "../layouts/AdminLayout";
import RevenueChart from "../Navbar/RevenueChart";
import RevenuePieChart from "../Navbar/RevenuePieChart";

export default function DashboardPage() {
  return (
    <AdminLayout>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        <RevenueChart />
        {/* Có thể thêm chart khác sau này */}
        <RevenuePieChart />
      </SimpleGrid>
    </AdminLayout>
  );
}
