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
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { ViewIcon, DownloadIcon } from "@chakra-ui/icons";
import SidebarAdmin from "../Navbar/SidebarAdmin";
import SidebarStaff from "../Navbar/SidebarStaff";

const BookingManagementPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchUser, setSearchUser] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [rooms, setRooms] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const toast = useToast();
  const navigate = useNavigate();
  const [exporting, setExporting] = useState(false);
  

  // Lấy thông tin role từ localStorage
  let roleData = null;
  try {
    roleData = JSON.parse(localStorage.getItem("role"));
  } catch (e) {
    const directRole = localStorage.getItem("role") || localStorage.getItem("userRole");
    if (directRole) {
      roleData = { role: directRole };
    }
  }
  
  const role = roleData?.role || "";
  
  // Xác định role và quyền hạn - chỉ cho phép admin và lv2
  let isAdmin = false;
  let isStaff = false;
  
  if (role.toLowerCase() === "admin") {
    isAdmin = true;
  } else if (role.toLowerCase() === "lv2") {
    isStaff = true;
  } else {
    // Nếu không phải admin hoặc lv2, hiển thị thông báo
    toast({
      title: "Không có quyền truy cập",
      description: "Bạn không có quyền truy cập trang này",
      status: "error",
      duration: 3000,
      isClosable: true,
    });
  }

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

        const getBookingTimestamp = (b) => {
          if (!b) return 0;
          // common fields
          const cand = b.createdAt || b.created_at || b.createdAt?.$date || b.created_at?.$date || b.createdAt?.$numberLong || b.created_at?.$numberLong;
          if (cand) {
            // if it's an ISO string
            if (typeof cand === "string") {
              const p = Date.parse(cand);
              if (!Number.isNaN(p)) return p;
            }
            // if it's numeric string or number (milliseconds or seconds)
            const num = Number(cand);
            if (!Number.isNaN(num)) {
              // heuristics: 13 digits -> ms, 10 digits -> s
              const s = String(Math.abs(num));
              if (s.length === 13) return num;
              if (s.length === 10) return num * 1000;
              // otherwise try Date.parse fallback
              const p2 = Date.parse(String(cand));
              if (!Number.isNaN(p2)) return p2;
            }
          }
          // fallback: try Date.parse on top-level fields
          if (b.createdAt) {
            const p = Date.parse(String(b.createdAt));
            if (!Number.isNaN(p)) return p;
          }
          if (b.created_at) {
            const p = Date.parse(String(b.created_at));
            if (!Number.isNaN(p)) return p;
          }
          // final fallback: extract timestamp from Mongo ObjectId
          if (b._id) {
            try {
              const ts = parseInt(String(b._id).substring(0, 8), 16) * 1000;
              return ts;
            } catch (e) {
              return 0;
            }
          }
          return 0;
        };

        const sortedBookings = bookingsList.sort((a, b) => {
          return getBookingTimestamp(b) - getBookingTimestamp(a); // newest first
        });
        
        setBookings(sortedBookings);
        
        
        // Extract unique rooms for filter (loại bỏ trùng lặp)
        const roomMap = new Map();
        sortedBookings.forEach(b => {
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

  // 🔹 Hàm tính toán báo cáo doanh thu theo phim từ dữ liệu bookings có sẵn
  const calculateRevenueReport = (bookingList) => {
    const revenueMap = new Map();

    bookingList.forEach(booking => {
      // Chỉ tính các đơn đã xác nhận và thanh toán thành công
      const totalPrice = parseFloat(booking.total_price?.$numberDecimal || booking.total_price || 0);

      const bookingStatus = booking.status?.toLowerCase();
      const paymentStatus = booking.payment_status?.toLowerCase();

      // Chỉ tính các đơn có booking.status là "confirmed" và payment_status là "success"
      const isRevenueBooking = 
          bookingStatus === "confirmed" && 
          paymentStatus === "success";

      const movieTitle = booking.showtime_id?.movie_id?.title;
      const movieId = booking.showtime_id?.movie_id?._id;

      if (movieTitle && movieId && totalPrice > 0 && isRevenueBooking) {
        const currentData = revenueMap.get(movieId) || {
          movieTitle: movieTitle,
          totalRevenue: 0,
          totalTickets: 0,
        };
        
        currentData.totalRevenue += totalPrice;
        
        revenueMap.set(movieId, currentData);
      }
    });

    return Array.from(revenueMap.values());
  };

  // 🔹 Hàm chuyển dữ liệu báo cáo sang CSV và tải về
  const handleExportToCSV = (data) => {
    if (!data || data.length === 0) {
      toast({
        title: "Không có dữ liệu",
        description: "Không có dữ liệu đặt vé hợp lệ để xuất báo cáo.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Tiêu đề file CSV
    const headers = [
      "Tên Phim", 
      "Doanh Thu (VND)", 
    ].join(",");
    
    // Chuyển dữ liệu JSON thành các dòng CSV
    const csvContent = data.map(item => {
      const movieTitle = `"${String(item.movieTitle).replace(/"/g, '""')}"`; // Xử lý dấu ngoặc kép và đảm bảo là chuỗi
      const revenue = item.totalRevenue.toFixed(0); // Chỉ lấy số, không định dạng tiền tệ
      return [movieTitle, revenue].join(",");
    }).join("\n");

    // Thêm BOM (Byte Order Mark) để hiển thị tiếng Việt có dấu trong Excel
    const fullCsv = "\uFEFF" + headers + "\n" + csvContent; 

    const blob = new Blob([fullCsv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `BaoCaoDoanhThuPhim_${new Date().toLocaleDateString('en-CA')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Xuất file thành công!",
      description: "File CSV báo cáo doanh thu đã được tải về.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  // 🔹 Hàm xử lý chính: Tính toán và xuất file
  const handleGenerateAndExportReport = () => {
    setExporting(true);
    try {
      const reportData = calculateRevenueReport(bookings); 
      handleExportToCSV(reportData);
    } catch(e) {
      toast({
        title: "Lỗi tạo báo cáo",
        description: "Đã xảy ra lỗi trong quá trình xử lý dữ liệu: " + (e.message || "Lỗi không xác định"),
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setExporting(false);
    }
  };

// ... (phần còn lại của component)

  const paymentMethodConfig = {
    "online": { label: "ONLINE", color: "blue" },
    "cash": { label: "CASH", color: "green" },
  };

  const paymentStatusConfig = {
    "success": { label: "SUCCESS", color: "green" },
    "pending": { label: "PENDING", color: "yellow" },
    "cancelled": { label: "CANCELLED", color: "red" },
  };

  const bookingStatusConfig = {
    "confirmed": { label: "ĐÃ XÁC NHẬN", color: "green" },
    "cancelled": { label: "ĐÃ HỦY", color: "red" },
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

  const getBookingStatusColor = (status) => {
    return bookingStatusConfig[status?.toLowerCase()]?.color || "gray";
  };

  const getBookingStatusLabel = (status) => {
    if (!status) return "Chưa rõ";
    return bookingStatusConfig[status.toLowerCase()]?.label || status.toUpperCase();
  };

  const formatPrice = (price) => {
    if (!price) return "0 VNĐ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleViewDetails = (bookingId) => {
    navigate(`/bookings/${bookingId}`);
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

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(b => 
        b.status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Filter by room
    if (roomFilter !== "all") {
      filtered = filtered.filter(b => b.showtime_id?.room_id?._id === roomFilter);
    }

    return filtered;
  };

  // Filter bookings
  const filteredAllBookings = filterBookings(bookings);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchUser, statusFilter, roomFilter]);

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
                <Th color="orange.300">Mã đơn</Th>
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
              {paginatedData.map((booking) => {
                const totalPrice = parseFloat(booking.total_price?.$numberDecimal || booking.total_price || 0);
                
                return (
                  <Tr key={booking._id} _hover={{ bg: "#252a38" }} transition="0.2s">
                    <Td fontSize="sm">
                      <Text fontWeight="bold" color="orange.300">
                        {booking.order_code || booking._id || "N/A"}
                      </Text>
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
                      {formatPrice(totalPrice)}
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
                        colorScheme={getBookingStatusColor(booking.status)}
                        px={2}
                        py={1}
                        borderRadius="md"
                      >
                        {getBookingStatusLabel(booking.status)}
                      </Badge>
                    </Td>
                    <Td>
                      <IconButton
                        icon={<ViewIcon />}
                        colorScheme="blue"
                        size="sm"
                        aria-label="Xem chi tiết"
                        onClick={() => handleViewDetails(booking._id)}
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

  // Nếu không có quyền truy cập, không render gì cả
  if (!isAdmin && !isStaff) {
    return (
      <Flex minH="100vh" bg="#181a20" color="white" justify="center" align="center">
        <Box textAlign="center">
          <Heading size="lg" color="red.400" mb={4}>Không có quyền truy cập</Heading>
          <Text color="gray.400">Bạn không có quyền truy cập trang này</Text>
        </Box>
      </Flex>
    );
  }

  return (
    <Flex bg="#0f1117" minH="100vh" color="white">
      {isAdmin ? <SidebarAdmin /> : <SidebarStaff />}
      
      <Box flex="1" p={6}>
        <Heading mb={6} color="orange.400">Quản lý đặt phim</Heading>

        {/* Filters */}
        <HStack spacing={4} mb={6} flexWrap="wrap">
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>
              Tất cả trạng thái
            </option>
            <option value="confirmed" style={{ background: "#181a20", color: "#fff" }}>
              ĐÃ XÁC NHẬN
            </option>
            <option value="cancelled" style={{ background: "#181a20", color: "#fff" }}>
              ĐÃ HỦY
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
            {rooms
              .sort((a, b) => {
                const nameA = a.name || "";
                const nameB = b.name || "";
                // Extract number from room name (e.g., "Phòng 1" -> 1)
                const numA = parseInt(nameA.match(/\d+/)?.[0] || "0");
                const numB = parseInt(nameB.match(/\d+/)?.[0] || "0");
                return numA - numB;
              })
              .map((room) => (
                <option
                  key={room._id}
                  value={room._id}
                  style={{ background: "#181a20", color: "#fff" }}
                >
                  {room.name}
                </option>
              ))}
          </Select>
          <Button
            leftIcon={<DownloadIcon />}
            colorScheme="teal" // Dùng màu khác biệt để dễ nhận biết
            onClick={handleGenerateAndExportReport}
            isLoading={exporting}
            loadingText="Đang tính toán..."
            _hover={{ transform: "scale(1.05)" }}
            transition="0.2s"
            isDisabled={loading || bookings.length === 0}
          >
            Xuất báo cáo doanh thu phim
          </Button>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="#ff8c00" />
          </Flex>
        ) : (
          <>
            {filteredAllBookings.length === 0 ? (
              <Text textAlign="center" color="gray.400" fontSize="lg" mt={10}>
                Không có dữ liệu đặt vé
              </Text>
            ) : (
              renderTable(filteredAllBookings)
            )}
          </>
        )}
      </Box>
    </Flex>
  );
};

export default BookingManagementPage;