import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Badge,
  Spinner,
  Text,
  Flex,
  useToast,
  IconButton,
  Input,
  Select,
  HStack,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ViewIcon } from "@chakra-ui/icons";
import Sidebar from "../Navbar/SidebarAdmin";

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const token = localStorage.getItem("token");
    
    const fetchBookings = async () => {
      try {
        const bookingsRes = await fetch("http://localhost:5000/api/bookings", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });
        
        if (!bookingsRes.ok) throw new Error("Không thể tải dữ liệu đặt vé");
        const bookingsData = await bookingsRes.json();
        
        if (!isMounted) return;
        
        const bookingsList = bookingsData.bookings || [];
        
        // Group bookings by user_id + showtime_id + payment_status
        const groupedBookings = {};
        bookingsList.forEach((booking) => {
          const key = `${booking.user_id?._id}-${booking.showtime_id?._id}-${booking.payment_status?.toLowerCase()}`;
          
          if (!groupedBookings[key]) {
            groupedBookings[key] = {
              ...booking,
              bookingIds: [booking._id],
              totalAmount: parseFloat(booking.total_price?.$numberDecimal || booking.total_price || 0),
            };
          } else {
            groupedBookings[key].bookingIds.push(booking._id);
            groupedBookings[key].totalAmount += parseFloat(booking.total_price?.$numberDecimal || booking.total_price || 0);
          }
        });
        
        // Convert back to array and sort by created date
        const mergedBookings = Object.values(groupedBookings).sort((a, b) => {
          const dateA = new Date(a.created_at?.utc || a.created_at || 0);
          const dateB = new Date(b.created_at?.utc || b.created_at || 0);
          return dateB - dateA;
        });
        
        setBookings(mergedBookings);
        
        // Extract unique rooms for filter (loại bỏ trùng lặp)
        const roomMap = new Map();
        mergedBookings.forEach(b => {
          const room = b.showtime_id?.room_id;
          if (room && room._id) {
            roomMap.set(room._id, room);
          }
        });
        setRooms(Array.from(roomMap.values()));
        
      } catch (err) {
        console.error("Fetch error:", err);
        if (!isMounted) return;
        
        toast({
          title: "Lỗi tải dữ liệu",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setBookings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchBookings();
    
    return () => {
      isMounted = false;
    };
  }, [toast]);

  const paymentMethodConfig = {
    "online": { label: "ONLINE", color: "blue" },
    "cash": { label: "CASH", color: "green" },
  };

  const paymentStatusConfig = {
    "success": { label: "SUCCESS", color: "green" },
    "pending": { label: "PENDING", color: "yellow" },
    "cancelled": { label: "CANCELLED", color: "red" },
  };

  const getPaymentMethodColor = (method) => {
    return paymentMethodConfig[method?.toLowerCase()]?.color || "gray";
  };

  const getPaymentMethodLabel = (method) => {
    if (!method) return "Chưa rõ";
    return paymentMethodConfig[method.toLowerCase()]?.label || method.toUpperCase();
  };

  const getPaymentStatusColor = (status) => {
    return paymentStatusConfig[status?.toLowerCase()]?.color || "gray";
  };

  const getPaymentStatusLabel = (status) => {
    if (!status) return "Chưa rõ";
    return paymentStatusConfig[status.toLowerCase()]?.label || status.toUpperCase();
  };

  const formatPrice = (price) => {
    if (!price) return "0 VNĐ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleViewDetails = (bookingIds) => {
    navigate(`/bookings/${bookingIds[0]}`, {
      state: { allBookingIds: bookingIds }
    });
  };

  // Filter bookings
  const filterBookings = (bookingList) => {
    let filtered = [...bookingList];

    // Search by username
    if (searchUser.trim()) {
      filtered = filtered.filter(b =>
        b.user_id?.username?.toLowerCase().includes(searchUser.toLowerCase()) ||
        b.user_id?.email?.toLowerCase().includes(searchUser.toLowerCase())
      );
    }

    // Filter by payment status
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(b => 
        b.payment_status?.toLowerCase() === paymentStatusFilter.toLowerCase()
      );
    }

    // Filter by room
    if (roomFilter !== "all") {
      filtered = filtered.filter(b => b.showtime_id?.room_id?._id === roomFilter);
    }

    return filtered;
  };

  // Separate successful and all bookings
  const successBookings = bookings.filter(b => b.payment_status?.toLowerCase() === "success");
  const filteredAllBookings = filterBookings(bookings);
  const filteredSuccessBookings = filterBookings(successBookings);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchUser, paymentStatusFilter, roomFilter]);

  // Render table
  const renderTable = (data) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

    if (data.length === 0) {
      return (
        <Text textAlign="center" color="gray.400" fontSize="lg" mt={10}>
          Không có dữ liệu đặt vé
        </Text>
      );
    }

    return (
      <>
        <Box overflowX="auto" bg="#1a1e29" borderRadius="2xl" p={6} boxShadow="0 0 15px rgba(255,140,0,0.1)">
          <Table variant="simple" colorScheme="whiteAlpha" size="sm">
            <Thead bg="#222633">
              <Tr>
                <Th color="orange.300">Mã đặt vé</Th>
                <Th color="orange.300">Người dùng</Th>
                <Th color="orange.300">Poster</Th>
                <Th color="orange.300">Tên phim</Th>
                <Th color="orange.300">Phòng</Th>
                <Th color="orange.300">Tổng tiền</Th>
                <Th color="orange.300">Phương thức</Th>
                <Th color="orange.300">Trạng thái</Th>
                <Th color="orange.300">Thao tác</Th>
              </Tr>
            </Thead>
            <Tbody>
              {paginatedData.map((booking, index) => {
                return (
                  <Tr key={index} _hover={{ bg: "#252a38" }} transition="0.2s">
                    <Td fontSize="sm">
                      <Text fontWeight="medium">{booking.order_code || booking._id || "N/A"}</Text>
                      {booking.bookingIds.length > 1 && (
                        <Badge ml={2} colorScheme="purple" fontSize="xs">
                          {booking.bookingIds.length} vé
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <Text fontWeight="bold" fontSize="sm">{booking.user_id?.username || "N/A"}</Text>
                      <Text fontSize="xs" color="gray.400">{booking.user_id?.email || ""}</Text>
                    </Td>
                    <Td>
                      {booking.showtime_id?.movie_id?.poster_url ? (
                        <Image
                          src={booking.showtime_id.movie_id.poster_url}
                          alt={booking.showtime_id.movie_id.title}
                          boxSize="60px"
                          borderRadius="md"
                          objectFit="cover"
                          fallbackSrc="https://via.placeholder.com/60"
                        />
                      ) : (
                        <Box boxSize="60px" bg="gray.700" borderRadius="md" />
                      )}
                    </Td>
                    <Td>
                      <Text fontWeight="bold" fontSize="sm">{booking.showtime_id?.movie_id?.title || "N/A"}</Text>
                      <Text fontSize="xs" color="gray.400">
                        {booking.showtime_id?.start_time?.vietnamFormatted || 
                         booking.showtime_id?.start_time || ""}
                      </Text>
                    </Td>
                    <Td fontSize="sm">{booking.showtime_id?.room_id?.name || "N/A"}</Td>
                    <Td fontWeight="bold" color="green.400" fontSize="sm">
                      {formatPrice(booking.totalAmount)}
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={getPaymentMethodColor(booking.payment_method)}
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {getPaymentMethodLabel(booking.payment_method)}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge 
                        colorScheme={getPaymentStatusColor(booking.payment_status)}
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {getPaymentStatusLabel(booking.payment_status)}
                      </Badge>
                    </Td>
                    <Td>
                      <IconButton
                        icon={<ViewIcon />}
                        colorScheme="blue"
                        size="sm"
                        aria-label="Xem chi tiết"
                        onClick={() => handleViewDetails(booking.bookingIds)}
                        _hover={{ transform: "scale(1.1)" }}
                        transition="0.2s"
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>

        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={6}>
            <Text color="gray.400" fontSize="sm">
              Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, data.length)} / {data.length}
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                isDisabled={currentPage === 1}
                bg="#23242a"
                color="white"
                _hover={{ bg: "#2d2e35" }}
              >
                Trước
              </Button>
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1;
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      bg={currentPage === page ? "orange.400" : "#23242a"}
                      color="white"
                      _hover={{
                        bg: currentPage === page ? "orange.500" : "#2d2e35",
                      }}
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <Text key={page} color="gray.400">...</Text>;
                }
                return null;
              })}
              <Button
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                isDisabled={currentPage === totalPages}
                bg="#23242a"
                color="white"
                _hover={{ bg: "#2d2e35" }}
              >
                Sau
              </Button>
            </HStack>
          </Flex>
        )}
      </>
    );
  };

  return (
    <Flex bg="#0f1117" minH="100vh" color="white">
      <Sidebar />
      <Box flex="1" p={6}>
        <Heading mb={6} color="orange.400">Quản lý đặt phim</Heading>

        {/* Filters */}
        <HStack spacing={4} mb={6}>
          <Input
            placeholder="Tìm theo tên người dùng hoặc email..."
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            maxW="300px"
            bg="gray.800"
            color="white"
            border="none"
            _focus={{ bg: "gray.700" }}
          />
          <Select
            value={paymentStatusFilter}
            onChange={(e) => setPaymentStatusFilter(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>
              Tất cả trạng thái
            </option>
            <option value="success" style={{ background: "#181a20", color: "#fff" }}>
              SUCCESS
            </option>
            <option value="paid" style={{ background: "#181a20", color: "#fff" }}>
              PAID
            </option>
            <option value="pending" style={{ background: "#181a20", color: "#fff" }}>
              PENDING
            </option>
            <option value="failed" style={{ background: "#181a20", color: "#fff" }}>
              FAILED
            </option>
          </Select>
          <Select
            value={roomFilter}
            onChange={(e) => setRoomFilter(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>
              Tất cả phòng
            </option>
            {rooms.map((room) => (
              <option
                key={room._id}
                value={room._id}
                style={{ background: "#181a20", color: "#fff" }}
              >
                {room.name}
              </option>
            ))}
          </Select>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="#ff8c00" />
          </Flex>
        ) : (
          <Tabs colorScheme="orange" variant="enclosed">
            <TabList>
              <Tab _selected={{ bg: "orange.400", color: "white" }}>
                Tất cả đặt vé ({filteredAllBookings.length})
              </Tab>
              <Tab _selected={{ bg: "green.500", color: "white" }}>
                Đã thanh toán ({filteredSuccessBookings.length})
              </Tab>
            </TabList>

            <TabPanels>
              <TabPanel px={0}>
                {renderTable(filteredAllBookings)}
              </TabPanel>
              <TabPanel px={0}>
                {renderTable(filteredSuccessBookings)}
              </TabPanel>
            </TabPanels>
          </Tabs>
        )}
      </Box>
    </Flex>
  );
};

export default BookingManagementPage;