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

export default function StaffPaymentPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const printRef = useRef(null);
  const { movie, showtime, selectedSeats, selectedFoods, total } =
    useLocation().state || {};
  const [paymentMethod, setPaymentMethod] = useState(null);

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

  const qrData = JSON.stringify({
    movie: movie.title,
    showtime: showtime.start_time,
    seats: selectedSeats.map((s) => s.seat_number),
    total,
  });

  // ✅ Hàm in vé
  const handlePrintTicket = () => {
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
            <p><strong>Suất chiếu:</strong> ${showtime.start_time}</p>
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

  // ✅ Xử lý thanh toán tiền mặt + in vé
  const handleCashPayment = () => {
    toast({
      title: "Thanh toán thành công",
      description: `Đã thanh toán ${total.toLocaleString(
        "vi-VN"
      )}đ bằng tiền mặt`,
      status: "success",
      duration: 2000,
    });
    setTimeout(() => {
      handlePrintTicket();
      navigate("/staff/l1");
    }, 1000);
  };

  // ✅ Xử lý thanh toán QR + in vé
  const handleQrPayment = () => {
    toast({
      title: "Đang xử lý thanh toán...",
      status: "info",
      duration: 2000,
    });
    setTimeout(() => {
      toast({
        title: "Thanh toán thành công",
        description: `Đã thanh toán ${total.toLocaleString("vi-VN")}đ qua QR`,
        status: "success",
        duration: 2000,
      });
      setTimeout(() => {
        handlePrintTicket();
        navigate("/staff/l1");
      }, 1000);
    }, 2500);
  };

  // ✅ Màn hình chọn phương thức
  if (!paymentMethod) {
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
            onClick={() => setPaymentMethod("cash")}
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
            onClick={() => setPaymentMethod("qr")}
          >
            <Heading size="md" mb={2}>
              📱 QR Code
            </Heading>
            <Text>Thanh toán bằng mã QR</Text>
          </Box>
        </Flex>

        <Divider my={8} borderColor="#23242a" />

        <Button colorScheme="pink" onClick={() => navigate(-1)}>
          Quay lại
        </Button>
      </Box>
    );
  }

  // ✅ Giao diện thanh toán tiền mặt
  if (paymentMethod === "cash") {
    return (
      <Box bg="#0f1117" minH="100vh" color="white" p={6}>
        <Heading mb={6} textAlign="center">
          Thanh toán bằng tiền mặt
        </Heading>

        <VStack spacing={6} align="center">
          <Box
            borderRadius="lg"
            overflow="hidden"
            boxShadow="0 0 20px rgba(255, 255, 255, 0.1)"
          >
            <img
              src="/mnt/data/beb1e4ca-49ec-4ce1-8857-39635a94f3d9.png"
              alt="Vé xem phim"
              style={{
                width: "280px",
                borderRadius: "12px",
                objectFit: "cover",
              }}
            />
          </Box>

          <Text fontSize="lg" fontWeight="bold">
            Tổng cộng: {total.toLocaleString("vi-VN")}đ
          </Text>

          <Button
            bgGradient="linear(to-r, teal.400, green.400)"
            _hover={{ bgGradient: "linear(to-r, teal.500, green.500)" }}
            color="white"
            px={8}
            py={6}
            fontWeight="bold"
            borderRadius="full"
            onClick={handleCashPayment}
          >
            Xác nhận thanh toán & In vé
          </Button>

          <Button
            variant="outline"
            colorScheme="gray"
            borderColor="gray.500"
            color="gray.300"
            _hover={{ bg: "gray.700" }}
            onClick={() => setPaymentMethod(null)}
          >
            Quay lại chọn phương thức
          </Button>
        </VStack>
      </Box>
    );
  }

  // ✅ Giao diện thanh toán QR
  if (paymentMethod === "qr") {
    return (
      <Box bg="#0f1117" minH="100vh" color="white" p={6}>
        <Heading mb={6} textAlign="center">
          Thanh toán bằng QR Code
        </Heading>

        <VStack spacing={6} align="center">
          <Box
            borderRadius="lg"
            overflow="hidden"
            boxShadow="0 0 20px rgba(255, 255, 255, 0.1)"
          >
            <img
              src="/mnt/data/beb1e4ca-49ec-4ce1-8857-39635a94f3d9.png"
              alt="Vé xem phim"
              style={{
                width: "280px",
                borderRadius: "12px",
                objectFit: "cover",
              }}
            />
          </Box>

          <Box bg="white" p={4} borderRadius="lg" display="inline-block">
            <QRCodeCanvas value={qrData} size={220} />
          </Box>

          <Text mt={2} fontSize="sm" color="gray.300">
            Quét mã QR để thanh toán
          </Text>

          <Button
            bgGradient="linear(to-r, pink.400, purple.400)"
            _hover={{ bgGradient: "linear(to-r, pink.500, purple.500)" }}
            color="white"
            px={8}
            py={6}
            fontWeight="bold"
            borderRadius="full"
            onClick={handleQrPayment}
          >
            Xác nhận & In vé
          </Button>

          <Button
            variant="outline"
            colorScheme="gray"
            borderColor="gray.500"
            color="gray.300"
            _hover={{ bg: "gray.700" }}
            onClick={() => setPaymentMethod(null)}
          >
            Quay lại chọn phương thức
          </Button>
        </VStack>
      </Box>
    );
  }

  return null;
}
