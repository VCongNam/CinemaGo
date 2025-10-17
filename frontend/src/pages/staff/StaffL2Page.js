import { Box, Heading, Divider } from "@chakra-ui/react";
import TicketSales from "./TicketSales";
import FoodSelection from "./FoodSelection";

const StaffL2Page = () => {
  return (
    <Box p={6}>
      <Heading mb={4} color="orange.400">
        Staff L2
      </Heading>


      <Divider my={8} />
      <TicketSales />
      <Divider my={8} />
      <FoodSelection />
    </Box>
  );
};

export default StaffL2Page;
