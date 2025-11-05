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
import { Image, HStack, Stack, Divider, Badge } from "@chakra-ui/react";
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
        // Nếu vé đã được xử lý (không còn ở trạng thái pending), thông báo và điều hướng
        if (data.booking.status !== 'pending') {
          toast({
            title: "Giao dịch đã hoàn tất",
            description: `Vé này đã được ${data.booking.status === 'confirmed' ? 'xác nhận thanh toán' : 'hủy'}. Bạn sẽ được chuyển về trang lịch sử.`,
            status: "info",
            duration: 5000,
            isClosable: true,
          });
          setTimeout(() => navigate("/bookings/history"), 3000); // Điều hướng về lịch sử đặt vé
        } else {
          setBooking(data.booking);
          setSeats(data.seats);
        }
      } else {
        setError(data.message || "Không thể tải thông tin đặt vé.");
      }
      setLoading(false);
    });
  }, [bookingId, navigate, toast]);

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

      const paymentUrl = paymentLinkRes.data?.data?.paymentLink;
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
          isClosable: true,
        });
        navigate("/bookings/cancelled");
      } else {
        toast({
          title: "Lỗi",
          description: data.message || "Không thể hủy đặt vé.",
          status: "error",
          duration: 5000,
          isClosable: true,
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
        {booking && booking.showtime_id && (
          <VStack spacing={1} color="gray.200" bg="#1a1b23" p={4} borderRadius="lg" w="full">
            <Heading as="h3" size="md" color="#d53f8c">Thông tin đặt vé</Heading>
            <HStack align="start" spacing={4} w="full">
              {/* Poster phim */}
              {booking.showtime_id.movie_id?.poster_url && (
                <Image
                  src={booking.showtime_id.movie_id.poster_url}
                  alt={booking.showtime_id.movie_id?.title || 'Poster'}
                  boxSize={{ base: "90px", md: "120px" }}
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
              {/* Chi tiết phim và suất chiếu */}
              <VStack align="start" spacing={1} w="full">
                <Heading as="h4" size="sm" color="white">{booking.showtime_id.movie_id?.title}</Heading>
                {!!(booking.showtime_id.movie_id?.genre?.length) && (
                  <HStack spacing={2} flexWrap="wrap">
                    {booking.showtime_id.movie_id.genre.map((g, idx) => (
                      <Badge key={idx} colorScheme="pink" variant="subtle">{g}</Badge>
                    ))}
                  </HStack>
                )}
                {booking.showtime_id.movie_id?.duration && (
                  <Text fontSize="sm" color="gray.400">Thời lượng: {booking.showtime_id.movie_id.duration} phút</Text>
                )}
                {booking.showtime_id.movie_id?.description && (
                  <Text fontSize="sm" color="gray.400" noOfLines={3}>{booking.showtime_id.movie_id.description}</Text>
                )}
                <Divider borderColor="#2a2b33" my={2} />
                <Text><strong>Rạp:</strong> {booking.showtime_id.room_id?.theater_id?.name}</Text>
                <Text><strong>Phòng chiếu:</strong> {booking.showtime_id.room_id?.name}</Text>
                <Text>
                  <strong>Suất chiếu:</strong> {booking.showtime_id.start_time?.vietnamFormatted || new Date(booking.showtime_id.start_time?.vietnam || booking.showtime_id.start_time).toLocaleString('vi-VN')}
                </Text>
                {!!seats.length && (
                  <Text>
                    <strong>Ghế:</strong> {seats.map(s => s.seat_id?.seat_number || s.seat_number).join(', ')}
                  </Text>
                )}
              </VStack>
            </HStack>
          </VStack>
        )}
        
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