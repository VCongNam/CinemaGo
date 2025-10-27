
import { Box, Spinner, Text, VStack, Heading, Button } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import apiService from "../../services/apiService";

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("bookingId");
    if (id) {
      setBookingId(id);
    } else {
      setError("Không tìm thấy mã đặt vé.");
    }
  }, [location.search]);

  useEffect(() => {
    if (!bookingId) return;

    const interval = setInterval(() => {
      apiService.get(
        `/api/payments/booking/${bookingId}/status`,
        (data, success) => {
          if (success) {
            const bookingStatus = data.data.booking.status;
            if (bookingStatus === "confirmed") {
              setStatus("confirmed");
              clearInterval(interval);
              navigate(`/bookings/eticket/${bookingId}`);
            } else if (bookingStatus === "cancelled") {
              setStatus("cancelled");
              clearInterval(interval);
              navigate(`/payment-failed?bookingId=${bookingId}`);
            }
          } else {
            setError("Lỗi khi kiểm tra trạng thái thanh toán.");
            clearInterval(interval);
          }
        }
      );
    }, 3000); // Poll every 3 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [bookingId, navigate]);

  return (
    <Box
      bg="#0f1117"
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      color="white"
    >
      <VStack spacing={6}>
        {error ? (
          <>
            <Heading color="red.400">Đã xảy ra lỗi</Heading>
            <Text>{error}</Text>
            <Button colorScheme="pink" onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          </>
        ) : (
          <>
            <Heading>Chờ chút nhé...</Heading>
            <Spinner color="orange.400" size="xl" />
            <Text>
              Đang xác nhận thanh toán của bạn. Vui lòng không rời khỏi trang.
            </Text>
            <Text fontSize="sm" color="gray.400">
              Trạng thái hiện tại: {status}
            </Text>
          </>
        )}
      </VStack>
    </Box>
  );
};

export default PaymentSuccessPage;
