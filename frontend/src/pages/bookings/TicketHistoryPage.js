import { 
  Box, 
  Text, 
  VStack, 
  Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel, 
  SimpleGrid, 
  Spinner, 
  Alert, 
  AlertIcon,
  Center
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import apiService from "../../services/apiService";
import TicketCard from "../Navbar/TicketCard";

const TicketHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Gọi đúng endpoint và dùng callback của apiService
    apiService.get("/api/bookings/my-bookings", {}, (data, success) => {
      if (success) {
        const list = Array.isArray(data) ? data : (data?.list || []);
        setBookings(list);
      } else {
        setError(data?.message || "Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.");
      }
      setLoading(false);
    });
  }, []);

  const filterBookingsByStatus = (status) => {
    return bookings.filter((booking) => booking.status === status);
  };

  const renderTicketCard = (booking) => {
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

    // Get theater name
    const theater = booking.showtime_id?.room_id?.theater_id?.name || '';

    return (
      <TicketCard
        key={booking._id}
        bookingId={booking._id}
        ticket={{
          movie: booking.showtime_id?.movie_id?.title || '',
          room: booking.showtime_id?.room_id?.name || '',
          theater: theater,
          bookingId: bookingId,
          combos: combos,
          seat: Array.isArray(booking.seats)
            ? booking.seats.map(s => s.seat_id?.seat_number || s.seat_number).join(', ')
            : '',
          status: booking.status,
          payment_status: booking.payment_status,
          date: booking.showtime_id?.start_time?.vietnamFormatted || '',
          total: booking.total_price?.$numberDecimal ? parseFloat(booking.total_price.$numberDecimal) : undefined,
        }}
      />
    );
  };

  if (loading) {
    return (
      <Center bg="#0f1117" minH="50vh">
        <Spinner color="orange.400" size="lg" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box p={5} bg="#0f1117" minH="100vh">
      <Text fontSize="2xl" fontWeight="bold" mb={5} color="#ff9900">Lịch sử đặt vé</Text>
      <Tabs isFitted variant="enclosed" color="#ff9900">
        <TabList mb="1em">
          <Tab color="#ff9900">Tất cả</Tab>
          <Tab color="#ff9900">Đang chờ</Tab>
          <Tab color="#ff9900">Đã thanh toán</Tab>
          <Tab color="#ff9900">Đã hủy</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {bookings.map(renderTicketCard)}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {filterBookingsByStatus("pending").map(renderTicketCard)}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {filterBookingsByStatus("confirmed").map(renderTicketCard)}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {filterBookingsByStatus("cancelled").map(renderTicketCard)}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TicketHistoryPage;
