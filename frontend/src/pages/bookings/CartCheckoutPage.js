import {
  Box,
  Button,
  Heading,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Text,
  VStack,
  Divider,
  Spinner,
  Flex,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import apiService from "../../services/apiService";

const CartCheckoutPage = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const [booking, setBooking] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setError("Không tìm thấy mã đặt vé.");
      setLoading(false);
      return;
    }

    apiService.getById("/api/bookings/", bookingId, (data, success) => {
      if (success) {
        setBooking(data.booking);
        setSeats(data.seats);
      } else {
        setError(data.message || "Không thể tải thông tin đặt vé.");
      }
      setLoading(false);
    });
  }, [bookingId]);

  const handleCheckout = async () => {
    setIsProcessingPayment(true);
    setError("");

    try {
      const paymentLinkRes = await new Promise((resolve) => {
        apiService.post("/api/payments/create-payment-link", { bookingId }, (data, success) => {
          resolve({ data, success });
        });
      });

      if (!paymentLinkRes.success) {
        throw new Error(paymentLinkRes.data?.message || "Tạo link thanh toán thất bại");
      }

      const paymentUrl = paymentLinkRes.data?.data?.checkoutUrl;
      if (!paymentUrl) {
        throw new Error("Không nhận được link thanh toán");
      }

      window.location.href = paymentUrl;
    } catch (err) {
      setError(err.message);
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setIsProcessingPayment(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    apiService.put(`/api/bookings/${bookingId}/cancel`, {}, (data, success) => {
      setIsCancelling(false);
      onClose();
      if (success) {
        toast({
          title: "Thành công",
          description: "Đã hủy đặt vé thành công.",
          status: "success",
          duration: 3000,
        });
        navigate("/");
      } else {
        toast({
          title: "Lỗi",
          description: data.message || "Không thể hủy đặt vé.",
          status: "error",
          duration: 5000,
        });
      }
    });
  };

  if (loading) {
    return (
      <Box bg="#0f1117" minH="100vh" display="flex" alignItems="center" justifyContent="center">
        <Spinner color="orange.400" size="xl" />
      </Box>
    );
  }

  if (error || !booking) {
    return (
      <Box p={6} textAlign="center" bg="#0f1117" color="white" minH="100vh">
        <Heading mb={4}>{error || "Không tìm thấy thông tin đặt vé."}</Heading>
        <Button colorScheme="pink" onClick={() => navigate("/")}>
          Quay về trang chủ
        </Button>
      </Box>
    );
  }

  const { showtime_id: showtime, total_price } = booking;

  return (
    <Box bg="#0f1117" minH="100vh" color="white" p={6}>
      <VStack spacing={6} align="stretch" maxW="600px" mx="auto">
        <Heading mb={4} textAlign="center">Xác nhận và thanh toán</Heading>
        
        <Box bg="#1a1b23" p={5} borderRadius="lg">
          <Heading size="md">{showtime.movie_id.title}</Heading>
          <Text color="gray.400">
            {new Date(showtime.start_time.vietnam).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })} - {new Date(showtime.start_time.vietnam).toLocaleDateString("vi-VN")} - {showtime.room_id.name}
          </Text>
        </Box>

        <TableContainer bg="#1a1b23" p={5} borderRadius="lg">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th color="gray.300">Ghế</Th>
              </Tr>
            </Thead>
            <Tbody>
              {seats.map(bookingSeat => (
                <Tr key={bookingSeat.seat_id._id}>
                  <Td>{bookingSeat.seat_id.seat_number}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>

        <Flex justify="space-between" align="center" bg="#1a1b23" p={5} borderRadius="lg">
          <Text fontSize="lg" fontWeight="bold">Tổng cộng</Text>
          <Text fontSize="2xl" fontWeight="bold" color="orange.300">{parseFloat(total_price.$numberDecimal).toLocaleString("vi-VN")}đ</Text>
        </Flex>

        {error && (
          <Text color="red.400" textAlign="center">{error}</Text>
        )}

        <VStack spacing={4} mt={4}>
          <Button 
            bg="#d53f8c" 
            color="white"
            size="lg"
            w="full"
            onClick={handleCheckout}
            isLoading={isProcessingPayment}
            _hover={{ bg: "#b83280" }}
            spinner={<Spinner size="md" />}
          >
            {isProcessingPayment ? "Đang xử lý..." : "Thanh toán với PayOS"}
          </Button>
          <Button 
            variant="outline"
            colorScheme="red"
            size="lg"
            w="full"
            onClick={onOpen}
            isLoading={isCancelling}
          >
            Hủy đặt vé
          </Button>
        </VStack>
      </VStack>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="#1a1b23" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xác nhận hủy
            </AlertDialogHeader>
            <AlertDialogBody>
              Bạn có chắc chắn muốn hủy đặt vé này không? Hành động này không thể hoàn tác.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} colorScheme="gray">
                Không
              </Button>
              <Button colorScheme="red" onClick={handleCancelBooking} ml={3} isLoading={isCancelling}>
                Hủy đặt vé
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default CartCheckoutPage;