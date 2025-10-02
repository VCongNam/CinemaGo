import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Flex,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";

const TicketSales = () => {
  const [tickets] = useState([
    { id: 1, movie: "Avengers", seat: "A1", price: 80000 },
    { id: 2, movie: "Inception", seat: "B2", price: 90000 },
  ]);

  const toast = useToast();

  const handleSell = (id) => {
    toast({
      title: "Bán vé thành công",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box p={6}>
      <Heading mb={4}>Bán vé</Heading>
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th>Phim</Th>
            <Th>Ghế</Th>
            <Th>Giá</Th>
            <Th>Hành động</Th>
          </Tr>
        </Thead>
        <Tbody>
          {tickets.map((t) => (
            <Tr key={t.id}>
              <Td>{t.movie}</Td>
              <Td>{t.seat}</Td>
              <Td>{t.price.toLocaleString()} VNĐ</Td>
              <Td>
                <Flex gap={2}>
                  <Button
                    size="sm"
                    colorScheme="green"
                    onClick={() => handleSell(t.id)}
                  >
                    Bán vé
                  </Button>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default TicketSales;
