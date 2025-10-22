import { Box, Button, SimpleGrid, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function SeatSelection() {
  const navigate = useNavigate();
  const seats = Array.from({ length: 45 }, (_, i) => `F${i + 1}`);

  return (
    <VStack spacing={4} p={6}>
      <Text fontSize="xl" fontWeight="bold">Chọn ghế</Text>
      <SimpleGrid columns={9} spacing={2}>
        {seats.map((seat) => (
          <Button key={seat} size="sm" variant="outline">
            {seat}
          </Button>
        ))}
      </SimpleGrid>
      <Button colorScheme="blue" onClick={() => navigate("/booking/combos/123")}>
        Tiếp tục
      </Button>
    </VStack>
  );
}
