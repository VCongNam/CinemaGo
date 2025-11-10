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
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
} from "@chakra-ui/react";
import {
  FaFilm,
  FaClock,
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { ChevronDownIcon } from "@chakra-ui/icons";
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
  const toast = useToast();

  const staff = JSON.parse(localStorage.getItem("staff")) || {
    name: "Nhân viên",
  };

  useEffect(() => {
    fetch("http://localhost:5000/api/movies")
      .then((res) => res.json())
      .then((data) => setMovies(data.data || []))
      .finally(() => setLoading(false));

    fetch("http://localhost:5000/api/showtimes")
      .then((res) => res.json())
      .then((data) => setShowtimes(data.data || []))
      .finally(() => setLoadingShowtime(false));
  }, []);

  // Lấy tất cả thể loại duy nhất
  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre || [])));

  // Lọc phim theo tên và thể loại
  const filteredMovies = movies.filter((movie) => {
    const matchName = movie.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre =
      selectedGenres.length === 0 ||
      (movie.genre && movie.genre.some((g) => selectedGenres.includes(g)));
    return matchName && matchGenre;
  });

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

  const handleClearGenres = () => setSelectedGenres([]);

  // Kiểm tra xem ngày có phải hôm nay không
  const isToday = (startTimeObj) => {
    if (!startTimeObj) return false;

    let dateString;

    // Xử lý nếu start_time là object có vietnam/utc
    if (typeof startTimeObj === "object" && startTimeObj !== null) {
      dateString = startTimeObj.vietnam || startTimeObj.utc;
    } else if (typeof startTimeObj === "string") {
      dateString = startTimeObj;
    }

    if (!dateString) return false;

    const showtimeDate = new Date(dateString);
    const today = new Date();

    return (
      showtimeDate.getDate() === today.getDate() &&
      showtimeDate.getMonth() === today.getMonth() &&
      showtimeDate.getFullYear() === today.getFullYear()
    );
  };

  // Lấy showtime cho từng movie (CHỈ HÔM NAY)
  const getShowtimesForMovie = (movieId) => {
    return showtimes
      .filter((st) => {
        const matchMovie = st.movie_id?._id === movieId;
        const isTodayShowtime = isToday(st.start_time);
        return matchMovie && isTodayShowtime;
      })
      .map((st) => {
        let timeStr = "";

        if (typeof st.start_time === "object" && st.start_time !== null) {
          const dateStr = st.start_time.vietnam || st.start_time.utc || "";
          if (typeof dateStr === "string" && dateStr.length >= 16) {
            timeStr = dateStr.slice(11, 16);
          }
        } else if (
          typeof st.start_time === "string" &&
          st.start_time.length >= 16
        ) {
          timeStr = st.start_time.slice(11, 16);
        }

        return { ...st, time: timeStr };
      })
      .filter((st) => st.time)
      .sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleToggleShowtimes = (movieId) => {
    setOpenMovieId((prev) => (prev === movieId ? null : movieId));
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("staff");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("isStaff");
    localStorage.removeItem("user");
    toast({
      title: "Đã đăng xuất",
      status: "info",
      duration: 2000,
      position: "top",
      onCloseComplete: () => {
        window.location.href = "/admin/login";
      }
    });
  };

  const handleProfile = () => {
    navigate("/staff/profile");
  };

  return (
    <Box minH="100vh" bg="#181a20" color="white" p={6}>
      <Menu position="absolute" top="4" right="4">
        <MenuButton
          as={Button}
          rightIcon={<ChevronDownIcon />}
          colorScheme="orange"
          variant="outline"
          size="sm"
        >
          <Flex align="center" gap={2}>
            <Avatar size="xs" name={staff?.name || "NV"} />
            <Text fontSize="sm">{staff?.name || "Nhân viên"}</Text>
          </Flex>
        </MenuButton>
        <MenuList bg="#23242a" border="1px solid #333">
          <MenuItem bg="transparent" _hover={{ bg: "gray.700" }} onClick={handleProfile}>
            Thông tin nhân viên
          </MenuItem>
          <MenuItem
            bg="transparent"
            color="red.400"
            _hover={{ bg: "gray.700" }}
            onClick={handleLogout}
          >
            Đăng xuất
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Tabs chứa danh sách phim */}
      <Flex justify="center">
        <Tabs
          variant="enclosed"
          colorScheme="orange"
          w="100%"
          maxW="1200px"
          bg="#23242a"
          borderRadius="lg"
          p={6}
          boxShadow="lg"
        >
          <TabList>
            <Tab>
              <Icon as={FaFilm} mr={2} />
              Danh sách phim
            </Tab>
          </TabList>
          <TabPanels>
            <TabPanel px={0}>
              {/* Thanh tìm kiếm và filter */}
              <Flex mb={4} gap={4} flexWrap="wrap" align="center">
                <Input
                  placeholder="Tìm kiếm tên phim..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  maxW="300px"
                  bg="gray.800"
                  color="white"
                  border="none"
                  _focus={{ bg: "gray.700" }}
                />
                <HStack spacing={3} flexWrap="wrap">
                  {allGenres.map((genre) => (
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
                    <Button
                      size="sm"
                      colorScheme="orange"
                      variant="link"
                      onClick={handleClearGenres}
                    >
                      Xóa chọn
                    </Button>
                  )}
                </HStack>
              </Flex>

              {/* Danh sách phim */}
              {loading || loadingShowtime ? (
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
                          backgroundImage={movie.poster_url || undefined}
                          backgroundSize="cover"
                          backgroundPosition="center"
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                        >
                          {!movie.poster_url && (
                            <Text color="gray.500" fontSize="sm">
                              No Image
                            </Text>
                          )}
                          {movie.poster_url && (
                            <img
                              src={movie.poster_url}
                              alt={movie.title}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                            />
                          )}
                        </Box>
                        <Box p={4} flex="1" display="flex" flexDirection="column">
                          <Heading size="md" color="orange.300" mb={1}>
                            {movie.title}
                          </Heading>
                          <Text color="gray.300" fontSize="sm" mb={1}>
                            {(movie.genre || []).join(", ")}
                          </Text>
                          <Flex align="center" color="gray.400" fontSize="sm" mb={1}>
                            <Icon as={FaClock} mr={1} />{" "}
                            {movie.duration || "?"} phút
                          </Flex>
                          <Box mt={3}>
                              <Flex
                                align="center"
                                color="gray.400"
                                fontSize="sm"
                                mb={2}
                              >
                                <Icon as={FaCalendarAlt} mr={1} /> Suất chiếu hôm nay:
                              </Flex>
                              <Flex gap={2} mb={2} flexWrap="wrap">
                                {movieShowtimes.length > 0 ? (
                                  movieShowtimes.map((st) => (
                                    <Button
                                      key={st._id + st.time}
                                      size="sm"
                                      colorScheme="orange"
                                      variant="outline"
                                      _hover={{ bg: "orange.500", color: "white" }}
                                      onClick={() =>
                                        navigate("/staff/ticket", {
                                          state: { movie, time: st.time, showtime: st },
                                        })
                                      }
                                    >
                                      {st.time}
                                    </Button>
                                  ))
                                ) : (
                                  <Text color="gray.500" fontSize="sm">
                                    Không có suất chiếu hôm nay
                                  </Text>
                                )}
                              </Flex>
                            </Box>
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
