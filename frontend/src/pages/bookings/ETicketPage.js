import { Box, Heading, Text, Center } from "@chakra-ui/react";
import CustomerLayout from "../layouts/CustomerLayout";
import QRCode from "react-qr-code";

export default function ETicketPage() {
  const mockTicket = {
    id: "TXN001",
    movie: "The Wandering Star",
    seat: "A5",
    date: "2025-09-21 18:30",
  };

  return (
    <CustomerLayout>
      <Box bg="white" p={6} borderRadius="lg" shadow="sm" maxW="400px">
        <Heading size="md" mb={4}>
          Vé điện tử
        </Heading>
        <Text>Phim: {mockTicket.movie}</Text>
        <Text>Ghế: {mockTicket.seat}</Text>
        <Text>Suất chiếu: {mockTicket.date}</Text>
        <Center mt={4}>
          <QRCode value={`ticket-${mockTicket.id}`} size={150} />
        </Center>
      </Box>
    </CustomerLayout>
  );
}
