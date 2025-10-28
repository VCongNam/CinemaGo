import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Flex,
  Image,
  Badge,
  Spinner,
  Button,
  useToast,
  Grid,
  GridItem,
  Divider,
  Card,
  CardBody,
} from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";

const BookingDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [allSeats, setAllSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const fetchBookingDetails = async () => {
      const token = localStorage.getItem("token");
      
      // Get all booking IDs (from navigation state or just the single ID)
      const bookingIds = location.state?.allBookingIds || [id];
      
      try {
        // Fetch all bookings in parallel
        const bookingPromises = bookingIds.map(bookingId =>
          fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }).then(res => res.json())
        );

        const results = await Promise.all(bookingPromises);
        console.log("All booking details:", results);
        
        // Merge all bookings and seats
        const allBookingsData = results.map(r => r.booking);
        const allSeatsData = results.flatMap(r => r.seats || []);
        
        setBookings(allBookingsData);
        setAllSeats(allSeatsData);
        
      } catch (err) {
        console.error("Fetch error:", err);
        toast({
          title: "Lỗi",
          description: "Không thể tải thông tin đặt vé",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [id, location.state, toast]);

  const formatPrice = (price) => {
    if (!price) return "0 VNĐ";
    const value = price.$numberDecimal || price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
      case "success":
        return "green";
      case "pending":
        return "yellow";
      case "canceled":
        return "red";
      default:
        return "gray";
    }
  };

  if (loading) {
    return (
      <Box bg="#0f1117" minH="100vh" color="white">
        <Box ml="250px" p={8}>
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="#ff8c00" />
          </Flex>
        </Box>
      </Box>
    );
  }

  if (!bookings || bookings.length === 0) {
    return (
      <Box bg="#0f1117" minH="100vh" color="white">
        <Box ml="250px" p={8}>
          <Text textAlign="center" color="gray.400">
            Không tìm thấy thông tin đặt vé
          </Text>
        </Box>
      </Box>
    );
  }

  // Use first booking for common info
  const mainBooking = bookings[0];
  
  // Calculate total amount from all bookings
  const totalAmount = bookings.reduce((sum, b) => {
    return sum + parseFloat(b.total_price?.$numberDecimal || b.total_price || 0);
  }, 0);
  
  const totalPaidAmount = bookings.reduce((sum, b) => {
    return sum + parseFloat(b.paid_amount?.$numberDecimal || b.paid_amount || 0);
  }, 0);

  return (
    <Box bg="#0f1117" minH="100vh" color="white">
      <Box ml="250px" p={8}>
        <Button
          leftIcon={<ArrowBackIcon />}
          variant="ghost"
          colorScheme="whiteAlpha"
          mb={6}
          onClick={() => navigate("/admin/bookings")}
        >
          Quay lại
        </Button>

        <Heading mb={6}>
          Chi tiết đặt vé #{mainBooking.order_code || mainBooking._id}
          {bookings.length > 1 && (
            <Badge ml={3} colorScheme="purple" fontSize="lg">
              {bookings.length} giao dịch
            </Badge>
          )}
        </Heading>

        <Grid templateColumns="repeat(12, 1fr)" gap={6}>
          {/* Thông tin phim */}
          <GridItem colSpan={{ base: 12, lg: 4 }}>
            <Card bg="#1a1e29">
              <CardBody>
                <Heading size="md" mb={4} color="white">Thông tin phim</Heading>
                <Image
                  src={mainBooking.showtime_id?.movie_id?.poster_url}
                  alt={mainBooking.showtime_id?.movie_id?.title}
                  borderRadius="md"
                  mb={4}
                  fallbackSrc="https://via.placeholder.com/300"
                />
                <Text fontSize="lg" fontWeight="bold" color="white">
                  {mainBooking.showtime_id?.movie_id?.title || "N/A"}
                </Text>
                <Text fontSize="sm" color="gray.400" mt={2}>
                  Thời lượng: {mainBooking.showtime_id?.movie_id?.duration || 0} phút
                </Text>
                <Text fontSize="sm" color="gray.400">
                  Thể loại: {mainBooking.showtime_id?.movie_id?.genre?.join(", ") || "N/A"}
                </Text>
              </CardBody>
            </Card>
          </GridItem>

          {/* Thông tin đặt vé */}
          <GridItem colSpan={{ base: 12, lg: 8 }}>
            <Card bg="#1a1e29" mb={6}>
              <CardBody>
                <Heading size="md" mb={4} color="white">Thông tin đặt vé</Heading>
                
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Mã đặt vé</Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.order_code || mainBooking._id}
                    </Text>
                  </Box>
                  
                  <Box>
                    <Text fontSize="sm" color="gray.400">Trạng thái</Text>
                    <Badge colorScheme={getStatusColor(mainBooking.status)}>
                      {mainBooking.status}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Người đặt</Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.user_id?.username || "N/A"}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {mainBooking.user_id?.email || ""}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Ngày đặt</Text>
                    <Text color="white">
                      {mainBooking.created_at?.vietnamFormatted || mainBooking.created_at || "N/A"}
                    </Text>
                  </Box>
                </Grid>

                <Divider my={4} borderColor="gray.600" />

                <Heading size="sm" mb={3} color="white">Thông tin suất chiếu</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Rạp chiếu</Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.showtime_id?.room_id?.theater_id?.name || "N/A"}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {mainBooking.showtime_id?.room_id?.theater_id?.location || ""}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Phòng chiếu</Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.showtime_id?.room_id?.name || "N/A"}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Giờ chiếu</Text>
                    <Text color="white">
                      {mainBooking.showtime_id?.start_time?.vietnamFormatted || 
                       mainBooking.showtime_id?.start_time || "N/A"}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Kết thúc</Text>
                    <Text color="white">
                      {mainBooking.showtime_id?.end_time?.vietnamFormatted || 
                       mainBooking.showtime_id?.end_time || "N/A"}
                    </Text>
                  </Box>
                </Grid>

                <Divider my={4} borderColor="gray.600" />

                <Heading size="sm" mb={3} color="white">
                  Ghế đã đặt ({allSeats.length} ghế)
                </Heading>
                <Flex gap={2} flexWrap="wrap">
                  {allSeats.length > 0 ? (
                    allSeats.map((seat, idx) => (
                      <Badge key={idx} colorScheme="blue" fontSize="md" p={2}>
                        {seat.seat_id?.seat_number || "N/A"}
                      </Badge>
                    ))
                  ) : (
                    <Text color="gray.400">Không có thông tin ghế</Text>
                  )}
                </Flex>

                <Divider my={4} borderColor="gray.600" />

                <Heading size="sm" mb={3} color="white">Thanh toán</Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">Phương thức</Text>
                    <Text color="white">{mainBooking.payment_method || "N/A"}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Trạng thái thanh toán</Text>
                    <Badge colorScheme={getStatusColor(mainBooking.payment_status)}>
                      {mainBooking.payment_status}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Tổng tiền</Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.400">
                      {formatPrice(totalAmount)}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">Đã thanh toán</Text>
                    <Text fontSize="xl" fontWeight="bold" color="white">
                      {formatPrice(totalPaidAmount)}
                    </Text>
                  </Box>
                </Grid>

                {bookings.length > 1 && (
                  <>
                    <Divider my={4} borderColor="gray.600" />
                    <Heading size="sm" mb={3} color="white">
                      Chi tiết các giao dịch
                    </Heading>
                    {bookings.map((booking, idx) => (
                      <Box key={idx} p={3} bg="#252a38" borderRadius="md" mb={2}>
                        <Flex justify="space-between" align="center">
                          <Box>
                            <Text fontSize="sm" color="gray.400">
                              Giao dịch #{idx + 1}
                            </Text>
                            <Text fontSize="sm" color="white">
                              Mã: {booking.order_code || booking._id}
                            </Text>
                          </Box>
                          <Text fontWeight="bold" color="green.400">
                            {formatPrice(booking.total_price)}
                          </Text>
                        </Flex>
                      </Box>
                    ))}
                  </>
                )}
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

export default BookingDetailPage;