import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Flex,
  Text,
  Button,
  Spinner,
  HStack,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";

const SEAT_COLORS = {
  normal: "gray.300",
  vip: "orange.400",
  selected: "green.400",
  sold: "gray.500",
  disabled: "gray.200",
};

export default function TicketSeatSelectPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { movie, time, showtime } = location.state || {};
  const [room, setRoom] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy thông tin phòng chiếu từ showtime
  useEffect(() => {
    if (!showtime?.room_id?._id) return;
    fetch(`http://localhost:5000/api/public/rooms/${showtime.room_id._id}/seats`)
      .then(res => res.json())
      .then(data => setSeats(data.list || []))
      .finally(() => setLoading(false));
    setRoom(showtime.room_id);
  }, [showtime]);

  // Xử lý chọn ghế
  const handleSelectSeat = (seat) => {
    if (seat.sold || seat.disabled) return;
    setSelectedSeats(prev =>
      prev.some(s => s.id === seat.id)
        ? prev.filter(s => s.id !== seat.id)
        : [...prev, seat]
    );
  };

  // Tạo lưới ghế theo hàng
  const seatGrid = [];
  const seatsByRow = {};
  seats.forEach(seat => {
    const row = seat.seat_number[0];
    if (!seatsByRow[row]) seatsByRow[row] = [];
    seatsByRow[row].push(seat);
  });
  Object.keys(seatsByRow)
    .sort()
    .forEach(row => seatGrid.push({ row, seats: seatsByRow[row] }));

  // Tổng tiền
  const total = selectedSeats.reduce(
    (sum, seat) => sum + (seat.type === "vip" ? 80000 : 50000),
    0
  );

  // Chuyển sang trang bán bắp nước
  const handleNext = () => {
    navigate("/staff/food", {
      state: {
        movie,
        time,
        showtime,
        room,
        selectedSeats,
        total,
      },
    });
  };

  if (!movie || !showtime) {
    return <Box p={8}><Text>Không tìm thấy thông tin suất chiếu.</Text></Box>;
  }

  return (
    <Box minH="100vh" bg="#181a20" p={6}>
      <HStack spacing={8} mb={6} align="flex-start">
        <Box flex="1">
          <Heading size="lg" mb={4} color="white">Chọn ghế</Heading>
          <Box bg="#23242a" borderRadius="md" p={6} boxShadow="md">
            <Box bg="gray.700" py={2} borderRadius="md" mb={4}>
              <Text textAlign="center" fontWeight="bold" color="white">MÀN HÌNH</Text>
            </Box>
            {loading ? (
              <Flex justify="center" align="center" minH="200px">
                <Spinner color="orange.400" />
              </Flex>
            ) : (
              <Box>
                {seatGrid.map(({ row, seats }) => (
                  <Flex key={row} mb={2} align="center" justify="center">
                    <Box w="32px" textAlign="center" color="gray.400" fontWeight="bold">{row}</Box>
                    <Flex gap={2}>
                      {seats.map(seat => {
                        const isSelected = selectedSeats.some(s => s.id === seat.id);
                        return (
                          <Button
                            key={seat.id}
                            size="sm"
                            w="32px"
                            h="32px"
                            p={0}
                            bg={
                              seat.sold
                                ? SEAT_COLORS.sold
                                : seat.disabled
                                ? SEAT_COLORS.disabled
                                : isSelected
                                ? SEAT_COLORS.selected
                                : seat.type === "vip"
                                ? SEAT_COLORS.vip
                                : SEAT_COLORS.normal
                            }
                            color={
                              seat.sold || seat.disabled
                                ? "gray.400"
                                : isSelected
                                ? "white"
                                : "black"
                            }
                            borderRadius="4px"
                            border={isSelected ? "2px solid #2ecc40" : "1px solid #444"}
                            onClick={() => handleSelectSeat(seat)}
                            isDisabled={seat.sold || seat.disabled}
                            fontSize="xs"
                            fontWeight="bold"
                          >
                            {seat.seat_number.slice(1)}
                          </Button>
                        );
                      })}
                    </Flex>
                  </Flex>
                ))}
              </Box>
            )}
          </Box>
        </Box>
        <Box w="320px">
          <Box bg="#23242a" borderRadius="md" p={4} boxShadow="md" mb={4}>
            <Text fontWeight="bold" mb={2} color="orange.400" fontSize="lg">{movie.title}</Text>
            <Text fontSize="sm" color="gray.300">{room?.name}</Text>
            <Text fontSize="sm" color="gray.300">
              Suất {time} - {new Date(showtime.start_time).toLocaleDateString("vi-VN")}
            </Text>
            <Text fontSize="sm" color="gray.300" mt={3}>
              <strong>Ghế:</strong> {selectedSeats.map(s => s.seat_number).join(", ") || "Chưa chọn"}
            </Text>
          </Box>
          <Box bg="#23242a" borderRadius="md" p={4} boxShadow="md" mb={4}>
            <Text fontWeight="bold" mb={2} color="white">TỔNG ĐƠN HÀNG</Text>
            <Text fontSize="2xl" color="orange.400" fontWeight="bold">
              {total.toLocaleString()} đ
            </Text>
          </Box>
          <Button
            colorScheme="orange"
            w="100%"
            size="lg"
            isDisabled={selectedSeats.length === 0}
            onClick={handleNext}
          >
            Tiếp tục
          </Button>
        </Box>
      </HStack>
    </Box>
  );
}