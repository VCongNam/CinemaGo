import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function StaffPaymentFailedPage() {
  const navigate = useNavigate();

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
  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={8}>
      <VStack spacing={4}>
        <Heading color="red.300">Thanh toán thất bại (Staff)</Heading>
        <Text>Đơn hàng đã bị hủy hoặc thanh toán không thành công.</Text>
        <Button colorScheme="pink" onClick={() => window.location.replace(getStaffPage())}>
          Quay lại trang quầy
        </Button>
      </VStack>
    </Box>
  );
}


