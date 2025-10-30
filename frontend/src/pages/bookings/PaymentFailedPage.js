import { Box, Heading, Text, Button, VStack, Icon } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { WarningTwoIcon } from '@chakra-ui/icons';
import { useEffect, useState } from "react";
import apiService from "../../services/apiService";

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("bookingId");


  const [booking, setBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);

  useEffect(() => {
    if (!bookingId) return;
    // GỌI API kiểm tra trạng thái booking/payment
    apiService.get(`/api/payments/booking/${bookingId}/status`, (data, success) => {
      if (success) {
        let b = data.data.booking;
        const p = data.data.paymentInfo;
        // Nếu payment bị CANCELLED => chỉnh local booking state
        if (p && p.status === 'CANCELLED') {
          b = { ...b, status: 'CANCELLED', payment_status: 'CANCELLED' };
        }
        setBooking(b);
        setPaymentInfo(p);
      } else {
        setBooking(null);
        setPaymentInfo(null);
      }
    });
  }, [bookingId]);

  return (
    <Box 
      textAlign="center" 
      py={20} 
      px={6}
      bg="#0f1117" 
      minH="100vh" 
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6} maxW="lg">
        <Icon as={WarningTwoIcon} w={20} h={20} color="red.400" />
        <Heading as="h1" size="2xl">
          {params.get("cancel") === "true"
            ? "Giao dịch đã bị hủy"
            : "Thanh toán thất bại"}
        </Heading>
        <Text fontSize="lg" color="gray.300">
          {params.get("cancel") === "true"
            ? "Giao dịch đã được hủy theo yêu cầu của bạn. Bạn có thể thử lại thanh toán hoặc quay về trang chủ."
            : "Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại sau."}
        </Text>
        {/* HIỂN THỊ STATUS BOOKING/PAYMENT */}
        {booking && (
          <Text color="gray.300">
            Trạng thái: {booking.status}, Trạng thái thanh toán: {booking.payment_status}
          </Text>
        )}
        {bookingId && (
          <Text color="gray.400">Mã đặt vé của bạn là: {bookingId}</Text>
        )}
        <VStack spacing={4} direction="column" mt={8}>
          <Button 
            bg="#d53f8c" 
            color="white"
            _hover={{ bg: "#b83280" }}
            onClick={() => navigate(`/bookings/checkout/${bookingId}`)} // Allow retry
            isDisabled={!bookingId}
            size="lg"
          >
            Thử lại thanh toán
          </Button>
          <Button 
            variant="outline"
            colorScheme="gray"
            onClick={() => navigate("/")}
            size="lg"
          >
            Quay về trang chủ
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default PaymentFailedPage;