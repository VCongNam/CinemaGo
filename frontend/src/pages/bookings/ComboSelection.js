import { Box, Button, HStack, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function ComboSelection() {
  const navigate = useNavigate();
  const combos = [
    { id: 1, name: "Beta Combo", price: 68000 },
    { id: 2, name: "Sweet Combo", price: 88000 },
  ];

  return (
    <VStack spacing={4} p={6} align="stretch">
      <Text fontSize="xl" fontWeight="bold">Chọn bắp nước</Text>
      {combos.map((c) => (
        <Box key={c.id} borderWidth="1px" p={4} borderRadius="md">
          <HStack justify="space-between">
            <Text>{c.name}</Text>
            <Text>{c.price.toLocaleString()} đ</Text>
            <Button>+</Button>
          </HStack>
        </Box>
      ))}
      <Button colorScheme="blue" onClick={() => navigate("/booking/payment/123")}>
        Tiếp tục
      </Button>
    </VStack>
  );
}
