import { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, Center, VStack, Divider, Alert, AlertIcon, HStack, Badge } from '@chakra-ui/react';
import { useParams } from 'react-router-dom';
import apiService from '../../services/apiService';

export default function TicketDetailPage() {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    apiService.getById('/api/bookings/', id, (data, success) => {
      if (success) {
        setBooking(data.booking);
        setSeats(Array.isArray(data.seats) ? data.seats : []);
      } else {
        setError(data?.message || 'Không thể tải thông tin chi tiết vé.');
      }
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <Center minH="50vh"><Spinner color="orange.400" size="xl" /></Center>;
  }
  if (error) {
    return (
      <Alert status="error" my={4} maxW="md" mx="auto">
        <AlertIcon /> {error}
      </Alert>
    )
  }
  if (!booking) return null;

  // Extract combos from booking
  const combos = [];
  const rawCombos = booking.combos || [];
  if (Array.isArray(rawCombos) && rawCombos.length > 0) {
    rawCombos.forEach((c) => {
      const comboData = c.combo_id || c.combo || c;
      const name = comboData?.name || comboData?.title || c?.name || c?.title || "Combo";
      const quantity = c.quantity || c.qty || c.count || 1;
      combos.push({ name, quantity });
    });
  }

  // Get booking ID (order_code or _id)
  const bookingId = booking.order_code || booking._id || '';

  return (
    <Box bg="#0f1117" color="white" minH="100vh" py={8} px={4} display="flex" justifyContent="center" alignItems="center">
      <Box bg="#1a1d29" p={8} borderRadius="xl" maxW="450px" w="full" boxShadow="2xl">
        <VStack spacing={4} align="stretch">
          <Heading size="lg" color="#ff9900" textAlign="center">Chi tiết vé</Heading>
          <Divider borderColor="#2a2b33" />
          
          {/* Booking ID - Prominently displayed */}
          <Box bg="#252a38" p={3} borderRadius="md">
            <Text fontSize="xs" color="gray.400" mb={1}>Mã đặt vé (BookingID)</Text>
            <Text color="#ff9900" fontWeight="bold" fontSize="md">{bookingId}</Text>
          </Box>

          {booking.showtime_id && <>
            <Heading size="md" mt={2} color="#d53f8c">{booking.showtime_id.movie_id?.title}</Heading>
            <Text color="gray.400" fontSize="sm" noOfLines={2}>{booking.showtime_id.movie_id?.description}</Text>
            
            {/* Theater - Rạp */}
            <Box bg="#252a38" p={3} borderRadius="md">
              <Text fontSize="xs" color="gray.400" mb={1}>Rạp</Text>
              <Text color="blue.300" fontWeight="semibold">{booking.showtime_id.room_id?.theater_id?.name || "N/A"}</Text>
              {booking.showtime_id.room_id?.theater_id?.location && (
                <Text fontSize="xs" color="gray.500">{booking.showtime_id.room_id.theater_id.location}</Text>
              )}
            </Box>

            <Text color="gray.200"><b>Phòng chiếu:</b> {booking.showtime_id.room_id?.name}</Text>
            <Text color="gray.200"><b>Suất chiếu:</b> {booking.showtime_id.start_time?.vietnamFormatted}</Text>
            {seats.length > 0 && (
              <Text color="gray.200"><b>Ghế:</b> {seats.map(s => s.seat_id?.seat_number || s.seat_number).join(', ')}</Text>
            )}

            {/* Combo section */}
            {combos.length > 0 && (
              <>
                <Divider borderColor="#2a2b33" />
                <Box>
                  <Text color="purple.300" fontWeight="bold" mb={2}>🍿 Combo đã chọn:</Text>
                  <VStack align="stretch" spacing={2}>
                    {combos.map((combo, idx) => (
                      <HStack key={idx} justify="space-between" bg="#252a38" p={2} borderRadius="md">
                        <Text color="white" fontSize="sm">{combo.name}</Text>
                        <Badge colorScheme="purple" fontSize="sm">x{combo.quantity}</Badge>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              </>
            )}

            <Text color="gray.300"><b>Trạng thái vé:</b> {booking.status}</Text>
            <Text color="gray.300"><b>Trạng thái thanh toán:</b> {booking.payment_status}</Text>
            <Divider borderColor="#2a2b33" />
            <Text color="#ff9900" fontWeight="bold" fontSize="lg" textAlign="right">
              Tổng cộng: {booking.total_price?.$numberDecimal ? parseFloat(booking.total_price.$numberDecimal).toLocaleString("vi-VN") : ''} ₫
            </Text>
          </>}
        </VStack>
      </Box>
    </Box>
  );
}
