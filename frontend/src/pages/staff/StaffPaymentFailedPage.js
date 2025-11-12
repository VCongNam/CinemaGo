import { Box, Button, Heading, Text, VStack } from "@chakra-ui/react";

export default function StaffPaymentFailedPage() {
  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={8}>
      <VStack spacing={4}>
        <Heading color="red.300">Thanh toán thất bại (Staff)</Heading>
        <Text>Đơn hàng đã bị hủy hoặc thanh toán không thành công.</Text>
        <Button colorScheme="pink" onClick={() => window.location.replace("/staff/l1")}>
          Quay lại trang quầy
        </Button>
      </VStack>
    </Box>
  );
}


