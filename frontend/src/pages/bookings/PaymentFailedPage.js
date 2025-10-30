import { Box, Heading, Text, Button, VStack, Icon } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { WarningTwoIcon } from '@chakra-ui/icons';
import { useEffect, useState } from "react";
import apiService from "../../services/apiService";
import { Image, HStack, Stack, Divider, Badge } from "@chakra-ui/react";

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("bookingId");


  const [booking, setBooking] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [seats, setSeats] = useState([]);

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

    // GỌI API lấy chi tiết booking để hiển thị phim + ghế
    apiService.getById('/api/bookings/', bookingId, (data, ok) => {
      if (ok) {
        let updated = data.booking;
        // Đồng bộ trạng thái hủy nếu payment đã CANCELLED
        if (paymentInfo?.status === 'CANCELLED') {
          updated = { ...updated, status: 'CANCELLED', payment_status: 'CANCELLED' };
        }
        setBooking(prev => ({ ...(updated || prev || {}), ...(prev || {}) }));
        setSeats(Array.isArray(data.seats) ? data.seats : []);
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
            Trạng thái: {booking.status === 'cancelled' ? 'Đã hủy' : booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status === 'pending' ? 'Chờ thanh toán' : booking.status}
            , Trạng thái thanh toán: {booking.payment_status === 'failed' ? 'Thất bại' : booking.payment_status === 'paid' ? 'Đã thanh toán' : booking.payment_status === 'pending' ? 'Chờ thanh toán' : booking.payment_status === 'cancelled' ? 'Đã hủy' : booking.payment_status}
          </Text>
        )}
        {booking && booking.showtime_id && (
          <VStack spacing={1} color="gray.200" bg="#1a1b23" p={4} borderRadius="lg" w="full">
            <Heading as="h3" size="md" color="#d53f8c">Thông tin đặt vé</Heading>
            <HStack align="start" spacing={4} w="full">
              {/* Poster phim */}
              {booking.showtime_id.movie_id?.poster_url && (
                <Image
                  src={booking.showtime_id.movie_id.poster_url}
                  alt={booking.showtime_id.movie_id?.title || 'Poster'}
                  boxSize={{ base: "90px", md: "120px" }}
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
              {/* Chi tiết phim và suất chiếu */}
              <VStack align="start" spacing={1} w="full">
                <Heading as="h4" size="sm" color="white">{booking.showtime_id.movie_id?.title}</Heading>
                {!!(booking.showtime_id.movie_id?.genre?.length) && (
                  <HStack spacing={2} flexWrap="wrap">
                    {booking.showtime_id.movie_id.genre.map((g, idx) => (
                      <Badge key={idx} colorScheme="pink" variant="subtle">{g}</Badge>
                    ))}
                  </HStack>
                )}
                {booking.showtime_id.movie_id?.duration && (
                  <Text fontSize="sm" color="gray.400">Thời lượng: {booking.showtime_id.movie_id.duration} phút</Text>
                )}
                {booking.showtime_id.movie_id?.description && (
                  <Text fontSize="sm" color="gray.400" noOfLines={3}>{booking.showtime_id.movie_id.description}</Text>
                )}
                <Divider borderColor="#2a2b33" my={2} />
                <Text><strong>Rạp:</strong> {booking.showtime_id.room_id?.theater_id?.name}</Text>
                <Text><strong>Phòng chiếu:</strong> {booking.showtime_id.room_id?.name}</Text>
                <Text>
                  <strong>Suất chiếu:</strong> {booking.showtime_id.start_time?.vietnamFormatted || new Date(booking.showtime_id.start_time?.vietnam || booking.showtime_id.start_time).toLocaleString('vi-VN')}
                </Text>
                {!!seats.length && (
                  <Text>
                    <strong>Ghế:</strong> {seats.map(s => s.seat_id?.seat_number || s.seat_number).join(', ')}
                  </Text>
                )}
              </VStack>
            </HStack>
          </VStack>
        )}
        {bookingId && (
          <Text color="gray.400">Mã đặt vé của bạn là: {bookingId}</Text>
        )}
        <VStack spacing={4} direction="column" mt={8}>
          
          <Button 
            variant="outline"
            color="white"
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