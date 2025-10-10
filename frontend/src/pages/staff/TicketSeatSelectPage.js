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
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";

const seatTypes = {
  booked: { color: "#ff4d4d", label: "Đã đặt" },
  selected: { color: "#ff66ff", label: "Ghế bạn chọn" },
  normal: { color: "#444", label: "Ghế thường" },
  vip: { color: "#a54aff", label: "Ghế VIP" },
  couple: { color: "#00b3b3", label: "Ghế đôi" },
};

export default function MovieSeatBookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const { movie, time, showtime } = location.state || {};
  const [room, setRoom] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
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
        setSeats(data.list || []);
        setRoom(showtime.room_id);
      })
      .catch((err) =>
        toast({
          title: "Lỗi tải ghế",
          description: err.message,
          status: "error",
          duration: 3000,
        })
      )
      .finally(() => setLoading(false));
  }, [showtime]);

  // 🔹 Handle seat selection
  const handleSelect = (seat) => {
    if (seat.isBooked || seat.isDisabled) return;
    setSelectedSeats((prev) =>
      prev.some((s) => s._id === seat._id)
        ? prev.filter((s) => s._id !== seat._id)
        : [...prev, seat]
    );
  };

  // 🔹 Group seats by row
  const seatGrid = [];
  const seatsByRow = {};
  seats.forEach((seat) => {
    const row = seat.seat_number[0];
    if (!seatsByRow[row]) seatsByRow[row] = [];
    seatsByRow[row].push(seat);
  });
  Object.keys(seatsByRow)
    .sort()
    .forEach((row) => seatGrid.push({ row, seats: seatsByRow[row] }));

  // 🔹 Compute total
  const total = selectedSeats.reduce(
    (sum, s) => sum + (s.type === "vip" ? 80000 : 50000),
    0
  );

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
    navigate("/staff/food", {
      state: { movie, time, showtime, room, selectedSeats, total },
    });
  };

  if (!movie || !showtime)
    return (
      <Box p={8}>
        <Text>Không tìm thấy thông tin suất chiếu.</Text>
      </Box>
    );

  return (
    <Box bg="#0f1117" minH="100vh" p={6} color="white">
      <Heading size="md" textAlign="center" mb={4} color="white">
        Mua vé xem phim
      </Heading>

      {/* SCREEN LABEL */}
      <Box
        mx="auto"
        maxW="800px"
        textAlign="center"
        borderBottom="3px solid #ff66ff"
        pb={1}
        mb={6}
      >
        <Text fontSize="sm" color="gray.300">
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
              <HStack key={row} justify="center" spacing={1}>
                {seats.map((seat) => {
                  const isSelected = selectedSeats.some(
                    (s) => s._id === seat._id
                  );
                  const color = seat.isBooked
                    ? seatTypes.booked.color
                    : isSelected
                    ? seatTypes.selected.color
                    : seat.type === "vip"
                    ? seatTypes.vip.color
                    : seatTypes.normal.color;

                  return (
                    <Button
                      key={seat._id}
                      size="sm"
                      w="36px"
                      h="36px"
                      p={0}
                      fontSize="xs"
                      fontWeight="bold"
                      bg={color}
                      color="white"
                      _hover={{
                        bg: seat.isBooked ? color : "#ff66ff",
                      }}
                      onClick={() => handleSelect(seat)}
                      isDisabled={seat.isBooked || seat.isDisabled}
                    >
                      {seat.seat_number.slice(1)}
                    </Button>
                  );
                })}
              </HStack>
            ))}
          </VStack>
        </Box>
      )}

      {/* LEGEND */}
      <SimpleGrid columns={[2, 3, 5]} spacing={2} mt={6} mx="auto" maxW="600px">
        {Object.entries(seatTypes).map(([key, { color, label }]) => (
          <Flex key={key} align="center" gap={2}>
            <Box w="16px" h="16px" bg={color} borderRadius="2px" />
            <Text fontSize="sm" color="gray.300">
              {label}
            </Text>
          </Flex>
        ))}
      </SimpleGrid>

      <Divider my={6} borderColor="#23242a" />

      {/* MOVIE INFO & ACTION */}
      <Flex
        justify="space-between"
        align="center"
        flexWrap="wrap"
        mx="auto"
        maxW="800px"
        gap={3}
      >
        <Box>
          <Badge colorScheme="orange" mb={2}>
            C16
          </Badge>
          <Text fontWeight="bold">{movie.title}</Text>
          <Text fontSize="sm" color="gray.400">
            {time} · {new Date(showtime.start_time).toLocaleDateString("vi-VN")}{" "}
            · {room?.name} · 2D Phụ đề
          </Text>
        </Box>

        <Box textAlign="right">
          <Text fontSize="sm" color="gray.400">
            Chỗ ngồi
          </Text>
          <Text fontWeight="bold" color="white">
            {selectedSeats.length
              ? selectedSeats.map((s) => s.seat_number).join(", ")
              : "Chưa chọn"}
          </Text>
          <Text fontSize="sm" color="gray.400" mt={2}>
            Tạm tính
          </Text>
          <Text fontWeight="bold" color="orange.300" fontSize="xl">
            {total.toLocaleString("vi-VN")} đ
          </Text>
        </Box>

        <Button
          colorScheme="pink"
          size="lg"
          mt={[4, 0]}
          px={8}
          isDisabled={selectedSeats.length === 0}
          onClick={handleNext}
        >
          Mua vé
        </Button>
      </Flex>
    </Box>
  );
}
