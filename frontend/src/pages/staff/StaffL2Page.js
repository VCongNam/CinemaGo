import { Box, Heading, Divider } from "@chakra-ui/react";
import ShowtimeManagement from "./ShowtimeManagement";
import TicketSales from "./TicketSeatSelectPage";
import FoodBeverageSales from "./FoodBeverageSales";

const StaffL2Page = () => {
  return (
    <Box p={6}>
      <Heading mb={4} color="orange.400">
        Staff L2
      </Heading>

      {/* Chức năng Staff L2 */}
      <ShowtimeManagement />

      <Divider my={8} />
      <TicketSales />
      <Divider my={8} />
      <FoodBeverageSales />
    </Box>
  );
};

export default StaffL2Page;
