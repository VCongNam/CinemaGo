import { Box, Button, Heading, VStack, Icon, Text, Spinner, useToast } from "@chakra-ui/react";
import { WarningTwoIcon } from '@chakra-ui/icons';
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import apiService from "../../services/apiService";

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const intervalRef = useRef(null);

  const bookingId = searchParams.get('bookingId');
  const orderCode = searchParams.get('orderCode');
  
  // More robust check for cancellation status from URL
  const isCancelledFromUrl = searchParams.get('status') === 'CANCELLED' || searchParams.get('cancel') === 'true';

  const [bookingStatus, setBookingStatus] = useState(isCancelledFromUrl ? 'cancelled' : 'pending');
  const [loading, setLoading] = useState(!isCancelledFromUrl); // Don't load if cancelled from URL
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    // Re-check inside useEffect to handle potential timing issues with searchParams
    const isCancelled = searchParams.get('status') === 'CANCELLED' || searchParams.get('cancel') === 'true';

    if (isCancelled || !bookingId) {
      setLoading(false);
      setBookingStatus('cancelled'); // Ensure status is set to cancelled
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      return;
    }

    // Function to check booking status if not cancelled from URL
    const checkStatus = () => {
      apiService.get(`/api/payments/booking/${bookingId}/status`, {}, (data, success) => {
        if (success && data.data.booking) {
          const currentStatus = data.data.booking.status;
          setBookingStatus(currentStatus);
          if (currentStatus !== 'pending') {
            setLoading(false);
            clearInterval(intervalRef.current);
          }
        }
      });
    };

    // Start polling
    intervalRef.current = setInterval(checkStatus, 3000);
    checkStatus(); // Initial check

    // Cleanup on component unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [searchParams, bookingId]);

  const handleCancelBooking = async () => {
    if (!bookingId) return;

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setIsCancelling(true);
    apiService.put(`/api/bookings/${bookingId}/cancel`, {}, (data, success) => {
      setIsCancelling(false);
      if (success) {
        toast({
          title: "Thành công",
          description: "Đã hủy đặt vé thành công.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setBookingStatus('cancelled');
      } else {
        toast({
          title: "Lỗi",
          description: data.message || "Không thể hủy đặt vé.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  const getMessage = () => {
    return isCancelledFromUrl ? "Thanh toán đã được hủy." : "Thanh toán không thành công.";
  };

  return (
    <Box textAlign="center" py={10} px={6} bg="#0f1117" minH="100vh" color="white">
      <VStack spacing={4}>
        <Icon as={WarningTwoIcon} w={20} h={20} color="red.500" />
        <Heading as="h2" size="xl" mt={6} mb={2}>
          {getMessage()}
        </Heading>
        <Text color={"gray.500"} fontSize={"sm"}>Debug Info: URL Status = [{searchParams.get('status')}]</Text>
        <Text color={'gray.400'}>
          Booking ID: {bookingId}
        </Text>
        <Text color={'gray.400'}>
          Mã đơn hàng: {orderCode}
        </Text>
        
        {loading ? (
          <VStack>
            <Spinner color="orange.400" />
            <Text>Đang cập nhật trạng thái đặt vé...</Text>
          </VStack>
        ) : (
          <>
            <Text color={bookingStatus === 'cancelled' ? 'green.400' : 'yellow.400'}>
              Trạng thái đặt vé: {bookingStatus}
            </Text>
            {bookingStatus === 'pending' && (
              <Button
                mt={4}
                colorScheme="red"
                onClick={handleCancelBooking}
                isLoading={isCancelling}
              >
                Hủy đặt vé
              </Button>
            )}
          </>
        )}

        <VStack spacing={4} mt={6} direction="row">
            <Button
              colorScheme="pink"
              onClick={() => navigate("/")}
            >
              Quay về trang chủ
            </Button>
            <Button
              variant="outline"
              colorScheme="gray"
              onClick={() => navigate("/bookings/history")}
            >
              Xem lịch sử đặt vé
            </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default PaymentFailedPage;
