import { Box, Heading, Button, Flex, useToast } from "@chakra-ui/react";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";
import { useState } from "react";

const FoodBeverageSales = () => {
  const [items] = useState([
    { id: 1, name: "Combo 1 (Bắp + Nước)", price: 100000 },
    { id: 2, name: "Pepsi", price: 30000 },
  ]);

  const toast = useToast();

  const handleSell = (id) => {
    toast({
      title: "Đã bán thành công",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box p={6}>
      <Heading mb={4}>Bán bắp nước</Heading>
      <TableContainer>
        <Table variant="striped">
          <Thead>
            <Tr>
              <Th>Tên sản phẩm</Th>
              <Th>Giá</Th>
              <Th>Hành động</Th>
            </Tr>
          </Thead>
          <Tbody>
            {items.map((item) => (
              <Tr key={item.id}>
                <Td>{item.name}</Td>
                <Td>{item.price.toLocaleString()} VNĐ</Td>
                <Td>
                  <Flex gap={2}>
                    <Button
                      size="sm"
                      colorScheme="green"
                      onClick={() => handleSell(item.id)}
                    >
                      Bán
                    </Button>
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FoodBeverageSales;
