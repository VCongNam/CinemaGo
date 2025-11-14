import { useEffect, useState } from "react";
import { Box, Button, Heading, Text, VStack, Spinner, useToast } from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function StaffPaymentFailedPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Đang kiểm tra trạng thái thanh toán...");

  // 🔹 Get staff page based on role or sessionStorage/localStorage
  const getStaffPage = () => {
    // Ưu tiên lấy từ sessionStorage (được set khi tạo booking)
    let storedPage = sessionStorage.getItem("staffReturnPage");
    console.log("🔍 sessionStorage staffReturnPage:", storedPage);
    // Nếu không có trong sessionStorage, thử lấy từ localStorage (backup)
    if (!storedPage) {
      storedPage = localStorage.getItem("staffReturnPage");
      console.log("🔍 localStorage staffReturnPage:", storedPage);
    }
    if (storedPage) {
      // Không xóa ngay, chỉ xóa khi người dùng click button quay lại
      console.log("✅ Using stored page:", storedPage);
      return storedPage;
    }
    // Fallback: check role từ localStorage
    const role = (localStorage.getItem("userRole") || "").toLowerCase();
    const fallbackPage = role === "lv2" ? "/staff/l2" : "/staff/l1";
    console.log("⚠️ Using fallback page based on role:", role, "->", fallbackPage);
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

    const reconcilePayment = async () => {
      try {
        // Đợi một chút để PayOS có thời gian cập nhật status (nếu webhook chưa kịp)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
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
          // Nếu vẫn còn pending, thử reconcile lại một lần nữa sau 2 giây
          setMessage("Đang kiểm tra lại trạng thái thanh toán...");
          setTimeout(async () => {
            try {
              const retryRes = await fetch(`http://localhost:5000/api/payments/booking/${bookingId}/status`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              const retryData = await retryRes.json();
              if (retryRes.ok) {
                const retryBookingStatus = retryData?.data?.booking?.status;
                const retryPaymentStatus = retryData?.data?.booking?.payment_status;
                
                if (retryBookingStatus === "cancelled" || retryPaymentStatus === "failed") {
                  setMessage("Thanh toán thất bại. Đơn đã được hủy và ghế đã được giải phóng.");
                } else if (retryBookingStatus === "confirmed") {
                  setMessage("Thanh toán đã được PayOS xác nhận thành công. Vui lòng quay lại danh sách để kiểm tra.");
                } else {
                  setMessage("Đơn đang ở trạng thái chờ xử lý. Vui lòng kiểm tra lại sau.");
                }
              }
            } catch (retryError) {
              console.error("Retry reconciliation error:", retryError);
            }
          }, 2000);
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
        <Button colorScheme="pink" onClick={handleReturnToStaff}>
          Quay lại trang quầy
        </Button>
      </VStack>
    </Box>
  );
}


