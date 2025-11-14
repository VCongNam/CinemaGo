import { useState, useRef } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  Divider,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import apiService from "../../services/apiService";

export default function StaffPaymentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const printRef = useRef(null);
  const { movie, showtime, selectedSeats, selectedFoods, total } =
    useLocation().state || {};
  if (!movie || !showtime || !selectedSeats) {
    return (
      <Box p={8}>
        <Text>Không tìm thấy dữ liệu thanh toán.</Text>
        <Button mt={4} onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Box>
    );
  }

  // ✅ Hàm in vé
  const handlePrintTicket = () => {
    // Format showtime date safely (avoid Invalid Date)
    let showtimeFormatted = "N/A";
    const startTimeObj = showtime?.start_time;
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
            <p><strong>Phim:</strong> ${movie.title}</p>
            <p><strong>Suất chiếu:</strong> ${showtimeFormatted}</p>
            <p><strong>Ghế:</strong> ${selectedSeats
              .map((s) => s.seat_number)
              .join(", ")}</p>
            <p><strong>Tổng tiền:</strong> ${total.toLocaleString("vi-VN")}đ</p>
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

  // 🔹 Get staff page based on role
  const getStaffPage = () => {
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    return role === "lv2" ? "/staff/l2" : "/staff/l1";
  };

  const returnUrl = `${window.location.origin}/staff/payos-return?status=success`;
  const cancelUrl = `${window.location.origin}/staff/payos-return?status=cancel`;

  // ✅ Xử lý thanh toán tiền mặt + in vé
  const handleCashPayment = () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    const isStaff = localStorage.getItem("isStaff") === "true";
    if (!token || !isStaff) {
      toast({
        title: "Unauthorized",
        description: "Staff access required",
        status: "error",
        duration: 2000,
      });
      navigate("/admin/login");
      return;
    }

    toast({
      title: "Đang xử lý thanh toán...",
      status: "info",
      duration: 2000,
    });

    // Align with backend API: showtime_id, seat_ids, payment_method
    fetch("http://localhost:5000/api/bookings/offline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        showtime_id: showtime._id || showtime.id,
        seat_ids: selectedSeats.map((s) => s._id || s.id),
        payment_method: "cash",
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Tạo đặt vé thất bại");
        }
        toast({
          title: "Thanh toán thành công",
          description: `Đã thanh toán ${total.toLocaleString("vi-VN")}đ bằng tiền mặt`,
          status: "success",
          duration: 2000,
        });
        setTimeout(() => {
          handlePrintTicket();
          navigate(getStaffPage());
        }, 1000);
      })
      .catch((err) => {
        console.error("Error creating offline cash booking:", err);
        toast({
          title: "Thanh toán thất bại",
          description: err.message || "Đã có lỗi xảy ra khi tạo booking.",
          status: "error",
          duration: 3000,
        });
      });
  };

  // ✅ Xử lý thanh toán PayOS
  const handlePayOSPayment = async () => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("accessToken");
    const isStaff = localStorage.getItem("isStaff") === "true";
    if (!token || !isStaff) {
      toast({
        title: "Unauthorized",
        description: "Staff access required",
        status: "error",
        duration: 2000,
      });
      navigate("/admin/login");
      return;
    }

    try {
      toast({
        title: "Đang tạo liên kết thanh toán...",
        status: "info",
        duration: 3000,
      });

      // Step 1: create booking with payment_method "online"
      const createRes = await fetch(
        "http://localhost:5000/api/bookings/offline",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            showtime_id: showtime._id || showtime.id,
            seat_ids: selectedSeats.map((s) => s._id || s.id),
            payment_method: "online",
          }),
        }
      );
      const createData = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createData?.message || "Tạo đặt vé thất bại");
      }
      const bookingId = createData?.booking?._id || createData?.booking?.id;
      if (!bookingId) throw new Error("Không lấy được bookingId từ server");

      // Store the original staff page for redirect after payment
      const staffPage = getStaffPage();
      sessionStorage.setItem("staffReturnPage", staffPage);

      // Step 2: ask backend for payment link
      const payRes = await fetch(
        "http://localhost:5000/api/payments/create-payment-link",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            bookingId,
            returnUrl: `${window.location.origin}/staff/payment-success?bookingId=${bookingId}`,
            cancelUrl: `${window.location.origin}/staff/payment-failed?bookingId=${bookingId}`,
          }),
        }
      );
      const payData = await payRes.json();
      if (!payRes.ok) {
        throw new Error(payData?.message || "Không thể tạo link thanh toán");
      }

      const paymentUrl =
        payData?.data?.paymentLink ||
        payData?.data?.paymentLinkUrl ||
        payData?.data?.checkoutUrl;
      if (!paymentUrl) throw new Error("Server không trả về payment URL");
      window.location.href = paymentUrl;
    } catch (error) {
      console.error("Error creating PayOS payment link:", error);
      toast({
        title: "Lỗi hệ thống",
        description: error.message || "Không thể tạo liên kết thanh toán.",
        status: "error",
        duration: 3000,
      });
    }
  };

  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={6}>
      <Heading mb={6} textAlign="center">
        Chọn phương thức thanh toán
      </Heading>

      <Flex justify="center" align="center" gap={8} wrap="wrap">
        <Box
          bg="#1a1b23"
          borderRadius="lg"
          p={8}
          minW="250px"
          textAlign="center"
          cursor="pointer"
          _hover={{ bg: "#23242a" }}
          onClick={handleCashPayment}
        >
          <Heading size="md" mb={2}>
            💵 Tiền mặt
          </Heading>
          <Text>Thanh toán trực tiếp tại quầy</Text>
        </Box>

        <Box
          bg="#1a1b23"
          borderRadius="lg"
          p={8}
          minW="250px"
          textAlign="center"
          cursor="pointer"
          _hover={{ bg: "#23242a" }}
          onClick={handlePayOSPayment}
        >
          <Heading size="md" mb={2}>
            💳 PayOS
          </Heading>
          <Text>Thanh toán qua PayOS (QR Code, Ngân hàng...)</Text>
        </Box>
      </Flex>

      <Divider my={8} borderColor="#23242a" />

      <Button colorScheme="pink" onClick={() => navigate(-1)}>
        Quay lại
      </Button>
    </Box>
  );
}
