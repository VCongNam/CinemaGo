
import { Box, Text, VStack, Heading, Button, HStack, Icon, Image, Divider, Badge } from "@chakra-ui/react";
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { keyframes } from "@emotion/react";
import apiService from "../../services/apiService";

const pulse = keyframes`
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1.2);
  }
`;

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("pending");
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState(null);
  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get("bookingId");
    const cancel = params.get("cancel");
    const status = params.get("status");

    if (id) {
      setBookingId(id);
    } else {
      setError("Không tìm thấy mã đặt vé.");
      return;
    }

    // Immediately redirect if the URL indicates a cancelled payment
    if (cancel === "true" || status === "CANCELLED") {
      navigate(`/payment-failed?bookingId=${id}&cancel=true`);
      return;
    }
  }, [location.search, navigate]);

  // Effect để lấy booking details
  useEffect(() => {
    if (!bookingId) return;

    apiService.getById('/api/bookings/', bookingId, (data, ok) => {
      if (ok) {
        console.log("Booking details:", data);
        const bookingData = data.booking;
        setBooking(bookingData);
        setSeats(Array.isArray(data.seats) ? data.seats : []);
        
        // Kiểm tra và cập nhật status từ booking ngay lập tức
        if (bookingData?.status === "confirmed" || 
            bookingData?.payment_status === "success" || 
            bookingData?.payment_status === "paid") {
          setStatus("confirmed");
        } else if (bookingData?.status) {
          setStatus(bookingData.status);
        }
      } else {
        console.error("Failed to fetch booking details:", data);
        setBooking(null);
        setSeats([]);
      }
    });
  }, [bookingId]);

  // Effect để check payment status
  useEffect(() => {
    if (!bookingId) return;
    if (status === "confirmed") return; // Không cần check nếu đã confirmed

    let interval = null;

    const checkPaymentStatus = () => {
      apiService.get(
        `/api/payments/booking/${bookingId}/status`,
        (data, success) => {
          if (success && data?.data) {
            const bookingData = data.data.booking;
            const paymentInfo = data.data.paymentInfo;
            const bookingStatus = bookingData?.status;
            const paymentStatus = bookingData?.payment_status;

            console.log("Payment status check:", { bookingStatus, paymentStatus, paymentInfoStatus: paymentInfo?.status });

            // Kiểm tra nếu booking đã được confirmed hoặc payment đã success/paid
            if (
              bookingStatus === "confirmed" || 
              paymentStatus === "success" ||
              paymentStatus === "paid" ||
              (paymentInfo && paymentInfo.status === 'PAID')
            ) {
              setStatus("confirmed");
              // Reload booking details để có thông tin mới nhất
              apiService.getById('/api/bookings/', bookingId, (data, ok) => {
                if (ok) {
                  setBooking(data.booking);
                  setSeats(Array.isArray(data.seats) ? data.seats : []);
                }
              });
              if (interval) clearInterval(interval);
              return;
            }

            // Kiểm tra nếu booking bị cancelled hoặc payment failed/cancelled
            if (
              bookingStatus === "cancelled" ||
              paymentStatus === "failed" ||
              paymentStatus === "cancelled" ||
              (paymentInfo && (paymentInfo.status === 'CANCELLED' || paymentInfo.status === 'FAILED'))
            ) {
              setStatus("cancelled");
              if (interval) clearInterval(interval);
              navigate(`/payment-failed?bookingId=${bookingId}`);
              return;
            }

            // Cập nhật status hiển thị
            if (bookingStatus) {
              setStatus(bookingStatus);
            }
          } else {
            const errorMsg = data?.message || "Lỗi khi kiểm tra trạng thái thanh toán.";
            console.error("Payment status check error:", errorMsg);
            // Chỉ set error nếu chưa có booking data
            if (!booking) {
              setError(errorMsg);
            }
            if (interval) clearInterval(interval);
          }
        }
      );
    };

    // Check ngay lập tức khi component mount
    checkPaymentStatus();

    // Sau đó check định kỳ mỗi 1.5 giây để phản hồi nhanh hơn
    interval = setInterval(checkPaymentStatus, 1500);

    // Cleanup interval on component unmount
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [bookingId, navigate, status, booking]);

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
        {error && !booking ? (
          <>
            <Heading color="red.400">Đã xảy ra lỗi</Heading>
            <Text>{error}</Text>
            <Button colorScheme="pink" onClick={() => navigate("/")}>
              Về trang chủ
            </Button>
          </>
        ) : status === "confirmed" && booking ? (
          <>
            <Icon as={CheckCircleIcon} w={20} h={20} color="green.400" />
            <Heading as="h1" size="2xl" color="green.400">
              Thanh toán thành công!
            </Heading>
            <Text fontSize="lg" color="gray.300">
              Cảm ơn bạn đã đặt vé. Vé của bạn đã được xác nhận thành công.
            </Text>
            {booking && (
              <Text color="gray.300">
                Trạng thái: {booking.status === 'confirmed' ? 'Đã xác nhận' : booking.status}
                {booking.payment_status && (
                  <> - Trạng thái thanh toán: {booking.payment_status === 'success' || booking.payment_status === 'paid' ? 'Đã thanh toán' : booking.payment_status}</>
                )}
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
                    {booking.total_price && (
                      <Text mt={2}>
                        <strong>Tổng tiền:</strong> {parseFloat(booking.total_price.$numberDecimal || booking.total_price).toLocaleString("vi-VN")} ₫
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
                colorScheme="orange"
                onClick={() => navigate("/ticket-history")}
                size="lg"
              >
                Xem lịch sử đặt vé
              </Button>
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
          </>
        ) : (
          <>
            <Heading>Chờ chút nhé...</Heading>
            <HStack spacing={2} justify="center">
              <Box
                w="12px"
                h="12px"
                borderRadius="full"
                bg="orange.400"
                css={{
                  animation: `${pulse} 1.4s ease-in-out infinite`
                }}
              />
              <Box
                w="12px"
                h="12px"
                borderRadius="full"
                bg="orange.400"
                css={{
                  animation: `${pulse} 1.4s ease-in-out infinite 0.2s`
                }}
              />
              <Box
                w="12px"
                h="12px"
                borderRadius="full"
                bg="orange.400"
                css={{
                  animation: `${pulse} 1.4s ease-in-out infinite 0.4s`
                }}
              />
            </HStack>
            <Text>
              Đang xác nhận thanh toán của bạn. Vui lòng không rời khỏi trang.
            </Text>
            <Text fontSize="sm" color="gray.400">
              Trạng thái hiện tại: {status}
            </Text>
            {/* Hiển thị thông tin booking nếu có, ngay cả khi đang pending */}
            {booking && booking.showtime_id && (
              <VStack spacing={1} color="gray.200" bg="#1a1b23" p={4} borderRadius="lg" w="full" mt={4}>
                <Heading as="h3" size="md" color="#d53f8c">Thông tin đặt vé</Heading>
                <HStack align="start" spacing={4} w="full">
                  {booking.showtime_id.movie_id?.poster_url && (
                    <Image
                      src={booking.showtime_id.movie_id.poster_url}
                      alt={booking.showtime_id.movie_id?.title || 'Poster'}
                      boxSize={{ base: "90px", md: "120px" }}
                      objectFit="cover"
                      borderRadius="md"
                    />
                  )}
                  <VStack align="start" spacing={1} w="full">
                    <Heading as="h4" size="sm" color="white">{booking.showtime_id.movie_id?.title}</Heading>
                    {!!(booking.showtime_id.movie_id?.genre?.length) && (
                      <HStack spacing={2} flexWrap="wrap">
                        {booking.showtime_id.movie_id.genre.map((g, idx) => (
                          <Badge key={idx} colorScheme="pink" variant="subtle">{g}</Badge>
                        ))}
                      </HStack>
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
          </>
        )}
      </VStack>
    </Box>
  );
};

export default PaymentSuccessPage;
