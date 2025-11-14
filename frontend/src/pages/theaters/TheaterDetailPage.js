import {
  Box,
  Heading,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  VStack,
  HStack,
  Card,
  CardBody,
  Image,
  Badge,
  Button,
  Flex,
  Divider,
  Grid,
} from "@chakra-ui/react";
import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import apiService from "../../services/apiService";
import { format, parseISO, startOfToday } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon, TimeIcon } from "@chakra-ui/icons";

const TheaterDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [theater, setTheater] = useState(null);
  const [allShowtimes, setAllShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Load song song theaters và showtimes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError("");

    // Load theaters
    const theaterPromise = new Promise((resolve) => {
      apiService.post(
        "/api/public/theaters/list",
        { page: 1, pageSize: 1000, status: "active" },
        (data, success) => {
          if (!isMounted) return;
          if (success) {
            const foundTheater = data.list.find(
              (t) => (t.id || t._id) === id
            );
            if (foundTheater) {
              setTheater(foundTheater);
            } else {
              setError("Không tìm thấy rạp chiếu");
            }
          } else {
            setError(data?.message || "Không thể tải thông tin rạp");
          }
          resolve();
        }
      );
    });

    // Load showtimes (giống HomePage)
    const showtimesPromise = new Promise((resolve) => {
      apiService.getPublic("/api/showtimes", {}, (data, success) => {
        if (!isMounted) return;
        if (success) {
          setAllShowtimes(Array.isArray(data?.data) ? data.data : []);
        }
        resolve();
      });
    });

    // Chờ cả hai hoàn thành
    Promise.all([theaterPromise, showtimesPromise]).finally(() => {
      if (isMounted) {
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Kiểm tra xem một ngày có phải hôm nay không (giống HomePage)
  const isToday = (dateString) => {
    if (!dateString) return false;
    const today = new Date();
    const vietnamToday = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));

    // Parse date từ vietnamFormatted string (format: "09:30:00 14/10/2025")
    const dateMatch = dateString.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!dateMatch) return false;

    const [day, month, year] = dateMatch[1].split('/');
    const showtimeDate = new Date(year, month - 1, day);

    return showtimeDate.toDateString() === vietnamToday.toDateString();
  };

  // Lọc showtimes theo rạp và lấy phim
  const theaterShowtimes = useMemo(() => {
    if (!allShowtimes.length || !id) return [];
    
    return allShowtimes.filter((st) => {
      if (!st || st.status !== 'active') return false;
      
      // Lấy theater_id từ room_id
      const theaterId = st.room_id?.theater_id?._id || st.room_id?.theater_id || st.room_id?.theater_id?.id;
      const theaterIdStr = typeof theaterId === 'string' ? theaterId : (theaterId?._id || theaterId?.id);
      
      return theaterIdStr === id || theaterId === id;
    });
  }, [allShowtimes, id]);

  // Lấy showtimes cho một phim cụ thể trong ngày hôm nay (giống HomePage)
  const getMovieShowtimes = (movieId) => {
    const movieShowtimes = theaterShowtimes.filter((st) => {
      if (!st || st.status !== 'active') return false;
      
      // Kiểm tra movie_id
      const movieIdMatches = (() => {
        const movieField = st.movie_id;
        if (!movieField) return false;
        if (typeof movieField === 'string') return movieField === movieId;
        if (typeof movieField === 'object' && movieField._id) return movieField._id === movieId;
        return false;
      })();

      const vietnamFormatted = st?.start_time?.vietnamFormatted;
      return movieIdMatches && typeof vietnamFormatted === 'string' && isToday(vietnamFormatted);
    });

    // Extract time từ vietnamFormatted string và loại bỏ trùng lặp
    const allTimes = movieShowtimes.map((st) => {
      const vf = st?.start_time?.vietnamFormatted || '';
      const timeMatch = vf.match(/^(\d{2}:\d{2})/);
      return timeMatch ? timeMatch[1] : (vf.split(' ')[0] || '');
    }).filter(Boolean);

    // Loại bỏ trùng lặp và sắp xếp
    const uniqueTimes = [...new Set(allTimes)].sort();
    return uniqueTimes;
  };

  // Lấy danh sách phim duy nhất từ showtimes
  const movies = useMemo(() => {
    const movieMap = new Map();
    
    theaterShowtimes.forEach((st) => {
      const movie = st.movie_id;
      if (!movie) return;
      
      const movieId = movie._id || movie.id;
      if (!movieId || movieMap.has(movieId)) return;
      
      movieMap.set(movieId, {
        _id: movieId,
        title: movie.title,
        poster_url: movie.poster_url,
        description: movie.description,
        duration: movie.duration,
        genre: movie.genre || [],
      });
    });
    
    return Array.from(movieMap.values());
  }, [theaterShowtimes]);

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

  if (!theater) {
    return (
      <Center minH="80vh">
        <Text color="gray.400">Không tìm thấy rạp chiếu</Text>
      </Center>
    );
  }

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "";
    return `${minutes} phút`;
  };

  return (
    <Box bg="gray.900" color="white" minH="calc(100vh - 140px)" py={8}>
      <Box maxW="1400px" mx="auto" px={4}>
        {/* Header */}
        <VStack align="stretch" mb={8} spacing={4}>
          <Button
            variant="ghost"
            colorScheme="orange"
            onClick={() => navigate("/theaters")}
            alignSelf="flex-start"
          >
            ← Quay lại danh sách rạp
          </Button>
          <Heading color="orange.400">{theater.name}</Heading>
          <Text color="gray.300" fontSize="lg">
            📍 {theater.location || "Chưa cập nhật địa chỉ"}
          </Text>
          <HStack spacing={4}>
            <Badge colorScheme="blue" fontSize="sm" px={3} py={1}>
              {theater.rooms_count || 0} phòng chiếu
            </Badge>
            <Badge colorScheme="green" fontSize="sm" px={3} py={1}>
              {theater.total_seats || 0} ghế
            </Badge>
          </HStack>
        </VStack>

        {/* Danh sách phim - giống HomePage */}
        <Heading as="h2" size="xl" textAlign="center" mb={6} color="orange.400">
          Phim đang chiếu tại {theater.name}
        </Heading>

        {loading && (
          <Box textAlign="center" py={10}>
            <Spinner color="orange.400" size="xl" />
            <Text color="gray.300" mt={4}>Đang tải danh sách phim...</Text>
          </Box>
        )}

        {!!error && !loading && (
          <Text textAlign="center" color="red.400" py={10}>{error}</Text>
        )}

        {!loading && !error && (
          <>
            {movies.length === 0 ? (
              <Center py={20}>
                <Text color="gray.400" fontSize="lg">
                  Không có phim nào đang chiếu tại rạp này
                </Text>
              </Center>
            ) : (
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
                {movies.map((movie) => {
                  const movieShowtimes = getMovieShowtimes(movie._id);
                  return (
                    <Card key={movie._id} bg="gray.800" color="white" borderRadius="md" border="1px solid" borderColor="gray.700">
                      <Box position="relative">
                        <Image
                          src={movie.poster_url}
                          alt={movie.title}
                          borderTopRadius="md"
                          height="350px"
                          width="100%"
                          objectFit="contain"
                          fallbackSrc="https://via.placeholder.com/300x450?text=No+Image"
                        />
                      </Box>

                      <CardBody>
                        <VStack align="start" spacing={3}>
                          <Heading size="md" color="orange.400">{movie.title}</Heading>
                          <Text fontSize="sm" color="gray.300">
                            {(movie.genre || []).join(", ")}
                          </Text>
                          <HStack spacing={2} color="gray.300">
                            <TimeIcon />
                            <Text fontSize="sm">{formatDuration(movie.duration)}</Text>
                          </HStack>

                          <Divider borderColor="gray.600" />

                          <VStack align="start" spacing={2} width="100%">
                            <HStack color="gray.300" spacing={2}>
                              <CalendarIcon />
                              <Text fontSize="sm">Suất chiếu hôm nay:</Text>
                            </HStack>
                            <HStack wrap="wrap" spacing={2}>
                              {movieShowtimes.length > 0 ? (
                                movieShowtimes.map((time) => (
                                  <Button
                                    key={time}
                                    size="sm"
                                    bg="orange.400"
                                    color="white"
                                    _hover={{ bg: "orange.500" }}
                                    onClick={() => {
                                      // Tìm showtime tương ứng với time này
                                      const matchingShowtime = theaterShowtimes.find((st) => {
                                        const vf = st?.start_time?.vietnamFormatted || '';
                                        const timeMatch = vf.match(/^(\d{2}:\d{2})/);
                                        const showtimeTime = timeMatch ? timeMatch[1] : '';
                                        return showtimeTime === time && 
                                               st.movie_id?._id === movie._id &&
                                               isToday(vf);
                                      });
                                      
                                      if (matchingShowtime) {
                                        navigate(`/bookings/seats/${matchingShowtime._id}`);
                                      }
                                    }}
                                  >
                                    {time}
                                  </Button>
                                ))
                              ) : (
                                <Text fontSize="sm" color="gray.400">Không có suất chiếu hôm nay</Text>
                              )}
                            </HStack>
                          </VStack>

                          <Button
                            bg="orange.400"
                            color="white"
                            _hover={{ bg: "orange.500" }}
                            width="100%"
                            onClick={() => navigate(`/movies/${movie._id}`)}
                          >
                            Xem chi tiết
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  );
                })}
              </Grid>
            )}
          </>
        )}
      </Box>
    </Box>
  );
};

export default TheaterDetailPage;

