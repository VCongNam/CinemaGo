import { Box, Text, VStack } from "@chakra-ui/react";

export default function TicketInfo() {
  return (
    <VStack spacing={4} p={6}>
      <Text fontSize="xl" fontWeight="bold">Thông tin vé</Text>
      <Box borderWidth="1px" p={4} borderRadius="md">
        <Text>Phim: Từ Chiến Trên Không</Text>
        <Text>Suất: 16:00 - 23/09/2025</Text>
        <Text>Rạp: Beta Đan Phượng</Text>
        <Text>Ghế: F11</Text>
        <Text>Giá: 119.000 đ</Text>
      </Box>
    </VStack>
  );
}
