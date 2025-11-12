import { Box, Badge, HStack, Spinner, Text, VStack, Button, useToast, Flex, Divider, SimpleGrid, Heading } from "@chakra-ui/react";
import { CloseIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import apiService from "../../services/apiService";

const seatTypes = {
  booked: { color: "#000000", label: "Đã đặt" },
  selected: { color: "#ff66ff", label: "Ghế bạn chọn" },
  normal: { color: "#7c3aed", label: "Ghế thường" },
  vip: { color: "#ef4444", label: "Ghế VIP" },
};

export default function SeatSelection() {
  const { showtimeId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showtime, setShowtime] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isCreatingBooking, setIsCreatingBooking] = useState(false);
  const [bookedSeatIds, setBookedSeatIds] = useState([]);


  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    // Lấy thông tin showtime và booked seats song song
    Promise.all([
      new Promise((resolve) => {
        apiService.getById("/api/showtimes/", showtimeId, (data, success) => {
          if (!isMounted) return resolve(null);
          if (success) {
            setShowtime(data?.data);
            resolve(data?.data?.room_id?._id || data?.data?.room_id);
          } else {
            setError(data?.message || "Không thể tải thông tin suất chiếu");
            resolve(null);
          }
        });
      }),
      new Promise((resolve) => {
        apiService.getPublic(`/api/showtimes/${showtimeId}/booked-seats`, {}, (data, success) => {
          if (!isMounted) return resolve([]);
          if (success) {
            // booked_seats là mảng các seat_id (string hoặc ObjectId)
            const bookedIds = (data?.booked_seats || []).map(id => String(id));
            setBookedSeatIds(bookedIds);
            resolve(bookedIds);
          } else {
            console.error("Failed to load booked seats:", data);
            resolve([]);
          }
        });
      })
    ]).then(([roomId]) => {
      if (!isMounted) return;
      
      if (!roomId) {
        setLoading(false);
        return;
      }

      // Lấy danh sách ghế của phòng
      apiService.getPublic(`/api/public/rooms/${roomId}/seats`, {}, (seatRes, ok) => {
        if (!isMounted) return;
        if (ok) {
          const normalizeMoney = (value) => {
            if (value == null) return NaN;
            if (typeof value === "number") return value;
            if (typeof value === "string") {
              const sanitized = value.replace(/[^0-9.-]/g, "");
              const num = Number(sanitized);
              return Number.isFinite(num) ? num : NaN;
            }
            if (typeof value === "object") {
              if (Object.prototype.hasOwnProperty.call(value, "$numberDecimal")) {
                const num = Number(value.$numberDecimal);
                return Number.isFinite(num) ? num : NaN;
              }
              if (typeof value.toString === "function") {
                const num = Number(value.toString());
                return Number.isFinite(num) ? num : NaN;
              }
            }
            return NaN;
          };

          const seatsWithId = (seatRes?.list || []).map((s) => {
            const normalizedBase = normalizeMoney(s.base_price);
            const normalizedPrice = normalizeMoney(s.price);
            const effectivePrice =
              Number.isFinite(normalizedBase) && normalizedBase > 0
                ? normalizedBase
                : Number.isFinite(normalizedPrice) && normalizedPrice > 0
                  ? normalizedPrice
                  : NaN;

            return {
              ...s,
              id: s._id || s.id,
              base_price: Number.isFinite(normalizedBase) ? normalizedBase : undefined,
              price: Number.isFinite(effectivePrice) ? effectivePrice : undefined,
              _effectivePrice: Number.isFinite(effectivePrice) ? effectivePrice : undefined,
            };
          });
          setSeats(Array.isArray(seatsWithId) ? seatsWithId : []);
        } else {
          setError(seatRes?.message || "Không thể tải danh sách ghế");
        }
        setLoading(false);
      });
    });

    return () => {
      isMounted = false;
    };
  }, [showtimeId]);

  const handleSelect = (seat) => {
    // Kiểm tra ghế đã được đặt
    const seatIdString = String(seat.id || seat._id);
    if (bookedSeatIds.includes(seatIdString)) return;
    
    setSelectedSeats((prev) => {
      const index = prev.findIndex((s) => s.id === seat.id);
      if (index !== -1) {
        return prev.filter((s) => s.id !== seat.id);
      } else {
        return [...prev, seat];
      }
    });
  };

  const removeSeat = (seatId) => {
    setSelectedSeats((prev) => prev.filter((s) => s.id !== seatId));
  };

  const seatsByRow = useMemo(() => {
    const map = {};
    seats.forEach((s) => {
      const seatNo = String(s.seat_number || "");
      const rowKey = seatNo.charAt(0).toUpperCase();
      if (!map[rowKey]) map[rowKey] = [];
      map[rowKey].push(s);
    });
    Object.keys(map).forEach(key => {
        map[key].sort((a, b) => {
            const numA = parseInt(a.seat_number.slice(1), 10);
            const numB = parseInt(b.seat_number.slice(1), 10);
            return numA - numB;
        });
    });
    return map;
  }, [seats]);

  const deriveSeatPrice = (seat) => {
    const direct = typeof seat?._effectivePrice === "number" ? seat._effectivePrice : undefined;
    if (Number.isFinite(direct) && direct > 0) {
      return direct;
    }

    const base = typeof seat?.base_price === "number" ? seat.base_price : undefined;
    if (Number.isFinite(base) && base > 0) {
      return base;
    }

    const explicit = typeof seat?.price === "number" ? seat.price : undefined;
    if (Number.isFinite(explicit) && explicit > 0) {
      return explicit;
    }

    let fallback = Number(showtime?.price) || 0;
    if (!Number.isFinite(fallback) || fallback <= 0) {
      fallback = 50000;
    }
    if (seat?.type === "vip") fallback = Math.round(fallback * 1.5);
    if (seat?.type === "couple") fallback = Math.round(fallback * 3);
    return fallback;
  };

  const total = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => {
      const price = deriveSeatPrice(seat);
      return sum + (Number.isFinite(price) ? price : 0);
    }, 0);
  }, [selectedSeats, showtime]);

  const handleNext = async () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "Chưa chọn ghế",
        description: "Vui lòng chọn ít nhất 1 ghế để tiếp tục.",
        status: "warning",
        duration: 3000,
      });
      return;
    }

    setIsCreatingBooking(true);

    const bookingData = {
      showtime_id: showtimeId,
      seat_ids: selectedSeats.map((s) => s.id),
      payment_method: "online",
    };

    apiService.post("/api/bookings", bookingData, (response, success) => {
      setIsCreatingBooking(false);
      if (success) {
        const bookingId = response.booking._id;
        navigate(`/bookings/checkout/${bookingId}`);
      } else {
        toast({
          title: "Lỗi",
          description: "Đã có người chọn ghế này. Vui lòng chọn ghế khác",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    });
  };

  if (loading) {
    return (
      <Box bg="gray.900" minH="calc(100vh - 140px)" py={8} display="flex" alignItems="center" justifyContent="center">
        <Spinner color="orange.400" size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Box bg="gray.900" minH="calc(100vh - 140px)" py={8} display="flex" alignItems="center" justifyContent="center">
        <Text color="red.400" fontWeight="semibold">{error}</Text>
      </Box>
    );
  }

  return (
    <Box bg="#0f1117" minH="100vh" color="white" py={8}>
      <VStack spacing={8} w="100%" maxW="900px" mx="auto">
        <Box w="100%" textAlign="center" borderBottom="3px solid #d53f8c" pb={2} mb={4}>
          <Text fontSize="lg" color="gray.300" fontWeight="semibold">MÀN HÌNH</Text>
        </Box>

        <VStack spacing={2} w="100%">
          {Object.keys(seatsByRow).sort().map((rowKey) => (
            <HStack key={rowKey} justify="center" spacing={4}>
              <Box
                w="40px"
                h="36px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="gray.400"
                fontWeight="bold"
              >
                {rowKey}
              </Box>
              {seatsByRow[rowKey].map((seat) => {
                const isSelected = selectedSeats.some((s) => s.id === seat.id);
                // Kiểm tra ghế đã được đặt bằng cách so sánh với bookedSeatIds
                const seatIdString = String(seat.id || seat._id);
                const isBooked = bookedSeatIds.includes(seatIdString);
                
                let color, hoverColor;
                if (isBooked) {
                  color = seatTypes.booked.color;
                  hoverColor = seatTypes.booked.color;
                } else if (isSelected) {
                  color = seatTypes.selected.color;
                  hoverColor = seatTypes.selected.color;
                } else if (seat.type === "vip") {
                  color = seatTypes.vip.color;
                  hoverColor = "#f87171";
                } else {
                  color = seatTypes.normal.color;
                  hoverColor = "#8b5cf6";
                }
                return (
                  <Button
                    key={seat.id}
                    size="sm" w="36px" h="36px" p={0} fontSize="xs" fontWeight="bold"
                    bg={color}
                    color="white"
                    border="none"
                    borderRadius="md"
                    _hover={{ bg: isBooked ? color : hoverColor, opacity: isBooked ? 0.7 : 1 }}
                    onClick={() => handleSelect(seat)}
                    isDisabled={isBooked}
                    cursor={isBooked ? "not-allowed" : "pointer"}
                  >
                    {seat.seat_number.slice(1)}
                  </Button>
                );
              })}
            </HStack>
          ))}
        </VStack>

        <SimpleGrid columns={2} spacing={3} mt={6} mx="auto" maxW="500px">
            {Object.values(seatTypes).map(type => (
                <Flex align="center" gap={2} key={type.label}>
                    <Box w="20px" h="20px" bg={type.color} borderRadius="4px" />
                    <Text fontSize="sm" color="gray.300">{type.label}</Text>
                </Flex>
            ))}
        </SimpleGrid>

        <Divider my={6} borderColor="#23242a" />

          <Box w="100%" bg="#1a1b23" borderRadius="lg" p={4}>
            <Box mb={4}>
                <Heading size="md" color="white">{showtime?.movie_id?.title}</Heading>
                <Text color="gray.400" fontSize="sm">
                    {showtime?.room_id?.name} - {new Date(showtime?.start_time?.vietnam || showtime?.start_time?.utc || showtime?.start_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(showtime?.start_time?.vietnam || showtime?.start_time?.utc || showtime?.start_time).toLocaleDateString('vi-VN')}
                </Text>
            </Box>
            <Divider my={4} borderColor="#23242a" />
            <Flex justify="space-between" align="center" mb={3}>
              <Text fontSize="sm" color="gray.400">Chỗ ngồi đã chọn</Text>
              <Flex gap={2} flexWrap="wrap" justify="flex-end">
                {selectedSeats.map((s) => (
                  <Badge
                    key={s.id}
                    colorScheme="pink"
                    display="flex" alignItems="center" gap={1}
                    px={2} py={1} borderRadius="md"
                  >
                    {s.seat_number}
                    <CloseIcon boxSize={2} cursor="pointer" onClick={() => removeSeat(s.id)} _hover={{ color: "white" }} />
                  </Badge>
                ))}
              </Flex>
            </Flex>
            
            <Flex justify="space-between" mb={4}>
              <Text fontSize="sm" color="gray.400">Tạm tính</Text>
              <Text fontWeight="bold" color="orange.300" fontSize="xl">
                {total.toLocaleString("vi-VN")}đ
              </Text>
            </Flex>

            <Button
              bg="#d53f8c" color="white" size="lg" w="full"
              onClick={handleNext}
              isLoading={isCreatingBooking}
              _hover={{ bg: "#b83280" }}
            >
              Tiếp tục
            </Button>
          </Box>
      </VStack>
    </Box>
  );
}
