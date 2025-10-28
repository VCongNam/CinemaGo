import { Box, Heading, Divider } from "@chakra-ui/react";
import TicketSales from "./TicketSales";
import FoodSelection from "./FoodSelection";

const StaffL2Page = () => {
  return (
    <Box p={6} bg="gray.100" minHeight="100vh">
      <Heading as="h1" size="xl" mb={6} textAlign="center">
        Staff Level 2 Dashboard
      </Heading>
    </Box>
  );
}
export default StaffL2Page;
