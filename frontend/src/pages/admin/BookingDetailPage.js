// ...existing code...
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
  VStack,
  HStack,
  Spacer,
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
        const bookingPromises = bookingIds.map((bookingId) =>
          fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
            headers: {
              "Content-Type": "application/json",
              ...(token && { Authorization: `Bearer ${token}` }),
            },
          }).then((res) => res.json())
        );

        const results = await Promise.all(bookingPromises);
        console.log("All booking details:", results);

        // Merge all bookings and seats
        // handle different response shapes defensively
        const allBookingsData = results.map((r) => r.booking || r.data || r);
        const allSeatsData = results.flatMap((r) => {
          const seatsFromRes = r.seats || r.data?.seats || r.booking?.seats || [];
          return Array.isArray(seatsFromRes) ? seatsFromRes : [];
        });

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

  const numericValue = (v) => {
    if (v === undefined || v === null) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "string") {
      const n = parseFloat(v);
      return isNaN(n) ? 0 : n;
    }
    if (typeof v === "object") {
      if (v.$numberDecimal) {
        const n = parseFloat(v.$numberDecimal);
        return isNaN(n) ? 0 : n;
      }
      if (v.value) {
        const n = parseFloat(v.value);
        return isNaN(n) ? 0 : n;
      }
    }
    return 0;
  };

  const formatPrice = (price) => {
    const num = numericValue(price);
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
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

  // Calculate total amount from all bookings (fallback to numeric)
  const totalAmount = bookings.reduce((sum, b) => {
    return sum + numericValue(b.total_price?.$numberDecimal ?? b.total_price ?? 0);
  }, 0);

  const totalPaidAmount = bookings.reduce((sum, b) => {
    return sum + numericValue(b.paid_amount?.$numberDecimal ?? b.paid_amount ?? 0);
  }, 0);

  // Extract combos from bookings (support multiple possible keys)
  const bookingCombosPerBooking = bookings.map((b) => {
    const raw = b.combos || b.foods || b.selectedFoods || b.extras || b.items || [];
    // normalize each item to { id, name, quantity, price }
    const arr = (Array.isArray(raw) ? raw : []).map((c) => {
      // Handle nested combo_id structure
      const comboData = c.combo_id || c.combo || c;
      const id = comboData._id || comboData.id || c._id || c.id || "";
      const name = comboData.name || comboData.title || c.name || c.title || "Combo";
      const qty = c.quantity || c.qty || c.count || 1;
      
      // Get price from combo_id.price or combo.price, with $numberDecimal support
      let price = 0;
      if (comboData.price) {
        price = numericValue(comboData.price);
      } else if (comboData.base_price) {
        price = numericValue(comboData.base_price);
      } else if (c.price) {
        price = numericValue(c.price);
      }
      
      return { id, name, quantity: Number(qty || 1), price };
    });
    return arr;
  });

  const combosTotalAll = bookingCombosPerBooking.reduce((sum, arr) => {
    return sum + arr.reduce((s, it) => s + it.price * (it.quantity || 0), 0);
  }, 0);

  return (
    <Box bg="#0f1117" minH="100vh" color="white">
      <Box ml="250px" p={8}>
        <Button
          leftIcon={<ArrowBackIcon />}
          variant="ghost"
          colorScheme="whiteAlpha"
          mb={6}
          onClick={() => navigate("/bookings")}
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
                <Heading size="md" mb={4} color="white">
                  Thông tin phim
                </Heading>
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
                  Thể loại: {mainBooking.showtime_id?.movie_id?.genre?.join?.(", ") || "N/A"}
                </Text>
              </CardBody>
            </Card>
          </GridItem>

          {/* Thông tin đặt vé */}
          <GridItem colSpan={{ base: 12, lg: 8 }}>
            <Card bg="#1a1e29" mb={6}>
              <CardBody>
                <Heading size="md" mb={4} color="white">
                  Thông tin đặt vé
                </Heading>

                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Mã đặt vé
                    </Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.order_code || mainBooking._id}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Trạng thái
                    </Text>
                    <Badge colorScheme={getStatusColor(mainBooking.status)}>{mainBooking.status}</Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Người đặt
                    </Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.user_id?.username || "N/A"}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {mainBooking.user_id?.email || ""}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Ngày đặt
                    </Text>
                    <Text color="white">
                      {mainBooking.created_at?.vietnamFormatted || mainBooking.created_at || "N/A"}
                    </Text>
                  </Box>
                </Grid>

                <Divider my={4} borderColor="gray.600" />

                <Heading size="sm" mb={3} color="white">
                  Thông tin suất chiếu
                </Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Rạp chiếu
                    </Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.showtime_id?.room_id?.theater_id?.name || "N/A"}
                    </Text>
                    <Text fontSize="xs" color="gray.400">
                      {mainBooking.showtime_id?.room_id?.theater_id?.location || ""}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Phòng chiếu
                    </Text>
                    <Text fontWeight="bold" color="white">
                      {mainBooking.showtime_id?.room_id?.name || "N/A"}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Giờ chiếu
                    </Text>
                    <Text color="white">
                      {mainBooking.showtime_id?.start_time?.vietnamFormatted ||
                        mainBooking.showtime_id?.start_time ||
                        "N/A"}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Kết thúc
                    </Text>
                    <Text color="white">
                      {mainBooking.showtime_id?.end_time?.vietnamFormatted ||
                        mainBooking.showtime_id?.end_time ||
                        "N/A"}
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
                        {seat.seat_id?.seat_number || seat.seat_number || "N/A"}
                      </Badge>
                    ))
                  ) : (
                    <Text color="gray.400">Không có thông tin ghế</Text>
                  )}
                </Flex>

                <Divider my={4} borderColor="gray.600" />

                {/* Combos section */}
                <Heading size="sm" mb={3} color="white">
                  Combo đã chọn
                </Heading>

                {bookingCombosPerBooking.every((arr) => arr.length === 0) ? (
                  <Text color="gray.400" mb={3}>
                    Không có combo được chọn
                  </Text>
                ) : (
                  <VStack align="stretch" spacing={3} mb={3}>
                    {bookingCombosPerBooking.map((arr, i) =>
                      arr.length === 0 ? null : (
                        <Box key={i} p={3} bg="#252a38" borderRadius="md">
                          <Text fontSize="sm" color="gray.400" mb={2}>
                            Giao dịch #{i + 1}
                          </Text>
                          <VStack spacing={2} align="stretch">
                            {arr.map((c, idx) => (
                              <HStack key={c.id || idx} justify="space-between">
                                <Box>
                                  <Text color="white" fontWeight="semibold">
                                    {c.name}
                                  </Text>
                                  <Text fontSize="xs" color="gray.400">
                                    Số lượng: {c.quantity}
                                  </Text>
                                </Box>
                                <Spacer />
                                <Text color="orange.300" fontWeight="bold">
                                  {formatPrice(c.price * (c.quantity || 1))}
                                </Text>
                              </HStack>
                            ))}
                            <Divider />
                            <Flex justify="space-between">
                              <Text fontSize="sm" color="gray.400">
                                Tổng combo (giao dịch #{i + 1})
                              </Text>
                              <Text fontWeight="bold" color="orange.400">
                                {formatPrice(arr.reduce((s, it) => s + it.price * (it.quantity || 0), 0))}
                              </Text>
                            </Flex>
                          </VStack>
                        </Box>
                      )
                    )}
                    {/* Overall combos total */}
                    <Box p={3} bg="#232731" borderRadius="md">
                      <Flex justify="space-between">
                        <Text color="gray.400">Tổng tất cả combo</Text>
                        <Text fontWeight="bold" color="orange.400">
                          {formatPrice(combosTotalAll)}
                        </Text>
                      </Flex>
                    </Box>
                  </VStack>
                )}

                <Divider my={4} borderColor="gray.600" />

                <Heading size="sm" mb={3} color="white">
                  Thanh toán
                </Heading>
                <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Phương thức
                    </Text>
                    <Text color="white">{mainBooking.payment_method || "N/A"}</Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Trạng thái thanh toán
                    </Text>
                    <Badge colorScheme={getStatusColor(mainBooking.payment_status)}>
                      {mainBooking.payment_status}
                    </Badge>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Tổng tiền
                    </Text>
                    <Text fontSize="2xl" fontWeight="bold" color="green.400">
                      {formatPrice(totalAmount)}
                    </Text>
                  </Box>

                  <Box>
                    <Text fontSize="sm" color="gray.400">
                      Đã thanh toán
                    </Text>
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
// ...existing code...