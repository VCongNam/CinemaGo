import { Box, Heading } from "@chakra-ui/react";
import TicketSales from "./TicketSales";
import FoodBeverageSales from "./FoodBeverageSales";

const StaffL1Page = () => {
  return (
    <Box p={6}>
      <Heading mb={4}>Staff L1 - Quầy bán vé & bắp nước</Heading>
      <TicketSales />
      <FoodBeverageSales />
    </Box>
  );
};

export default StaffL1Page;
