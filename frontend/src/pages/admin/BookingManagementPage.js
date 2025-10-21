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
} from "@chakra-ui/react";
import Sidebar from "../Navbar/Sidebar";


const BookingManagementPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/bookings", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải dữ liệu đặt vé");
        return res.json();
      })
      .then((data) => {
        // Xử lý cấu trúc dữ liệu: có thể là single booking hoặc array
        let bookingsData;
        
        if (data.booking) {
          // Single booking object
          bookingsData = [data];
        } else if (data.data) {
          bookingsData = data.data;
        } else if (Array.isArray(data)) {
          bookingsData = data;
        } else {
          bookingsData = [];
        }
        
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      })
      .catch((err) => {
        toast({
          title: "Lỗi tải dữ liệu",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [toast]);

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "green";
      case "pending":
        return "yellow";
      case "canceled":
        return "red";
      default:
        return "gray";
    }
  };

  const getBookingStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green";
      case "locked":
        return "red";
      case "suspended":
        return "orange";
      case "pending":
        return "yellow";
      default:
        return "gray";
    }
  };

  const formatPrice = (price) => {
    if (!price) return "0 VNĐ";
    const value = price.$numberDecimal || price;
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };
  const adminLinks = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
    { to: "/admin/customers", label: "Thông tin khách hàng" },
    { to: "/admin/staffs", label: "Thông tin nhân viên" },
    { to: "/moviesmanagement", label: "Quản lý phim" },
    { to: "/admin/bookings", label: "Quản lý đặt phim" },
    { to: "/admin/reports", label: "Báo cáo khác" },
  ]

  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={8}>
      <Sidebar links={adminLinks} />
      <Heading mb={6}>Quản lý đặt vé</Heading>
      {loading ? (
        <Flex justify="center" align="center" h="50vh">
          <Spinner size="xl" color="#ff8c00" />
        </Flex>
      ) : bookings.length === 0 ? (
        <Text textAlign="center" color="gray.400">
          Không có dữ liệu đặt vé
        </Text>
      ) : (
        <Box overflowX="auto" bg="#1a1e29" borderRadius="2xl" p={6}>
          <Table variant="simple" colorScheme="whiteAlpha">
            <Thead bg="#222633">
              <Tr>
                <Th color="white">Mã đặt vé</Th>
                <Th color="white">Người dùng</Th>
                <Th color="white">Poster</Th>
                <Th color="white">Tên phim</Th>
                <Th color="white">Phòng</Th>
                <Th color="white">Rạp</Th>
                <Th color="white">Ghế</Th>
                <Th color="white">Tổng tiền</Th>
                <Th color="white">Thanh toán</Th>
                <Th color="white">Trạng thái</Th>
              </Tr>
            </Thead>
            <Tbody>
              {bookings.map((item) => {
                const b = item.booking;
                const seats = item.seats || [];
                
                return (
                  <Tr key={b._id} _hover={{ bg: "#252a38" }}>
                    <Td fontSize="sm">{b.order_code || b._id}</Td>
                    <Td>
                      <Text fontWeight="bold">{b.user_id?.username || "N/A"}</Text>
                      <Text fontSize="xs" color="gray.400">{b.user_id?.email || ""}</Text>
                    </Td>
                    <Td>
                      <Image
                        src={b.showtime_id?.movie_id?.poster_url}
                        alt={b.showtime_id?.movie_id?.title}
                        boxSize="60px"
                        borderRadius="md"
                        objectFit="cover"
                        fallbackSrc="https://via.placeholder.com/60"
                      />
                    </Td>
                    <Td>
                      <Text fontWeight="bold">{b.showtime_id?.movie_id?.title || "N/A"}</Text>
                      <Text fontSize="xs" color="gray.400">
                        {b.showtime_id?.start_time?.vietnamFormatted || ""}
                      </Text>
                    </Td>
                    <Td>{b.showtime_id?.room_id?.name || "N/A"}</Td>
                    <Td>{b.showtime_id?.room_id?.theater_id?.name || "N/A"}</Td>
                    <Td>
                      {seats.length > 0 ? (
                        <Flex gap={1} flexWrap="wrap">
                          {seats.map((seat, idx) => (
                            <Badge key={idx} colorScheme="blue" fontSize="xs">
                              {seat.seat_id?.seat_number || "N/A"}
                            </Badge>
                          ))}
                        </Flex>
                      ) : (
                        "N/A"
                      )}
                    </Td>
                    <Td fontWeight="bold">{formatPrice(b.total_price)}</Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(b.payment_status)}>
                        {b.payment_status || "Chưa rõ"}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge colorScheme={getBookingStatusColor(b.status)}>
                        {b.status || "Không xác định"}
                      </Badge>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default BookingManagementPage;