import { Box, Text, Badge, HStack, VStack, Button } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

export default function TicketCard({ ticket, bookingId }) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = (e) => {
    e.stopPropagation();
    navigate(`/bookings/checkout/${bookingId}`);
  };

  return (
    <Box
      borderWidth="1px"
      borderRadius="xl"
      p={4}
      bg="#1a1d29"
      color="white"
      shadow="md"
      _hover={{ shadow: "lg", transform: "scale(1.02)", transition: "0.2s", cursor: "pointer", borderColor: "#ff9900" }}
      onClick={() => navigate(`/ticket-detail/${bookingId}`)}
    >
      <VStack align="start" spacing={2}>
        <Text fontWeight="bold" fontSize="lg" color="orange.400">
          🎬 {ticket.movie}
        </Text>
        <Text fontSize="sm" color="gray.300">
          Phòng: {ticket.room} 
        </Text>
        <HStack>
          <Badge
            px={2}
            py={1}
            borderRadius="md"
          >
          </Badge>
          <Text fontWeight="medium" fontSize="sm" color="gray.400">
            {ticket.date}
          </Text>
        </HStack>
        <Text color="orange.300" fontWeight="bold" fontSize="lg">
          {ticket.total?.toLocaleString("vi-VN")} ₫
        </Text>
        {(ticket.status === 'pending' || ticket.payment_status === 'pending') && (
          <Button
            colorScheme="orange"
            size="sm"
            width="full"
            onClick={handlePayment}
            isLoading={isLoading}
          >
            Tiếp tục thanh toán
          </Button>
        )}
      </VStack>
    </Box>
  );
}
