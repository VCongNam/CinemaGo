import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Flex,
  Icon,
  Spinner,
  SimpleGrid,
  Text,
  Input,
  Button,
  HStack,
  Checkbox,
  Collapse,
} from "@chakra-ui/react";
import { FaFilm, FaClock, FaCalendarAlt, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const StaffL1Page = () => {
  const [movies, setMovies] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingShowtime, setLoadingShowtime] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [openMovieId, setOpenMovieId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/movies")
      .then(res => res.json())
      .then(data => setMovies(data.data || []))
      .finally(() => setLoading(false));
    fetch("http://localhost:5000/api/showtimes")
      .then(res => res.json())
      .then(data => setShowtimes(data.data || []))
      .finally(() => setLoadingShowtime(false));
  }, []);

  // Lấy tất cả thể loại duy nhất
  const allGenres = Array.from(
    new Set(movies.flatMap(m => m.genre || []))
  );

  // Lọc phim theo tên và thể loại
  const filteredMovies = movies.filter(movie => {
    const matchName = movie.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre =
      selectedGenres.length === 0 ||
      (movie.genre && movie.genre.some(g => selectedGenres.includes(g)));
    return matchName && matchGenre;
  });

  const handleGenreChange = (genre) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const handleClearGenres = () => setSelectedGenres([]);

  // Lấy showtime cho từng movie
  const getShowtimesForMovie = (movieId) => {
    return showtimes
      .filter(st => st.movie_id?._id === movieId)
      .map(st => {
        if (typeof st.start_time === "string") {
          return { ...st, time: st.start_time.slice(11, 16) };
        }
        if (typeof st.start_time === "object" && st.start_time !== null) {
          const timeStr = st.start_time.vietnam || st.start_time.utc || "";
          return { ...st, time: typeof timeStr === "string" ? timeStr.slice(11, 16) : "" };
        }
        return { ...st, time: "" };
      })
      .filter(st => st.time);
  };

  const handleToggleShowtimes = (movieId) => {
    setOpenMovieId(prev => (prev === movieId ? null : movieId));
  };

  return (
    <Box minH="100vh" bg="#181a20" color="white" p={8}>
      <Heading mb={8} color="orange.400" textAlign="center" fontSize="2xl" letterSpacing="wide">
        Staff L1 - Quầy bán vé & bắp nước
      </Heading>
      <Flex justify="center">
        <Tabs variant="enclosed" colorScheme="orange" w="100%" maxW="1200px" bg="#23242a" borderRadius="lg" p={6} boxShadow="lg">
          <TabList>
            <Tab>
              <Icon as={FaFilm} mr={2} />
              Danh sách phim
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              <Flex mb={4} gap={4} flexWrap="wrap" align="center">
                <Input
                  placeholder="Tìm kiếm tên phim..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  maxW="300px"
                  bg="gray.800"
                  color="white"
                  border="none"
                  _focus={{ bg: "gray.700" }}
                />
                <HStack spacing={3} flexWrap="wrap">
                  {allGenres.map(genre => (
                    <Checkbox
                      key={genre}
                      colorScheme="orange"
                      isChecked={selectedGenres.includes(genre)}
                      onChange={() => handleGenreChange(genre)}
                    >
                      {genre}
                    </Checkbox>
                  ))}
                  {selectedGenres.length > 0 && (
                    <Button size="sm" colorScheme="orange" variant="link" onClick={handleClearGenres}>
                      Xóa chọn
                    </Button>
                  )}
                </HStack>
              </Flex>
              {(loading || loadingShowtime) ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner color="orange.400" />
                </Flex>
              ) : (
                <SimpleGrid columns={[1, 2, 3, 4]} spacing={6}>
                  {filteredMovies.map((movie) => {
                    const movieShowtimes = getShowtimesForMovie(movie._id);
                    return (
                      <Box
                        key={movie._id}
                        bg="#181a20"
                        borderRadius="md"
                        boxShadow="md"
                        border="1px solid #23242a"
                        overflow="hidden"
                        display="flex"
                        flexDirection="column"
                      >
                        <Box
                          h="260px"
                          bg="#111"
                          mb={0}
                          backgroundImage={movie.posterUrl || undefined}
                          backgroundSize="cover"
                          backgroundPosition="center"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {!movie.posterUrl && (
                            <Text color="gray.500" fontSize="sm">No Image</Text>
                          )}
                          {movie.posterUrl && (
                            <img
                              src={movie.posterUrl}
                              alt={movie.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block"
                              }}
                            />
                          )}
                        </Box>
                        <Box p={4} flex="1" display="flex" flexDirection="column">
                          <Heading size="md" color="orange.300" mb={1}>{movie.title}</Heading>
                          <Text color="gray.300" fontSize="sm" mb={1}>
                            {(movie.genre || []).join(", ")}
                          </Text>
                          <Flex align="center" color="gray.400" fontSize="sm" mb={1}>
                            <Icon as={FaClock} mr={1} /> {movie.duration || "?"} phút
                          </Flex>
                          <Button
                            w="100%"
                            colorScheme="orange"
                            mt={2}
                            fontWeight="bold"
                            rightIcon={openMovieId === movie._id ? <FaChevronUp /> : <FaChevronDown />}
                            onClick={() => handleToggleShowtimes(movie._id)}
                          >
                            Mua vé
                          </Button>
                          <Collapse in={openMovieId === movie._id} animateOpacity>
                            <Box mt={3}>
                              <Flex align="center" color="gray.400" fontSize="sm" mb={2}>
                                <Icon as={FaCalendarAlt} mr={1} /> Suất chiếu hôm nay:
                              </Flex>
                              <Flex gap={2} mb={2} flexWrap="wrap">
                                {movieShowtimes.length > 0 ? (
                                  movieShowtimes.map(st => (
                                    <Button
                                      key={st._id + st.time}
                                      size="sm"
                                      bg="gray.700"
                                      color="white"
                                      _hover={{ bg: "orange.400" }}
                                      onClick={() => navigate("/staff/ticket", { state: { movie, time: st.time, showtime: st } })}
                                    >
                                      {st.time}
                                    </Button>
                                  ))
                                ) : (
                                  <Text color="gray.500" fontSize="sm">Không có suất chiếu</Text>
                                )}
                              </Flex>
                            </Box>
                          </Collapse>
                        </Box>
                      </Box>
                    );
                  })}
                </SimpleGrid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Flex>
    </Box>
  );
};

export default StaffL1Page;