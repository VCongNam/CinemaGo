import { useState } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  IconButton,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";

// Component nhỏ để chọn đồ ăn
export const FoodSelection = ({ selectedFoods, onFoodChange }) => {
  const [foods] = useState([
    { id: 1, name: "Combo 1 (Bắp + Nước)", price: 100000, icon: "🍿" },
    { id: 2, name: "Pepsi", price: 30000, icon: "🥤" },
    { id: 3, name: "Bắp rang bơ", price: 50000, icon: "🍿" },
    { id: 4, name: "Coca Cola", price: 30000, icon: "🥤" },
  ]);

  const handleIncrease = (food) => {
    const existing = selectedFoods.find(f => f.id === food.id);
    if (existing) {
      onFoodChange(selectedFoods.map(f =>
        f.id === food.id ? { ...f, quantity: f.quantity + 1 } : f
      ));
    } else {
      onFoodChange([...selectedFoods, { ...food, quantity: 1 }]);
    }
  };

  const handleDecrease = (foodId) => {
    const existing = selectedFoods.find(f => f.id === foodId);
    if (existing) {
      if (existing.quantity === 1) {
        onFoodChange(selectedFoods.filter(f => f.id !== foodId));
      } else {
        onFoodChange(selectedFoods.map(f =>
          f.id === foodId ? { ...f, quantity: f.quantity - 1 } : f
        ));
      }
    }
  };

  const getQuantity = (foodId) => {
    const food = selectedFoods.find(f => f.id === foodId);
    return food ? food.quantity : 0;
  };

  return (
    <Box>
      <Flex align="center" gap={2} mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="orange.400">
          🍿 Thêm bắp nước
        </Text>
        <Text fontSize="xs" color="gray.500">(Tùy chọn)</Text>
      </Flex>

      <Box maxH="300px" overflowY="auto" css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { background: '#1a1b23' },
        '&::-webkit-scrollbar-thumb': { background: '#4a4b53', borderRadius: '4px' },
      }}>
        {foods.map((food) => {
          const quantity = getQuantity(food.id);
          return (
            <Box
              key={food.id}
              p={3}
              mb={2}
              bg="#23242a"
              borderRadius="md"
              _hover={{ bg: "#2d2e35" }}
              transition="0.2s"
            >
              <Flex justify="space-between" align="center">
                <Box flex="1">
                  <Text fontWeight="semibold" fontSize="sm">
                    {food.icon} {food.name}
                  </Text>
                  <Text fontSize="xs" color="orange.300">
                    {food.price.toLocaleString()} đ
                  </Text>
                </Box>

                <HStack spacing={2}>
                  <IconButton
                    icon={<MinusIcon />}
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleDecrease(food.id)}
                    isDisabled={quantity === 0}
                    borderRadius="full"
                  />
                  <Text fontWeight="bold" minW="25px" textAlign="center" fontSize="sm">
                    {quantity}
                  </Text>
                  <IconButton
                    icon={<AddIcon />}
                    size="xs"
                    colorScheme="green"
                    variant="outline"
                    onClick={() => handleIncrease(food)}
                    borderRadius="full"
                  />
                </HStack>
              </Flex>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default FoodSelection;