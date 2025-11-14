import { useState, useEffect } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  IconButton,
  Spinner,
  useToast,
  Image,
} from "@chakra-ui/react";
import { AddIcon, MinusIcon } from "@chakra-ui/icons";
import apiService from "../../services/apiService";

// Component để chọn combo
export const FoodSelection = ({ selectedFoods, onFoodChange }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  // Fetch combos from API
  useEffect(() => {
    setLoading(true);
    apiService.getPublic("/api/combos", {}, (data, success) => {
      if (success && data?.data) {
        // Lọc chỉ lấy combos có status "active" và normalize price
        const activeCombos = (data.data || [])
          .filter(combo => combo.status === "active")
          .map(combo => {
            // Normalize price từ MongoDB Decimal128 format
            let price = 0;
            if (combo.price) {
              if (typeof combo.price === "number") {
                price = combo.price;
              } else if (typeof combo.price === "object" && combo.price.$numberDecimal) {
                price = Number(combo.price.$numberDecimal);
              } else if (typeof combo.price === "string") {
                price = Number(combo.price) || 0;
              }
            }
            
            return {
              id: combo._id || combo.id,
              _id: combo._id || combo.id,
              name: combo.name,
              description: combo.description,
              price: price,
              image_url: combo.image_url,
            };
          });
        setCombos(activeCombos);
      } else {
        console.error("Failed to load combos:", data);
        setCombos([]);
      }
      setLoading(false);
    });
  }, []);

  const handleIncrease = (combo) => {
    const comboId = combo._id || combo.id;
    const existing = selectedFoods.find(f => (f._id || f.id) === comboId);
    if (existing) {
      onFoodChange(selectedFoods.map(f =>
        (f._id || f.id) === comboId ? { ...f, quantity: (f.quantity || 0) + 1 } : f
      ));
    } else {
      // Đảm bảo price là number, không phải object
      const normalizedCombo = {
        ...combo,
        _id: comboId,
        id: comboId,
        price: typeof combo.price === 'number' ? combo.price : (typeof combo.price === 'object' && combo.price.$numberDecimal ? Number(combo.price.$numberDecimal) : 0),
        quantity: 1
      };
      onFoodChange([...selectedFoods, normalizedCombo]);
    }
  };

  const handleDecrease = (comboId) => {
    const existing = selectedFoods.find(f => (f._id || f.id) === comboId);
    if (existing) {
      if (existing.quantity === 1) {
        onFoodChange(selectedFoods.filter(f => (f._id || f.id) !== comboId));
      } else {
        onFoodChange(selectedFoods.map(f =>
          (f._id || f.id) === comboId ? { ...f, quantity: (f.quantity || 0) - 1 } : f
        ));
      }
    }
  };

  const getQuantity = (comboId) => {
    const combo = selectedFoods.find(f => (f._id || f.id) === comboId);
    return combo ? (combo.quantity || 0) : 0;
  };

  const formatPrice = (price) => {
    if (!price) return "0đ";
    const numericPrice = typeof price === 'object' && price.$numberDecimal 
      ? parseFloat(price.$numberDecimal) 
      : parseFloat(price);
    
    if (isNaN(numericPrice)) return "0đ";
    return Math.round(numericPrice).toLocaleString("vi-VN") + "đ";
  };

  if (loading) {
    return (
      <Box>
        <Text fontSize="lg" fontWeight="bold" color="orange.400" mb={3}>
          🍿 Thêm bắp nước
        </Text>
        <Flex justify="center" align="center" h="100px">
          <Spinner size="md" color="orange.400" />
        </Flex>
      </Box>
    );
  }

  if (combos.length === 0) {
    return (
      <Box>
        <Text fontSize="lg" fontWeight="bold" color="orange.400" mb={3}>
          🍿 Thêm bắp nước
        </Text>
        <Box p={4} bg="#23242a" borderRadius="md" textAlign="center">
          <Text color="gray.400" fontSize="sm">
            Không có combo nào khả dụng
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Flex align="center" gap={2} mb={3}>
        <Text fontSize="lg" fontWeight="bold" color="orange.400">
          🍿 Chọn combo
        </Text>
        <Text fontSize="xs" color="gray.500">(Tùy chọn)</Text>
      </Flex>

      {loading ? (
        <Flex justify="center" align="center" py={4}>
          <Spinner color="orange.400" size="sm" />
        </Flex>
      ) : combos.length === 0 ? (
        <Text fontSize="sm" color="gray.500" py={4} textAlign="center">
          Không có combo nào khả dụng
        </Text>
      ) : (
        <Box maxH="300px" overflowY="auto" css={{
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-track': { background: '#1a1b23' },
          '&::-webkit-scrollbar-thumb': { background: '#4a4b53', borderRadius: '4px' },
        }}>
          {combos.map((combo) => {
            const quantity = getQuantity(combo.id);
            return (
              <Box
                key={combo.id}
                p={3}
                mb={2}
                bg="#23242a"
                borderRadius="md"
                _hover={{ bg: "#2d2e35" }}
                transition="0.2s"
              >
                <Flex justify="space-between" align="center" gap={3}>
                  <Flex flex="1" align="center" gap={3}>
                    {combo.image_url && (
                      <Image
                        src={combo.image_url}
                        alt={combo.name}
                        boxSize="50px"
                        objectFit="cover"
                        borderRadius="md"
                        fallbackSrc="https://via.placeholder.com/50"
                      />
                    )}
                    <Box flex="1">
                      <Text fontWeight="semibold" fontSize="sm">
                        {combo.name}
                      </Text>
                      {combo.description && (
                        <Text fontSize="xs" color="gray.400" noOfLines={1}>
                          {combo.description}
                        </Text>
                      )}
                      <Text fontSize="xs" color="orange.300" mt={1}>
                        {formatPrice(combo.price)}
                      </Text>
                    </Box>
                  </Flex>

                  <HStack spacing={2}>
                    <IconButton
                      icon={<MinusIcon />}
                      size="xs"
                      colorScheme="red"
                      variant="outline"
                      onClick={() => handleDecrease(combo.id)}
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
                      onClick={() => handleIncrease(combo)}
                      borderRadius="full"
                    />
                  </HStack>
                </Flex>
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default FoodSelection;