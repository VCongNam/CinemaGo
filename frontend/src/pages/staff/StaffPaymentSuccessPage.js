import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  Spinner,
  useToast,
  HStack,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function StaffPaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);
  const navigate = useNavigate();
  const toast = useToast();

  // 🔹 Get staff page based on role or sessionStorage/localStorage
  const getStaffPage = () => {
    // Ưu tiên lấy từ sessionStorage (được set khi tạo booking)
    let storedPage = sessionStorage.getItem("staffReturnPage");
    console.log("🔍 StaffPaymentSuccess - sessionStorage staffReturnPage:", storedPage);
    
    // Nếu không có trong sessionStorage, thử lấy từ localStorage (backup)
    if (!storedPage) {
      storedPage = localStorage.getItem("staffReturnPage");
      console.log("🔍 StaffPaymentSuccess - localStorage staffReturnPage:", storedPage);
    }
    
    if (storedPage) {
      // Không xóa ngay, chỉ xóa khi người dùng click button quay lại
      console.log("✅ StaffPaymentSuccess - Using stored page:", storedPage);
      return storedPage;
    }
    
    // Fallback: check role từ nhiều nguồn
    let role = "";
    
    // Thử lấy từ userRole
    role = (localStorage.getItem("userRole") || "").toLowerCase();
    
    // Nếu không có, thử lấy từ role object
    if (!role) {
      try {
        const roleData = JSON.parse(localStorage.getItem("role"));
        role = (roleData?.role || "").toLowerCase();
      } catch (e) {
        // Ignore
      }
    }
    
    // Nếu vẫn không có, thử lấy từ staff object
    if (!role) {
      try {
        const staffData = JSON.parse(localStorage.getItem("staff"));
        role = (staffData?.role || "").toLowerCase();
      } catch (e) {
        // Ignore
      }
    }
    
    const fallbackPage = role === "lv2" ? "/staff/l2" : "/staff/l1";
    console.log("⚠️ StaffPaymentSuccess - Using fallback page based on role:", role, "->", fallbackPage);
    return fallbackPage;
  };

  const handleReturnToStaff = () => {
    const page = getStaffPage();
    // Xóa cả sessionStorage và localStorage khi người dùng quyết định quay lại
    sessionStorage.removeItem("staffReturnPage");
    localStorage.removeItem("staffReturnPage");
    navigate(page);
  };

  useEffect(() => {
    const bookingId = searchParams.get("bookingId");
    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (!bookingId || !token) {
      toast({
        title: "Không hợp lệ",
        description: "Không tìm thấy thông tin đặt vé. Vui lòng đăng nhập lại.",
        status: "error",
      });
      navigate("/admin/login");
      return;
    }
    if (!bookingId || !token) {
      navigate("/admin/login");
      return;
    }
    const run = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/payments/booking/${bookingId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Không thể xác nhận thanh toán");
        const status = data?.data?.booking?.status;
        if (status === "confirmed") {
          setMessage("Thanh toán thành công. Đơn đã được xác nhận.");
          // lấy chi tiết booking để in vé
          const detailRes = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setBooking(detail.booking || null);
            setSeats(Array.isArray(detail.seats) ? detail.seats : []);
          }
        } else {
          setMessage("Đang xử lý thanh toán... Vui lòng kiểm tra lại danh sách đơn.");
        }
      } catch (e) {
        setMessage(e.message);
        toast({ title: "Lỗi", description: e.message, status: "error" });
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [navigate, searchParams, toast]);

  const handlePrintTicket = () => {
    if (!booking) {
      toast({ title: "Chưa có dữ liệu vé để in", status: "warning" });
      return;
    }
    const movieTitle = booking?.showtime_id?.movie_id?.title || "Phim";
    
    // Format showtime date safely (avoid Invalid Date)
    let showtimeFormatted = "N/A";
    const startTimeObj = booking?.showtime_id?.start_time;
    if (startTimeObj) {
      if (typeof startTimeObj === "object" && startTimeObj !== null) {
        // Nếu là object, ưu tiên vietnamFormatted, sau đó vietnam, cuối cùng utc
        showtimeFormatted = startTimeObj.vietnamFormatted || startTimeObj.vietnam || startTimeObj.utc || "";
      } else if (typeof startTimeObj === "string") {
        // Nếu là string, thử parse hoặc dùng trực tiếp
        try {
          const parsedDate = new Date(startTimeObj);
          if (!isNaN(parsedDate.getTime())) {
            showtimeFormatted = parsedDate.toLocaleString("vi-VN");
          } else {
            showtimeFormatted = startTimeObj;
          }
        } catch (e) {
          showtimeFormatted = startTimeObj;
        }
      }
    }
    
    // Fallback nếu vẫn không có giá trị hợp lệ
    if (!showtimeFormatted || showtimeFormatted === "N/A") {
      try {
        showtimeFormatted = new Date().toLocaleString("vi-VN");
      } catch (e) {
        showtimeFormatted = "Chưa cập nhật";
      }
    }
    
    const seatList = seats
      .map((s) => s?.seat_id?.seat_number || s?.seat_number)
      .filter(Boolean)
      .join(", ");
    const total =
      parseFloat(booking?.paid_amount?.$numberDecimal || booking?.paid_amount || booking?.total_price?.$numberDecimal || booking?.total_price || 0);

    const ticketWindow = window.open("", "_blank");
    ticketWindow.document.write(`
      <html>
        <head>
          <title>Vé xem phim</title>
          <style>
            body { font-family: Arial, sans-serif; background: #fff; padding: 20px; }
            .ticket {
              border: 2px dashed #333;
              border-radius: 10px;
              padding: 20px;
              width: 350px;
              margin: auto;
              text-align: center;
            }
            h2 { color: #333; margin-bottom: 10px; }
            p { margin: 6px 0; font-size: 14px; }
            .divider { border-top: 1px dashed #999; margin: 12px 0; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h2>🎬 Vé Xem Phim</h2>
            <p><strong>Phim:</strong> ${movieTitle}</p>
            <p><strong>Suất chiếu:</strong> ${showtimeFormatted}</p>
            <p><strong>Ghế:</strong> ${seatList || "?"}</p>
            <p><strong>Tổng tiền:</strong> ${Number(total).toLocaleString("vi-VN")}đ</p>
            <div class="divider"></div>
            <p>Cảm ơn quý khách đã mua vé!</p>
          </div>
          <script>
            window.print();
            window.onafterprint = () => window.close();
          </script>
        </body>
      </html>
    `);
    ticketWindow.document.close();
  };

  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={8}>
      <VStack spacing={6} maxW="600px" mx="auto">
        <Heading color="green.300" size="xl" textAlign="center">
          Thanh toán thành công!
        </Heading>
        {loading ? (
          <Spinner size="xl" color="green.300" />
        ) : (
          <Text fontSize="lg" textAlign="center" color="gray.300">
            {message}
          </Text>
        )}
        
        {booking && (
          <Box bg="#1a1e29" p={6} borderRadius="lg" w="full">
            <VStack spacing={3} align="stretch">
              <Text fontWeight="bold" color="orange.400" fontSize="md">
                Thông tin đặt vé
              </Text>
              <Text><strong>Phim:</strong> {booking?.showtime_id?.movie_id?.title || "N/A"}</Text>
              <Text><strong>Rạp:</strong> {booking?.showtime_id?.room_id?.theater_id?.name || "N/A"}</Text>
              <Text><strong>Phòng:</strong> {booking?.showtime_id?.room_id?.name || "N/A"}</Text>
              <Text><strong>Suất chiếu:</strong> {
                booking?.showtime_id?.start_time?.vietnamFormatted || 
                booking?.showtime_id?.start_time?.vietnam ||
                new Date(booking?.showtime_id?.start_time || new Date()).toLocaleString("vi-VN")
              }</Text>
              <Text><strong>Ghế:</strong> {
                seats.map((s) => s?.seat_id?.seat_number || s?.seat_number).filter(Boolean).join(", ") || "N/A"
              }</Text>
              <Text><strong>Tổng tiền:</strong> {
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(
                  parseFloat(
                    booking?.paid_amount?.$numberDecimal || 
                    booking?.paid_amount || 
                    booking?.total_price?.$numberDecimal || 
                    booking?.total_price || 
                    0
                  )
                )
              }</Text>
            </VStack>
          </Box>
        )}

        <HStack spacing={4} w="full" justify="center">
          <Button 
            onClick={handlePrintTicket} 
            colorScheme="orange" 
            size="lg"
            isDisabled={!booking}
            flex="1"
          >
            🖨️ In vé
          </Button>
          <Button 
            colorScheme="gray" 
            variant="outline" 
            onClick={handleReturnToStaff}
            size="lg"
            flex="1"
          >
            Quay lại trang quầy
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}


