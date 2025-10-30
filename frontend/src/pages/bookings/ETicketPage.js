import {
  Box,
  Heading,
  Text,
  Center,
  Spinner,
  VStack,
  Divider,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from "@chakra-ui/react";
import QRCode from "react-qr-code";
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import apiService from "../../services/apiService";

const ETicketPage = () => {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!bookingId) {
      setError("Không có mã đặt vé.");
      setLoading(false);
      return;
    }

    apiService.getById("/api/bookings/", bookingId, (data, success) => {
      if (success) {
        if (data.booking.status !== 'confirmed') {
          setError("Vé này chưa được xác nhận thanh toán hoặc đã bị hủy.");
        } else {
          setBooking(data.booking);
          setSeats(data.seats);
        }
      } else {
        setError(data.message || "Không thể tải thông tin vé.");
      }
      setLoading(false);
    });
  }, [bookingId]);

  if (loading) {
    return (
      <Center bg="#0f1117" minH="100vh">
        <Spinner color="orange.400" size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center bg="#0f1117" minH="100vh" color="white" p={4}>
        <Alert
          status="error"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          borderRadius="lg"
          maxW="md"
          bg="#1a1b23"
        >
          <AlertIcon boxSize="40px" mr={0} color="red.400" />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Không thể hiển thị vé
          </AlertTitle>
          <AlertDescription maxWidth="sm">{error}</AlertDescription>
        </Alert>
      </Center>
    );
  }

  if (!booking) {
    return null; // Should not happen if no error
  }

  const { showtime_id: showtime, total_price } = booking;

  return (
    <Box bg="#0f1117" minH="100vh" p={{ base: 4, md: 6 }} display="flex" justifyContent="center" alignItems="center">
      <Box
        bg="white"
        p={{ base: 5, md: 8 }}
        borderRadius="xl"
        shadow="2xl"
        maxW="450px"
        w="full"
        color="gray.800"
        border="1px solid"
        borderColor="orange.300"
      >
        <VStack spacing={4} align="stretch">
          <Heading size="lg" textAlign="center" color="#d53f8c">
            Vé Điện Tử
          </Heading>
          <Text textAlign="center" color="gray.500">Mã đặt vé: {booking._id}</Text>
          
          <Center my={4}>
            <QRCode value={booking._id} size={180} />
          </Center>

          <Divider />

          <VStack spacing={2} align="stretch" fontSize="md">
            <Heading size="md" mt={2}>{showtime.movie_id.title}</Heading>
            <Text><strong>Rạp:</strong> {showtime.room_id.theater_id.name}</Text>
            <Text><strong>Phòng chiếu:</strong> {showtime.room_id.name}</Text>
            <Text><strong>Suất chiếu:</strong> {new Date(showtime.start_time.vietnam).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} - {new Date(showtime.start_time.vietnam).toLocaleDateString("vi-VN")}</Text>
            <Text><strong>Ghế:</strong> {seats.map(s => s.seat_id.seat_number).join(", ")}</Text>
          </VStack>

          <Divider />

          <Box textAlign="right">
            <Text fontSize="lg">Tổng cộng</Text>
            <Heading size="xl" color="#d53f8c">{parseFloat(total_price.$numberDecimal).toLocaleString("vi-VN")}đ</Heading>
          </Box>

          <Text fontSize="sm" color="gray.500" textAlign="center" mt={4}>
            Vui lòng đưa mã QR này cho nhân viên tại rạp để xác nhận.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
};

export default ETicketPage;