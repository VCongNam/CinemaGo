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
  Text,
  VStack,
  Divider,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import apiService from "../../services/apiService";

const CartCheckoutPage = () => {
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, time, showtime, room, selectedSeats, total } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCheckout = async () => {
    setLoading(true);
    setError("");

    try {
      // Step 1: Create a booking
      const bookingData = {
        showtime_id: showtime._id,
        seat_ids: selectedSeats.map(s => s._id),
        payment_method: "online",
      };

      const bookingRes = await new Promise((resolve) => {
        apiService.post("/api/bookings", bookingData, (data, success) => {
          resolve({ data, success });
        });
      });

      if (!bookingRes.success) {
        throw new Error(bookingRes.data?.error || bookingRes.data?.message || "Tạo vé thất bại");
      }

      const bookingId = bookingRes.data?.data?._id;
      if (!bookingId) {
        throw new Error("Không thể lấy được ID vé");
      }

      // Step 2: Create a payment link
      const paymentLinkRes = await new Promise((resolve) => {
        apiService.post("/api/payments/create-payment-link", { bookingId }, (data, success) => {
          resolve({ data, success });
        });
      });

      if (!paymentLinkRes.success) {
        throw new Error(paymentLinkRes.data?.message || "Tạo link thanh toán thất bại");
      }

      const paymentUrl = paymentLinkRes.data?.data?.checkoutUrl;
      if (!paymentUrl) {
        throw new Error("Không nhận được link thanh toán");
      }

      // Step 3: Redirect to PayOS
      window.location.href = paymentUrl;

    } catch (err) {
      setError(err.message);
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setLoading(false);
    }
  };

  if (!movie || !selectedSeats || selectedSeats.length === 0) {
    return (
      <Box p={6} textAlign="center" bg="#0f1117" color="white" minH="100vh">
        <Heading mb={4}>Giỏ vé của bạn trống</Heading>
        <Button colorScheme="pink" onClick={() => navigate("/")}>
          Quay về trang chủ
        </Button>
      </Box>
    );
  }

  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={6}>
      <VStack spacing={6} align="stretch" maxW="600px" mx="auto">
        <Heading mb={4} textAlign="center">Xác nhận và thanh toán</Heading>
        
        <Box bg="#1a1b23" p={5} borderRadius="lg">
          <Heading size="md">{movie.title}</Heading>
          <Text color="gray.400">{time} - {new Date(showtime?.start_time?.vietnam || showtime?.start_time?.utc || showtime?.start_time).toLocaleDateString("vi-VN")} - {room.name}</Text>
        </Box>

        <TableContainer bg="#1a1b23" p={5} borderRadius="lg">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color="gray.300">Ghế</Th>
                <Th color="gray.300" isNumeric>Giá</Th>
              </Tr>
            </Thead>
            <Tbody>
              {selectedSeats.map(seat => (
                <Tr key={seat._id}>
                  <Td>{seat.seat_number}</Td>
                  <Td isNumeric>{(seat.type === 'vip' ? (showtime?.price || 50000) * 1.5 : (showtime?.price || 50000)).toLocaleString("vi-VN")}đ</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex justify="space-between" align="center" bg="#1a1b23" p={5} borderRadius="lg">
          <Text fontSize="lg" fontWeight="bold">Tổng cộng</Text>
          <Text fontSize="2xl" fontWeight="bold" color="orange.300">{(total || 0).toLocaleString("vi-VN")}đ</Text>
        </Flex>

        {error && (
          <Text color="red.400" textAlign="center">{error}</Text>
        )}

        <Button 
          mt={4} 
          bg="#d53f8c" 
          color="white"
          size="lg"
          onClick={handleCheckout}
          isLoading={loading}
          _hover={{ bg: "#b83280" }}
          spinner={<Spinner size="md" />}
        >
          {loading ? "Đang xử lý..." : "Thanh toán với PayOS"}
        </Button>
      </VStack>
    </Box>
  );
};

export default CartCheckoutPage;
