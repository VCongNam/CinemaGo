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
    if (seat.isBooked) return;
    
    setSelectedSeats((prev) => {
      const index = prev.findIndex((s) => s._id === seat._id);
      
      if (index !== -1) {
        const newSeats = [...prev];
        newSeats.splice(index, 1);
        return newSeats;
      } else {
        return [...prev, seat];
      }
    });
  };

  // 🔹 Remove a selected seat
  const removeSeat = (seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => s._id !== seatId));
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
    .forEach((row) => {
      seatGrid.push({ 
        row, 
        seats: seatsByRow[row].sort((a, b) => {
          const numA = parseInt(a.seat_number.slice(1));
          const numB = parseInt(b.seat_number.slice(1));
          return numA - numB;
        })
      });
    });

  // 🔹 Compute total
  const total = selectedSeats.reduce((sum, s) => {
    let price = 50000;
    if (s.type === "vip") price = 80000;
    if (s.type === "couple") price = 150000;
    return sum + price;
  }, 0);

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
    <Box bg="#0f1117" minH="100vh" color="white">
      {/* HEADER */}
      <Flex
        bg="#d53f8c"
        p={4}
        align="center"
        position="relative"
      >
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
                  {seats.map((seat) => {
                    const isSelected = selectedSeats.findIndex(
                      (s) => s._id === seat._id
                    ) !== -1;
                    
                    // Xác định màu dựa vào trạng thái
                    let color;
                    let hoverColor;
                    
                    if (seat.isBooked) {
                      // Ghế đã đặt - màu xám đen
                      color = seatTypes.booked.color;
                      hoverColor = seatTypes.booked.color;
                    } else if (isSelected) {
                      // Ghế bạn chọn - màu hồng
                      color = seatTypes.selected.color;
                      hoverColor = seatTypes.selected.color;
                    } else if (seat.type === "vip") {
                      // Ghế VIP chưa chọn - màu đỏ
                      color = seatTypes.vip.color;
                      hoverColor = "#f87171";
                    } else {
                      // Ghế thường chưa chọn - màu tím
                      color = seatTypes.normal.color;
                      hoverColor = "#8b5cf6";
                    }

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
                        border="none"
                        borderRadius="md"
                        _hover={{
                          bg: seat.isBooked ? color : hoverColor,
                          opacity: seat.isBooked ? 0.7 : 1,
                        }}
                        onClick={() => handleSelect(seat)}
                        isDisabled={seat.isBooked}
                        cursor={seat.isBooked ? "not-allowed" : "pointer"}
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
        <SimpleGrid columns={2} spacing={3} mt={6} mx="auto" maxW="500px">
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.booked.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">{seatTypes.booked.label}</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.selected.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">{seatTypes.selected.label}</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.normal.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">{seatTypes.normal.label}</Text>
          </Flex>
          <Flex align="center" gap={2}>
            <Box w="20px" h="20px" bg={seatTypes.vip.color} borderRadius="4px" />
            <Text fontSize="sm" color="gray.300">{seatTypes.vip.label}</Text>
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
              <Text fontWeight="bold" fontSize="lg">{movie.title}</Text>
              <Text fontSize="sm" color="gray.400">
                {time} · {new Date(showtime.start_time).toLocaleDateString("vi-VN")}{" "}
                · {room?.name} · 2D Phụ đề
              </Text>
            </Box>
          </Flex>

          <Box borderTop="1px solid" borderColor="#23242a" pt={4}>
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="sm" color="gray.400">Chỗ ngồi</Text>
              <Flex gap={2} flexWrap="wrap" justify="flex-end">
                {selectedSeats.length === 0 ? (
                  <Text fontSize="sm" color="gray.500">Chưa chọn</Text>
                ) : (
                  selectedSeats.map((s) => (
                    <Badge
                      key={s._id}
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
                        onClick={() => removeSeat(s._id)}
                        _hover={{ color: "white" }}
                      />
                    </Badge>
                  ))
                )}
              </Flex>
            </Flex>
            
            <Flex justify="space-between" mb={4}>
              <Text fontSize="sm" color="gray.400">Tạm tính</Text>
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