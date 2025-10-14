import {
  Box,
  Button,
  Heading,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
} from "@chakra-ui/react";

const CartCheckoutPage = () => {
  const toast = useToast();

  const handleCheckout = () => {
    toast({
      title: "Thanh toán thành công!",
      description: "Cảm ơn bạn đã mua vé 🎬",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box p={6}>
      <Heading mb={4}>Giỏ vé của bạn</Heading>
      <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Phim</Th>
              <Th>Ghế</Th>
              <Th>Giá</Th>
            </Tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>Avengers: Endgame</Td>
              <Td>A12</Td>
              <Td>120,000 ₫</Td>
            </Tr>
          </Tbody>
        </Table>
      </TableContainer>

      <Button mt={4} colorScheme="teal" onClick={handleCheckout}>
        Thanh toán
      </Button>
    </Box>
  );
};

export default CartCheckoutPage;
