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
    
    // GỌI API kiểm tra trạng thái booking/payment để reconcile status từ PayOS (gọi song song để trigger reconcile)
    apiService.get(`/api/payments/booking/${bookingId}/status`, (data, success) => {
      if (success) {
        setPaymentInfo(data.data.paymentInfo);
      }
    });

    // GỌI API lấy chi tiết booking để hiển thị phim + ghế (gọi song song để hiển thị ngay)
    apiService.getById('/api/bookings/', bookingId, (data, ok) => {
      if (ok) {
        console.log("Booking details:", data);
        setBooking(data.booking);
        setSeats(Array.isArray(data.seats) ? data.seats : []);
      } else {
        console.error("Failed to fetch booking details:", data);
        setBooking(null);
        setSeats([]);
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
            onClick={() => {
              // Kiểm tra xem có phải staff không
              const isStaff = localStorage.getItem("isStaff") === "true";
              let role = (localStorage.getItem("userRole") || "").toLowerCase();
              
              // Nếu không có từ userRole, thử lấy từ role object
              if (!role) {
                try {
                  const roleData = JSON.parse(localStorage.getItem("role"));
                  role = (roleData?.role || "").toLowerCase();
                } catch (e) {
                  // Ignore
                }
              }
              
              const isStaffRole = role === "lv1" || role === "lv2" || role === "admin";
              
              if (isStaff || isStaffRole) {
                // Ưu tiên lấy từ sessionStorage/localStorage
                let staffPage = sessionStorage.getItem("staffReturnPage");
                if (!staffPage) {
                  staffPage = localStorage.getItem("staffReturnPage");
                }
                
                // Nếu có staffReturnPage, dùng nó
                if (staffPage) {
                  sessionStorage.removeItem("staffReturnPage");
                  localStorage.removeItem("staffReturnPage");
                  navigate(staffPage);
                } else {
                  // Fallback về trang staff dựa trên role
                  const fallbackPage = role === "lv2" ? "/staff/l2" : "/staff/l1";
                  navigate(fallbackPage);
                }
              } else {
                navigate("/");
              }
            }}
            size="lg"
          >
            {(() => {
              const isStaff = localStorage.getItem("isStaff") === "true";
              let role = (localStorage.getItem("userRole") || "").toLowerCase();
              if (!role) {
                try {
                  const roleData = JSON.parse(localStorage.getItem("role"));
                  role = (roleData?.role || "").toLowerCase();
                } catch (e) {
                  // Ignore
                }
              }
              const isStaffRole = role === "lv1" || role === "lv2" || role === "admin";
              return isStaff || isStaffRole ? "Quay về trang staff" : "Quay về trang chủ";
            })()}
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default PaymentFailedPage;