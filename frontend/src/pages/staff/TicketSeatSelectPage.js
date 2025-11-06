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

  // 🔹 Fetch seats from API
  useEffect(() => {
    if (!showtime?.room_id?._id) return;

    setLoading(true);
    fetch(`http://localhost:5000/api/public/rooms/${showtime.room_id._id}/seats`)
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
        setSeats(seatData);
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
    if (seat.is_booked || seat.isBooked) return;

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
    let price = 50000;
    if (s.type === "vip") price = 80000;
    if (s.type === "couple") price = 150000;
    return sum + price;
  }, 0);

  const foodTotal = selectedFoods.reduce(
    (sum, f) => sum + f.price * f.quantity,
    0
  );

  const total = seatTotal + foodTotal;

  // 🔹 Go to next step
  const handleNext = () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Chưa chọn ghế",
        description: "Vui lòng chọn ít nhất 1 ghế để tiếp tục.",
        status: "warning",
        duration: 3000,
      });
      return;
    }
    navigate("/staff/payment", {
      state: { movie, time, showtime, room, selectedSeats, selectedFoods, total },
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
                    const isBooked = seat.is_booked === true || seat.isBooked === true;

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
                {time} · {new Date(showtime.start_time).toLocaleDateString("vi-VN")}{" "}
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

            <Button
              bg="#d53f8c"
              color="white"
              size="lg"
              w="full"
              isDisabled={selectedSeats.length === 0}
              onClick={handleNext}
              _hover={{ bg: "#b83280" }}
              _active={{ bg: "#9c2868" }}
            >
              Mua vé
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}