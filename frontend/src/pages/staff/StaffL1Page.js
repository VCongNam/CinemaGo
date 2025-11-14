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
  Center,
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
  const [isAuthorized, setIsAuthorized] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  // Kiểm tra authentication và authorization
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      
      if (!token) {
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Vui lòng đăng nhập để truy cập trang này",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        navigate("/admin/login");
        return false;
      }

      // Lấy role từ nhiều nguồn
      let role = "";
      
      // Thử lấy từ userRole
      role = (localStorage.getItem("userRole") || "").toLowerCase();
      
      // Nếu không có, thử lấy từ role object
      if (!role) {
        try {
          const roleData = JSON.parse(localStorage.getItem("role"));
          role = (roleData?.role || "").toLowerCase();
        } catch (e) {
          // Ignore
        }
      }
      
      // Nếu vẫn không có, thử lấy từ staff object
      if (!role) {
        try {
          const staffData = JSON.parse(localStorage.getItem("staff"));
          role = (staffData?.role || "").toLowerCase();
        } catch (e) {
          // Ignore
        }
      }

      // Kiểm tra role có phải staff không
      if (role !== "lv1" && role !== "lv2" && role !== "admin") {
        toast({
          title: "Không có quyền truy cập",
          description: "Bạn không có quyền truy cập trang này",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/admin/login");
        return false;
      }

      // Nếu là lv2, redirect về trang l2
      if (role === "lv2") {
        toast({
          title: "Chuyển hướng",
          description: "Bạn đang được chuyển về trang quầy của bạn",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
        navigate("/staff/l2", { replace: true });
        return false;
      }

      // Nếu là admin, cho phép truy cập
      if (role === "admin") {
        setIsAuthorized(true);
        return true;
      }

      // Nếu là lv1, cho phép truy cập
      if (role === "lv1") {
        setIsAuthorized(true);
        return true;
      }

      return false;
    };

    if (!checkAuth()) {
      return;
    }

    // Lưu staffReturnPage ngay khi vào trang staff l1
    sessionStorage.setItem("staffReturnPage", "/staff/l1");
    localStorage.setItem("staffReturnPage", "/staff/l1");

    if (isAuthorized) {
      fetch("http://localhost:5000/api/movies")
        .then((res) => res.json())
        .then((data) => setMovies(data.data || []))
        .finally(() => setLoading(false));

      fetch("http://localhost:5000/api/showtimes")
        .then((res) => res.json())
        .then((data) => setShowtimes(data.data || []))
        .finally(() => setLoadingShowtime(false));
    }
  }, [isAuthorized, navigate, toast]);

  const staff = JSON.parse(localStorage.getItem("staff")) || {
    name: "Nhân viên",
  };

  // Nếu chưa authorized, hiển thị loading
  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg="#181a20">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

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

  // Kiểm tra xem showtime có phải hôm nay và chưa qua không
  const isTodayAndNotPassed = (startTimeObj) => {
    if (!startTimeObj) return false;

    let dateString;

    // Xử lý nếu start_time là object có vietnam/utc
    if (typeof startTimeObj === "object" && startTimeObj !== null) {
      dateString = startTimeObj.vietnam || startTimeObj.utc || startTimeObj.vietnamFormatted;
    } else if (typeof startTimeObj === "string") {
      dateString = startTimeObj;
    }

    if (!dateString) return false;

    // Parse date từ vietnamFormatted nếu có (format: "09:30:00 14/10/2025")
    let showtimeDate;
    if (typeof dateString === "string" && dateString.includes("/")) {
      // Format: "09:30:00 14/10/2025"
      const dateMatch = dateString.match(/(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        const [day, month, year] = dateMatch[1].split('/');
        const timeMatch = dateString.match(/(\d{2}:\d{2}):\d{2}/);
        if (timeMatch) {
          const [hours, minutes] = timeMatch[1].split(':');
          showtimeDate = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes));
        } else {
          showtimeDate = new Date(year, month - 1, day);
        }
      } else {
        showtimeDate = new Date(dateString);
      }
    } else {
      showtimeDate = new Date(dateString);
    }

    if (isNaN(showtimeDate.getTime())) return false;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Kiểm tra xem có phải hôm nay không
    const isToday = (
      showtimeDate.getDate() === today.getDate() &&
      showtimeDate.getMonth() === today.getMonth() &&
      showtimeDate.getFullYear() === today.getFullYear()
    );

    if (!isToday) return false;

    // Kiểm tra xem showtime đã qua chưa (so sánh với thời gian hiện tại)
    return showtimeDate > now;
  };

  // Lấy showtime cho từng movie (CHỈ HÔM NAY VÀ CHƯA QUA)
  const getShowtimesForMovie = (movieId) => {
    return showtimes
      .filter((st) => {
        // Chỉ lấy showtime active
        if (st.status !== 'active') return false;
        
        const matchMovie = st.movie_id?._id === movieId;
        const isTodayAndNotPassedShowtime = isTodayAndNotPassed(st.start_time);
        return matchMovie && isTodayAndNotPassedShowtime;
      })
      .map((st) => {
        let timeStr = "";

        if (typeof st.start_time === "object" && st.start_time !== null) {
          const dateStr = st.start_time.vietnamFormatted || st.start_time.vietnam || st.start_time.utc || "";
          if (typeof dateStr === "string") {
            // Parse từ format "09:30:00 14/10/2025"
            const timeMatch = dateStr.match(/(\d{2}:\d{2})/);
            if (timeMatch) {
              timeStr = timeMatch[1];
            } else if (dateStr.length >= 16) {
              timeStr = dateStr.slice(11, 16);
            }
          }
        } else if (
          typeof st.start_time === "string" &&
          st.start_time.length >= 16
        ) {
          // Parse từ format "09:30:00 14/10/2025"
          const timeMatch = st.start_time.match(/(\d{2}:\d{2})/);
          if (timeMatch) {
            timeStr = timeMatch[1];
          } else {
            timeStr = st.start_time.slice(11, 16);
          }
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
