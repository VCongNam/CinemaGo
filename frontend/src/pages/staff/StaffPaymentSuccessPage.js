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

  // 🔹 Get staff page based on role or sessionStorage
  const getStaffPage = () => {
    const storedPage = sessionStorage.getItem("staffReturnPage");
    if (storedPage) {
      sessionStorage.removeItem("staffReturnPage");
      return storedPage;
    }
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    return role === "lv2" ? "/staff/l2" : "/staff/l1";
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
    const startTime =
      booking?.showtime_id?.start_time?.vietnam ||
      booking?.showtime_id?.start_time ||
      new Date().toISOString();
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
            <p><strong>Suất chiếu:</strong> ${new Date(startTime).toLocaleString("vi-VN")}</p>
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
      <VStack spacing={4}>
        <Heading color="green.300">Thanh toán thành công (Staff)</Heading>
        {loading ? <Spinner /> : <Text>{message}</Text>}
        <HStack spacing={4}>
          <Button colorScheme="pink" onClick={() => window.location.replace(getStaffPage())}>
            Quay lại trang quầy
          </Button>
          <Button onClick={handlePrintTicket} colorScheme="orange" variant="outline" isDisabled={!booking}>
            In vé
          </Button>
        </HStack>
      </VStack>
    </Box>
  );
}


