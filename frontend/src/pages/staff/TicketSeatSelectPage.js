import { useEffect, useState } from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  Button,
  HStack,
  VStack,
  SimpleGrid,
  Divider,
  Badge,
  Spinner,
  useToast,
  IconButton,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeftIcon, CloseIcon } from "@chakra-ui/icons";
import FoodSelection from "./FoodSelection";

const seatTypes = {
  booked: { color: "#1f2937", label: "Đã đặt" },
  selected: { color: "#ff66ff", label: "Ghế bạn chọn" },
  normal: { color: "#7c3aed", label: "Ghế thường" },
  vip: { color: "#ef4444", label: "Ghế VIP" },
};

export default function MovieSeatBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const { movie, time, showtime } = location.state || {};
  const [room, setRoom] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);

  // 🔹 Fetch seats from API
  useEffect(() => {
    // room_id may be populated as an object or may be just the id string depending on what StaffL1Page passed.
    const roomId = showtime?.room_id?._id || showtime?.room_id || null;
    if (!roomId) return;

    setLoading(true);

    // Load booked seats for this showtime
    fetch(`http://localhost:5000/api/showtimes/${showtime._id || showtime.id}/booked-seats`)
      .then((res) => res.json())
      .then((data) => {
        const ids = (data?.booked_seats || []).map((id) => String(id));
        setBookedSeatIds(ids);
      })
      .catch((err) => console.error("Failed to load booked seats:", err));

    // Load seats for the room
    fetch(`http://localhost:5000/api/public/rooms/${roomId}/seats`)
      .then((res) => {
        if (!res.ok) throw new Error("Không thể tải danh sách ghế");
        return res.json();
      })
      .then((data) => {
        console.log("📦 Dữ liệu seats API:", data);
        const seatData = data.list || data.seats || data || [];
        if (!Array.isArray(seatData)) {
          throw new Error("Dữ liệu ghế không hợp lệ");
        }
        // normalize id field
        const seatsWithId = seatData.map((s) => ({ ...s, id: s._id || s.id }));
        setSeats(seatsWithId);
        setRoom(showtime.room_id);
      })
      .catch((err) => {
        console.error("❌ Lỗi load seats:", err);
        toast({
          title: "Lỗi tải ghế",
          description: err.message,
          status: "error",
          duration: 3000,
        });
      })
      .finally(() => setLoading(false));
  }, [showtime, toast]);

  // 🔹 Handle seat selection
  const handleSelect = (seat) => {
    // ✅ Kiểm tra ghế đã được đặt chưa
    const seatIdStr = String(seat.id || seat._id);
    if (seat.is_booked || seat.isBooked || bookedSeatIds.includes(seatIdStr)) return;

    setSelectedSeats((prev) => {
      // So sánh bằng id hoặc _id tùy API
      const seatId = seat.id || seat._id;
      const exists = prev.some((s) => (s.id || s._id) === seatId);

      if (exists) {
        return prev.filter((s) => (s.id || s._id) !== seatId);
      } else {
        return [...prev, seat];
      }
    });
  };

  // 🔹 Remove a selected seat
  const removeSeat = (seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => (s.id || s._id) !== seatId));
  };

  // 🔹 Group seats by row
  const seatGrid = [];
  const seatsByRow = {};
  
  // Debug: Log ra một ghế mẫu để xem cấu trúc
  if (seats.length > 0) {
    console.log("🪑 Mẫu ghế đầu tiên:", seats[0]);
    console.log("🎯 Selected seats:", selectedSeats);
  }
  
  seats.forEach((seat) => {
    const row = seat.seat_number[0];
    if (!seatsByRow[row]) seatsByRow[row] = [];
    seatsByRow[row].push(seat);
  });
  Object.keys(seatsByRow)
    .sort()
    .forEach((row) => {
      seatGrid.push({
        row,
        seats: seatsByRow[row].sort((a, b) => {
          const numA = parseInt(a.seat_number.slice(1));
          const numB = parseInt(b.seat_number.slice(1));
          return numA - numB;
        }),
      });
    });

  // 🔹 Compute totals
  const seatTotal = selectedSeats.reduce((sum, s) => {
    // Prefer showtime price when available
    let price = showtime?.price || 50000;
    if (s.type === "vip") price = Math.round(price * 1.5);
    if (s.type === "couple") price = Math.round(price * 3); // example multiplier
    return sum + price;
  }, 0);

  const foodTotal = selectedFoods.reduce(
    (sum, f) => sum + f.price * f.quantity,
    0
  );

  const total = seatTotal + foodTotal;

  // 🔹 Print ticket helper
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
            <p><strong>Phim:</strong> ${movie?.title}</p>
            <p><strong>Suất chiếu:</strong> ${new Date(showtime?.start_time).toLocaleString("vi-VN")}</p>
            <p><strong>Ghế:</strong> ${selectedSeats.map((s) => s.seat_number).join(", ")}</p>
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
    // Sau khi mở cửa sổ in, chuyển về trang staff để tiếp tục công việc
    navigate('/staff/l1');
  };

  // 🔹 Format showtime date safely (avoid Invalid Date)
  const startTimeSource =
    typeof showtime?.start_time === "object" && showtime?.start_time !== null
      ? showtime.start_time.vietnam || showtime.start_time.utc || ""
      : showtime?.start_time;
  const showtimeDateText = startTimeSource
    ? new Date(startTimeSource).toLocaleDateString("vi-VN")
    : "";

  // 🔹 Handle cash payment
  const handleCashPayment = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Chưa chọn ghế",
        description: "Vui lòng chọn ít nhất 1 ghế để tiếp tục.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const isStaff = localStorage.getItem("isStaff") === "true";
    
    if (!token || !isStaff) {
      toast({ title: "Unauthorized", description: "Staff access required", status: "error", duration: 2000 });
      navigate("/admin/login");
      return;
    }

    // Create offline booking with cash payment
    fetch("http://localhost:5000/api/bookings/offline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        showtime_id: showtime._id || showtime.id,
        seat_ids: selectedSeats.map((s) => s.id || s._id),
        payment_method: "cash",
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Tạo đặt vé thất bại");
        
        toast({ title: "Thanh toán thành công", status: "success", duration: 1500 });
        setTimeout(() => {
          handlePrintTicket();
          navigate("/staff/l1");
        }, 1000);
      })
      .catch((err) => {
        console.error("Offline booking error:", err);
        toast({ title: "Lỗi đặt vé", description: err.message, status: "error", duration: 4000 });
      });
  };

  // 🔹 Handle online payment
  const handleOnlinePayment = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Chưa chọn ghế",
        description: "Vui lòng chọn ít nhất 1 ghế để tiếp tục.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
    const isStaff = localStorage.getItem("isStaff") === "true";
    
    if (!token || !isStaff) {
      toast({ title: "Unauthorized", description: "Staff access required", status: "error", duration: 2000 });
      navigate("/admin/login");
      return;
    }

    // Create booking with online payment
    fetch("http://localhost:5000/api/bookings/offline", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        showtime_id: showtime._id || showtime.id,
        seat_ids: selectedSeats.map((s) => s.id || s._id),
        payment_method: "online",
      }),
    })
      .then(async (res) => {
        const createBookingData = await res.json();
        if (!res.ok) throw new Error(createBookingData?.message || "Tạo đặt vé thất bại");

        const bookingId = createBookingData.booking?._id || createBookingData.booking?.id;
        if (!bookingId) throw new Error('Không lấy được bookingId từ server');

        // Request backend to create a PayOS payment link for this booking
        const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
        const returnUrl = `${window.location.origin}/staff/payment-success?bookingId=${bookingId}`;
        const cancelUrl = `${window.location.origin}/staff/payment-failed?bookingId=${bookingId}`;

        return fetch("http://localhost:5000/api/payments/create-payment-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ bookingId, returnUrl, cancelUrl }),
        });
      })
      .then(async (res) => {
        // The backend should return JSON; if it returns HTML (e.g. 404 page), parsing will fail and be caught below
        const payResp = await res.json();
        if (!res.ok) throw new Error(payResp?.message || "Không thể tạo link thanh toán");

        // backend returns data.paymentLink (checkoutUrl)
        const paymentUrl = payResp?.data?.paymentLink || payResp?.data?.paymentLinkUrl || payResp?.data?.checkoutUrl;
        if (!paymentUrl) throw new Error('Server không trả về payment URL');

        // Redirect to PayOS payment page
        window.location.href = paymentUrl;
      })
      .catch((err) => {
        console.error("Booking/Payment creation error:", err);
        toast({ 
          title: "Lỗi tạo đơn hàng", 
          description: err.message, 
          status: "error", 
          duration: 4000 
        });
      });
  };

  if (!movie || !showtime)
    return (
      <Box p={8}>
        <Text>Không tìm thấy thông tin suất chiếu.</Text>
      </Box>
    );

  return (
    <Box bg="#0f1117" minH="100vh" color="white">
      {/* HEADER */}
      <Flex bg="#d53f8c" p={4} align="center" position="relative">
        <IconButton
          icon={<ChevronLeftIcon boxSize={6} />}
          variant="ghost"
          colorScheme="whiteAlpha"
          aria-label="Back"
          onClick={() => navigate(-1)}
          _hover={{ bg: "whiteAlpha.200" }}
        />
        <Heading
          size="md"
          position="absolute"
          left="50%"
          transform="translateX(-50%)"
        >
          Mua vé xem phim
        </Heading>
      </Flex>

      <Box p={6}>
        {/* SCREEN LABEL */}
        <Box
          mx="auto"
          maxW="800px"
          textAlign="center"
          borderBottom="3px solid #d53f8c"
          pb={1}
          mb={6}
        >
          <Text fontSize="sm" color="gray.300" fontWeight="semibold">
            MÀN HÌNH
          </Text>
        </Box>

        {/* SEAT GRID */}
        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner color="orange.400" />
          </Flex>
        ) : (
          <Box mx="auto" maxW="900px" textAlign="center">
            <VStack spacing={2}>
              {seatGrid.map(({ row, seats }) => (
                <HStack key={row} justify="center" spacing={2}>
                  {/* ✅ Hiển thị tên hàng (A, B, C...) */}
                  <Text
                    fontSize="sm"
                    fontWeight="bold"
                    color="gray.400"
                    w="30px"
                    textAlign="right"
                  >
                    {row}
                  </Text>

                  {seats.map((seat) => {
                    // ✅ Kiểm tra trạng thái ghế - hỗ trợ cả id và _id
                    const seatId = seat.id || seat._id;
                    const isSelected = selectedSeats.some((s) => (s.id || s._id) === seatId);
                    const isBooked =
                      seat.is_booked === true ||
                      seat.isBooked === true ||
                      bookedSeatIds.includes(String(seatId));

                    let color;
                    let hoverColor;

                    // Ưu tiên: booked > selected > vip > normal
                    if (isBooked) {
                      color = seatTypes.booked.color;
                      hoverColor = seatTypes.booked.color;
                    } else if (isSelected) {
                      color = seatTypes.selected.color;
                      hoverColor = seatTypes.selected.color;
                    } else if (seat.type === "vip" || seat.type === "VIP") {
                      color = seatTypes.vip.color;
                      hoverColor = "#f87171";
                    } else {
                      color = seatTypes.normal.color;
                      hoverColor = "#8b5cf6";
                    }

                    return (
                      <Button
                        key={seatId}
                        size="sm"
                        w="36px"
                        h="36px"
                        p={0}
                        fontSize="xs"
                        fontWeight="bold"
                        bg={color}
                        color="white"
                        border="none"
                        borderRadius="md"
                        _hover={{
                          bg: isBooked ? color : hoverColor,
                        }}
                        onClick={() => !isBooked && handleSelect(seat)}
                        cursor={isBooked ? "not-allowed" : "pointer"}
                        isDisabled={isBooked}
                        opacity={isBooked ? 0.5 : 1}
                      >
                        {seat.seat_number ? seat.seat_number.slice(1) : "?"}
                      </Button>
                    );
                  })}
                </HStack>
              ))}
            </VStack>
          </Box>
        )}

        {/* LEGEND */}
        <SimpleGrid columns={2} spacing={3} mt={6} mx="auto" maxW="500px">
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.booked.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">
              {seatTypes.booked.label}
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.selected.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">
              {seatTypes.selected.label}
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.normal.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">
              {seatTypes.normal.label}
            </Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.vip.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">
              {seatTypes.vip.label}
            </Text>
          </Flex>
        </SimpleGrid>

        <Divider my={6} borderColor="#23242a" />

        {/* MOVIE INFO & ACTION */}
        <Box mx="auto" maxW="800px" bg="#1a1b23" borderRadius="lg" p={4}>
          <Flex align="flex-start" mb={4}>
            <Badge colorScheme="orange" mr={3} fontSize="xs">
              C13
            </Badge>
            <Box flex="1">
              <Text fontWeight="bold" fontSize="lg">
                {movie.title}
              </Text>
              <Text fontSize="sm" color="gray.400">
                {time} · {showtimeDateText}{" "}
                · {room?.name} · 2D Phụ đề
              </Text>
            </Box>
          </Flex>

          <Box borderTop="1px solid" borderColor="#23242a" pt={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="sm" color="gray.400">
                Chỗ ngồi
              </Text>
              <Flex gap={2} flexWrap="wrap" justify="flex-end">
                {selectedSeats.length === 0 ? (
                  <Text fontSize="sm" color="gray.500">
                    Chưa chọn
                  </Text>
                ) : (
                  selectedSeats.map((s) => (
                    <Badge
                      key={s.id || s._id}
                      colorScheme="pink"
                      display="flex"
                      alignItems="center"
                      gap={1}
                      px={2}
                      py={1}
                      borderRadius="md"
                    >
                      {s.seat_number}
                      <CloseIcon
                        boxSize={2}
                        cursor="pointer"
                        onClick={() => removeSeat(s.id || s._id)}
                        _hover={{ color: "white" }}
                      />
                    </Badge>
                  ))
                )}
              </Flex>
            </Flex>

            {/* ✅ Phần chọn combo bắp nước */}
            <FoodSelection
              selectedFoods={selectedFoods}
              onFoodChange={setSelectedFoods}
            />

            <Divider my={4} borderColor="#2d2e35" />

            {/* ✅ Tổng tiền */}
            <Flex justify="space-between" mb={1}>
              <Text fontSize="sm" color="gray.400">
                Tiền vé
              </Text>
              <Text fontWeight="bold">{seatTotal.toLocaleString("vi-VN")}đ</Text>
            </Flex>
            <Flex justify="space-between" mb={2}>
              <Text fontSize="sm" color="gray.400">
                Combo bắp nước
              </Text>
              <Text fontWeight="bold">{foodTotal.toLocaleString("vi-VN")}đ</Text>
            </Flex>

            <Flex justify="space-between" mb={4}>
              <Text fontSize="md" color="orange.300" fontWeight="bold">
                Tổng cộng
              </Text>
              <Text fontWeight="bold" color="orange.300" fontSize="xl">
                {total.toLocaleString("vi-VN")}đ
              </Text>
            </Flex>

            <VStack spacing={3}>
              <Button
                bgGradient="linear(to-r, teal.400, green.400)"
                color="white"
                size="lg"
                w="full"
                isDisabled={selectedSeats.length === 0}
                onClick={handleCashPayment}
              >
                Thanh toán tiền mặt
              </Button>

              <Button
                bgGradient="linear(to-r, pink.400, purple.400)"
                color="white"
                size="lg"
                w="full"
                isDisabled={selectedSeats.length === 0}
                onClick={handleOnlinePayment}
              >
                Thanh toán online
              </Button>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}