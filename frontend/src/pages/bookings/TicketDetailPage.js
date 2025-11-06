import { useEffect, useState } from 'react';
import { Box, Heading, Text, Spinner, Center, VStack, Divider, Alert, AlertIcon } from '@chakra-ui/react';
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

  return (
    <Box bg="#0f1117" color="white" minH="100vh" py={8} px={4} display="flex" justifyContent="center" alignItems="center">
      <Box bg="#1a1d29" p={8} borderRadius="xl" maxW="450px" w="full" boxShadow="2xl">
        <VStack spacing={4} align="stretch">
          <Heading size="lg" color="#ff9900" textAlign="center">Chi tiết vé</Heading>
          <Divider borderColor="#2a2b33" />
          {booking.showtime_id && <>
            <Heading size="md" mt={2} color="#d53f8c">{booking.showtime_id.movie_id?.title}</Heading>
            <Text color="gray.400" fontSize="sm" noOfLines={2}>{booking.showtime_id.movie_id?.description}</Text>
            <Text color="gray.200"><b>Rạp:</b> {booking.showtime_id.room_id?.theater_id?.name}</Text>
            <Text color="gray.200"><b>Phòng chiếu:</b> {booking.showtime_id.room_id?.name}</Text>
            <Text color="gray.200"><b>Suất chiếu:</b> {booking.showtime_id.start_time?.vietnamFormatted}</Text>
            {seats.length > 0 && (
              <Text color="gray.200"><b>Ghế:</b> {seats.map(s => s.seat_id?.seat_number || s.seat_number).join(', ')}</Text>
            )}
            <Text color="gray.300"><b>Trạng thái vé:</b> {booking.status}</Text>
            <Text color="gray.300"><b>Trạng thái thanh toán:</b> {booking.payment_status}</Text>
            <Divider borderColor="#2a2b33" />
            <Text color="#ff9900" fontWeight="bold" fontSize="lg" textAlign="right">
              Tổng cộng: {booking.total_price?.$numberDecimal ? parseFloat(booking.total_price.$numberDecimal).toLocaleString("vi-VN") : ''} ₫
            </Text>
            <Text fontSize="sm" color="gray.500">Mã vé: {booking._id}</Text>
          </>}
        </VStack>
      </Box>
    </Box>
  );
}
