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

// Component để chọn combo
export const FoodSelection = ({ selectedFoods, onFoodChange }) => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/combos", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error("Không thể tải danh sách combo");
      }

      const data = await response.json();
      
      // Lọc chỉ lấy combo đang active
      const activeCombos = (data.data || []).filter(combo => combo.status === "active");
      setCombos(activeCombos);
    } catch (err) {
      console.error("Fetch combos error:", err);
      toast({
        title: "Lỗi tải combo",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleIncrease = (combo) => {
    const existing = selectedFoods.find(f => f._id === combo._id);
    if (existing) {
      onFoodChange(selectedFoods.map(f =>
        f._id === combo._id ? { ...f, quantity: f.quantity + 1 } : f
      ));
    } else {
      onFoodChange([...selectedFoods, { ...combo, quantity: 1 }]);
    }
  };

  const handleDecrease = (comboId) => {
    const existing = selectedFoods.find(f => f._id === comboId);
    if (existing) {
      if (existing.quantity === 1) {
        onFoodChange(selectedFoods.filter(f => f._id !== comboId));
      } else {
        onFoodChange(selectedFoods.map(f =>
          f._id === comboId ? { ...f, quantity: f.quantity - 1 } : f
        ));
      }
    }
  };

  const getQuantity = (comboId) => {
    const combo = selectedFoods.find(f => f._id === comboId);
    return combo ? combo.quantity : 0;
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
          🍿 Thêm bắp nước
        </Text>
        <Text fontSize="xs" color="gray.500">(Tùy chọn)</Text>
      </Flex>

      <Box maxH="300px" overflowY="auto" css={{
        '&::-webkit-scrollbar': { width: '4px' },
        '&::-webkit-scrollbar-track': { background: '#1a1b23' },
        '&::-webkit-scrollbar-thumb': { background: '#4a4b53', borderRadius: '4px' },
      }}>
        {combos.map((combo) => {
          const quantity = getQuantity(combo._id);
          return (
            <Box
              key={combo._id}
              p={3}
              mb={2}
              bg="#23242a"
              borderRadius="md"
              _hover={{ bg: "#2d2e35" }}
              transition="0.2s"
            >
              <Flex justify="space-between" align="center" gap={3}>
                {/* Hình ảnh combo */}
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
                  <Text fontSize="xs" color="orange.300" fontWeight="bold">
                    {formatPrice(combo.price)}
                  </Text>
                </Box>

                <HStack spacing={2}>
                  <IconButton
                    icon={<MinusIcon />}
                    size="xs"
                    colorScheme="red"
                    variant="outline"
                    onClick={() => handleDecrease(combo._id)}
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

      {/* Hiển thị tổng tiền combo đã chọn */}
      {selectedFoods.length > 0 && (
        <Box mt={3} p={3} bg="#1a1b23" borderRadius="md">
          <Flex justify="space-between" align="center">
            <Text fontSize="sm" color="gray.400">
              Tổng combo ({selectedFoods.reduce((sum, f) => sum + f.quantity, 0)} món)
            </Text>
            <Text fontSize="md" fontWeight="bold" color="orange.400">
              {formatPrice(selectedFoods.reduce((sum, f) => sum + (f.price * f.quantity), 0))}
            </Text>
          </Flex>
        </Box>
      )}
    </Box>
  );
};

export default FoodSelection;