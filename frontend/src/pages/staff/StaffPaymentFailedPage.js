import { useEffect, useState } from "react";
import { Box, Button, Heading, Text, VStack, Spinner, useToast } from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function StaffPaymentFailedPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Đang kiểm tra trạng thái thanh toán...");

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

    const reconcilePayment = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/payments/booking/${bookingId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data?.message || "Không thể kiểm tra trạng thái thanh toán.");
        }

        const bookingStatus = data?.data?.booking?.status;
        const paymentStatus = data?.data?.booking?.payment_status;

        if (bookingStatus === "cancelled" || paymentStatus === "failed") {
          setMessage("Thanh toán thất bại. Đơn đã được hủy và ghế đã được giải phóng.");
        } else if (bookingStatus === "confirmed") {
          setMessage("Thanh toán đã được PayOS xác nhận thành công. Vui lòng quay lại danh sách để kiểm tra.");
        } else {
          setMessage("Đơn đang ở trạng thái chờ xử lý. Vui lòng kiểm tra lại sau.");
        }
      } catch (error) {
        console.error("Fail page reconciliation error:", error);
        setMessage(error.message || "Đã xảy ra lỗi trong quá trình kiểm tra thanh toán.");
        toast({
          title: "Lỗi",
          description: error.message || "Đã xảy ra lỗi trong quá trình kiểm tra thanh toán.",
          status: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    reconcilePayment();
  }, [navigate, searchParams, toast]);

  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={8}>
      <VStack spacing={4}>
        <Heading color="red.300">Thanh toán thất bại (Staff)</Heading>
        {loading ? <Spinner /> : <Text textAlign="center">{message}</Text>}
        <Button colorScheme="pink" onClick={() => window.location.replace(getStaffPage())}>
          Quay lại trang quầy
        </Button>
      </VStack>
    </Box>
  );
}


