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
  AlertIcon 
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import apiService from "../../services/apiService";
import TicketCard from "../Navbar/TicketCard";

const TicketHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await apiService.get("/bookings/my-bookings");
        setBookings(response.data);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải lịch sử đặt vé. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const filterBookingsByStatus = (status) => {
    return bookings.filter((booking) => booking.status === status);
  };

  if (loading) {
    return <Spinner />;
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
    <Box p={5}>
      <Text fontSize="2xl" fontWeight="bold" mb={5}>Lịch sử đặt vé</Text>
      <Tabs isFitted variant="enclosed">
        <TabList mb="1em">
          <Tab>Đang chờ</Tab>
          <Tab>Thành công</Tab>
          <Tab>Đã hủy</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {filterBookingsByStatus("pending").map((booking) => (
                <TicketCard key={booking._id} booking={booking} />
              ))}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {filterBookingsByStatus("successful").map((booking) => (
                <TicketCard key={booking._id} booking={booking} />
              ))}
            </SimpleGrid>
          </TabPanel>
          <TabPanel>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={5}>
              {filterBookingsByStatus("cancelled").map((booking) => (
                <TicketCard key={booking._id} booking={booking} />
              ))}
            </SimpleGrid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default TicketHistoryPage;
