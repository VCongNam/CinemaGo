import { Box, Text, Badge, HStack, VStack } from "@chakra-ui/react";

export default function TicketCard({ ticket }) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      p={4}
      bg="#1a1d29" // nền tối đồng bộ theme
      color="white"
      shadow="md"
      _hover={{ shadow: "lg", transform: "scale(1.02)", transition: "0.2s" }}
    >
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold" fontSize="lg" color="orange.400">
          🎬 {ticket.movie}
        </Text>
        <Text fontSize="sm" color="gray.300">
          Phòng: {ticket.room} | Ghế: {ticket.seat}
        </Text>
        <HStack>
          <Badge
            colorScheme={ticket.status === "paid" ? "green" : "red"}
            px={2}
            py={1}
            borderRadius="md"
          >
            {ticket.status === "paid" ? "Đã thanh toán" : "Chưa thanh toán"}
          </Badge>
          <Text fontWeight="medium" fontSize="sm" color="gray.400">
            {ticket.date}
          </Text>
        </HStack>
        <Text color="orange.300" fontWeight="bold" fontSize="lg">
          {ticket.total?.toLocaleString("vi-VN")} ₫
        </Text>
      </VStack>
    </Box>
  );
}
