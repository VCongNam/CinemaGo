import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Spinner,
  Alert,
  AlertIcon,
  Heading,
  Image,
  Select,
  Wrap,
  WrapItem,
  Center,
} from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import apiService from "../../services/apiService";
import { format, parseISO, startOfToday } from "date-fns";
import { vi } from "date-fns/locale";

const ShowtimeSelection = () => {
  const { movieId } = useParams();
  const navigate = useNavigate();

  const [movie, setMovie] = useState(null);
  const [theaters, setTheaters] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedDate, setSelectedDate] = useState(
    format(startOfToday(), "yyyy-MM-dd")
  );
  const [selectedTheater, setSelectedTheater] = useState("all");

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      setError("");
      try {
        const [movieRes, theatersRes, showtimesRes] = await Promise.all([
          new Promise((resolve) =>
            apiService.getById("/api/public/movies/", movieId, (data, success) =>
              resolve({ data, success })
            )
          ),
          new Promise((resolve) =>
            apiService.post(
              "/api/public/theaters/list",
              { pageSize: 1000, status: "active" }, // Get all theaters
              (data, success) => resolve({ data, success })
            )
          ),
          new Promise((resolve) =>
            apiService.get(
              `/api/showtimes?movie_id=${movieId}`,
              (data, success) => resolve({ data, success })
            )
          ),
        ]);

        if (!movieRes.success) throw new Error(movieRes.data?.message || "Không thể tải thông tin phim.");
        if (!theatersRes.success) throw new Error(theatersRes.data?.message || "Không thể tải danh sách rạp.");
        if (!showtimesRes.success) throw new Error(showtimesRes.data?.message || "Không thể tải suất chiếu.");

        setMovie(movieRes.data.data);
        setTheaters(theatersRes.data.list);
        setShowtimes(showtimesRes.data.data);

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [movieId]);

  const { availableDates, theatersWithShowtimes, filteredShowtimesByTheater } = useMemo(() => {
    if (!showtimes.length) {
      return { availableDates: [], theatersWithShowtimes: [], filteredShowtimesByTheater: new Map() };
    }

    const today = startOfToday();
    const dateSet = new Set();
    const theaterIdSet = new Set();

    showtimes.forEach(st => {
        const showtimeDate = startOfToday(parseISO(st.start_time.utc));
        if (showtimeDate >= today) {
            dateSet.add(format(showtimeDate, "yyyy-MM-dd"));
            theaterIdSet.add(st.room_id.theater_id);
        }
    });

    const availableDates = Array.from(dateSet).sort();

    const theatersWithShowtimes = theaters.filter(t => theaterIdSet.has(t.id));

    const filtered = showtimes.filter(st => {
        const showtimeDate = format(parseISO(st.start_time.utc), "yyyy-MM-dd");
        const theaterId = st.room_id.theater_id;
        return (
            showtimeDate === selectedDate &&
            (selectedTheater === "all" || theaterId === selectedTheater)
        );
    });

    const filteredShowtimesByTheater = new Map();
    filtered.forEach(st => {
        const theaterId = st.room_id.theater_id;
        if (!filteredShowtimesByTheater.has(theaterId)) {
            filteredShowtimesByTheater.set(theaterId, []);
        }
        filteredShowtimesByTheater.get(theaterId).push(st);
    });

    return { availableDates, theatersWithShowtimes, filteredShowtimesByTheater };
}, [showtimes, theaters, selectedDate, selectedTheater]);

  if (loading) {
    return (
      <Center minH="80vh">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center minH="80vh">
        <Alert status="error" maxW="md">
          <AlertIcon />
          {error}
        </Alert>
      </Center>
    );
  }

  return (
    <Box p={{ base: 4, md: 8 }} bg="#0f1117" color="white" minH="100vh">
      <VStack spacing={8} align="stretch" maxW="container.lg" mx="auto">
        {movie && (
            <HStack spacing={8} align="flex-start">
                <Image src={movie.poster_url} alt={movie.title} borderRadius="md" w="200px" d={{ base: 'none', md: 'block' }} />
                <VStack align="flex-start">
                    <Heading>{movie.title}</Heading>
                    <Text color="gray.400">{movie.genre.join(", ")}</Text>
                    <Text><strong>Thời lượng:</strong> {movie.duration} phút</Text>
                </VStack>
            </HStack>
        )}

        <VStack spacing={4} align="stretch" bg="#1a1b23" p={6} borderRadius="lg">
            <Heading size="lg" mb={4}>Chọn suất chiếu</Heading>
            
            <HStack spacing={4} mb={4}>
                <Select 
                    value={selectedTheater} 
                    onChange={(e) => setSelectedTheater(e.target.value)}
                    maxW="300px"
                    bg="#2d3748" 
                    borderColor="gray.600"
                >
                    <option value="all">Tất cả rạp</option>
                    {theatersWithShowtimes.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </Select>

                <Wrap spacing={2}>
                    {availableDates.map(date => (
                        <WrapItem key={date}>
                            <Button 
                                onClick={() => setSelectedDate(date)}
                                isActive={selectedDate === date}
                                variant={selectedDate === date ? "solid" : "outline"}
                                colorScheme="pink"
                            >
                                {format(parseISO(date), "EEE, dd/MM", { locale: vi })}
                            </Button>
                        </WrapItem>
                    ))}
                </Wrap>
            </HStack>

            {filteredShowtimesByTheater.size === 0 ? (
                <Text>Không có suất chiếu nào cho lựa chọn này.</Text>
            ) : (
                Array.from(filteredShowtimesByTheater.entries()).map(([theaterId, times]) => {
                    const theater = theaters.find(t => t.id === theaterId);
                    return (
                        <Box key={theaterId} borderWidth="1px" borderRadius="md" p={4} bg="#2d3748">
                            <Text fontWeight="semibold" fontSize="xl" mb={3}>{theater?.name}</Text>
                            <Wrap spacing={3}>
                                {times.sort((a, b) => new Date(a.start_time.utc) - new Date(b.start_time.utc)).map(time => (
                                    <WrapItem key={time._id}>
                                        <Button
                                            onClick={() => navigate(`/bookings/seats/${time._id}`)}
                                            bg="#d53f8c"
                                            color="white"
                                            _hover={{ bg: "#b83280" }}
                                        >
                                            {format(parseISO(time.start_time.utc), "HH:mm")}
                                        </Button>
                                    </WrapItem>
                                ))}
                            </Wrap>
                        </Box>
                    )
                })
            )}
        </VStack>
      </VStack>
    </Box>
  );
};

export default ShowtimeSelection;
