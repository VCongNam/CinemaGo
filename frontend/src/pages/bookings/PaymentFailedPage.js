import { Box, Heading, Text, Button, VStack, Icon } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { WarningTwoIcon } from '@chakra-ui/icons';

const PaymentFailedPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const bookingId = params.get("bookingId");

  return (
    <Box 
      textAlign="center" 
      py={20} 
      px={6}
      bg="#0f1117" 
      minH="100vh" 
      color="white"
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <VStack spacing={6} maxW="lg">
        <Icon as={WarningTwoIcon} w={20} h={20} color="red.400" />
        <Heading as="h1" size="2xl">Thanh toán thất bại</Heading>
        <Text fontSize="lg" color="gray.300">
          Rất tiếc, đã có lỗi xảy ra trong quá trình thanh toán hoặc giao dịch đã bị hủy.
          Vui lòng thử lại sau.
        </Text>
        {bookingId && (
          <Text color="gray.400">Mã đặt vé của bạn là: {bookingId}</Text>
        )}
        <VStack spacing={4} direction="column" mt={8}>
          <Button 
            bg="#d53f8c" 
            color="white"
            _hover={{ bg: "#b83280" }}
            onClick={() => navigate(`/bookings/checkout/${bookingId}`)} // Allow retry
            isDisabled={!bookingId}
            size="lg"
          >
            Thử lại thanh toán
          </Button>
          <Button 
            variant="outline"
            colorScheme="gray"
            onClick={() => navigate("/")}
            size="lg"
          >
            Quay về trang chủ
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
};

export default PaymentFailedPage;