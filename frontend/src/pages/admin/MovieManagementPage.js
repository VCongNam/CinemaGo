import { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Badge,
  Spinner,
  Text,
  Flex,
  useToast,
  IconButton,
  Input,
  Select,
  HStack,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Textarea,
  VStack,
  Tooltip,
  Checkbox,
  CheckboxGroup,
  Wrap,
  WrapItem,
  Tag,
  TagLabel,
  TagCloseButton,
  Center,
} from "@chakra-ui/react";
import { EditIcon, UnlockIcon, LockIcon, AddIcon } from "@chakra-ui/icons";
import SidebarAdmin from "../Navbar/SidebarAdmin";
import SidebarStaff from "../Navbar/SidebarStaff";
import { useAdminOrStaffL2Auth } from "../../hooks/useAdminOrStaffL2Auth";

const MovieManagementPage = () => {
  const isAuthorized = useAdminOrStaffL2Auth();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTitle, setSearchTitle] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [genres, setGenres] = useState([]);
  const [newGenre, setNewGenre] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: "",
    genre: [],
    poster_url: "",
    trailer_url: "",
    release_date: "",
  });

  // Lấy thông tin role từ localStorage
  let roleData = null;
  try {
    roleData = JSON.parse(localStorage.getItem("role"));
  } catch (e) {
    const directRole = localStorage.getItem("role") || localStorage.getItem("userRole");
    if (directRole) {
      roleData = { role: directRole };
    }
  }
  
  const role = roleData?.role || "";
  
  // Xác định role và quyền hạn
  let isAdmin = false;
  
  if (role.toLowerCase() === "admin") {
    isAdmin = true;
  } else if (role.toLowerCase() === "lv2") {
    isAdmin = false;
  }

  useEffect(() => {
    if (!isAuthorized) return;
    fetchMovies();
  }, [isAuthorized]);

  const fetchMovies = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/movies/all", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) throw new Error("Không thể tải dữ liệu phim");
      
      const data = await response.json();
      setMovies(data.data || []);

      // Extract unique genres
      const allGenres = new Set();
      (data.data || []).forEach(movie => {
        if (movie.genre && Array.isArray(movie.genre)) {
          movie.genre.forEach(g => {
            const v = String(g || "").trim();
            if (v) allGenres.add(v);
          });
        }
      });
      setGenres(Array.from(allGenres));

    } catch (err) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovie = () => {
    setSelectedMovie(null);
    setFormData({
      title: "",
      description: "",
      duration: "",
      genre: [],
      poster_url: "",
      trailer_url: "",
      release_date: "",
    });
    onOpen();
  };

  const handleEditMovie = (movie) => {
    setSelectedMovie(movie);
    setFormData({
      title: movie.title || "",
      description: movie.description || "",
      duration: movie.duration || "",
      genre: movie.genre || [],
      poster_url: movie.poster_url || "",
      trailer_url: movie.trailer_url || "",
      release_date: movie.release_date?.utc?.split("T")[0] || "",
    });
    onOpen();
  };

  // Kiểm tra xem có phim trùng tên đang active không
  const hasDuplicateActiveMovie = (movieTitle, currentMovieId) => {
    return movies.some(m => 
      m.title?.toLowerCase() === movieTitle?.toLowerCase() && 
      m.status === "active" && 
      m._id !== currentMovieId
    );
  };

  const handleAddGenre = () => {
    const value = (newGenre || "").trim();
    if (!value) return;
    // avoid case-insensitive duplicates in master list
    setGenres((prev) => {
      if (prev.some(p => p.toLowerCase() === value.toLowerCase())) return prev;
      return [...prev, value];
    });
    setFormData((prev) => {
      const g = Array.isArray(prev.genre) ? prev.genre.map(x => String(x).trim()) : [];
      if (g.some(x => x.toLowerCase() === value.toLowerCase())) return prev;
      return { ...prev, genre: [...g, value] };
    });
    setNewGenre("");
  };

  const handleRemoveSelectedGenre = (gRemove) => {
    const normalized = String(gRemove || "").trim();
    setFormData((prev) => ({
      ...prev,
      genre: (prev.genre || []).filter((g) => String(g).trim().toLowerCase() !== normalized.toLowerCase()),
    }));
  };

  const toggleMovieStatus = async (movie) => {
    setTogglingStatus(true);
    const token = localStorage.getItem("token");
    const newStatus = movie.status === "inactive" ? "active" : "inactive";

    // Nếu đang unlock (inactive -> active), kiểm tra trùng lặp
    if (newStatus === "active") {
      if (hasDuplicateActiveMovie(movie.title, movie._id)) {
        toast({
          title: "Không thể mở khóa",
          description: "Đã có phim cùng tên đang hoạt động. Vui lòng khóa phim đó trước.",
          status: "warning",
          duration: 4000,
          isClosable: true,
        });
        setTogglingStatus(false);
        return;
      }
    }

    try {
      const res = await fetch(`http://localhost:5000/api/movies/${movie._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể thay đổi trạng thái phim.");
      }

      toast({
        title: newStatus === "inactive" ? "Phim đã bị khóa" : "Phim đã được mở khóa",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchMovies();
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTogglingStatus(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      // Validate required fields
      if (!formData.title.trim()) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập tên phim",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      if (!formData.duration || Number(formData.duration) <= 0) {
        toast({
          title: "Lỗi",
          description: "Vui lòng nhập thời lượng phim hợp lệ",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Chuẩn hóa dữ liệu gửi đi
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        duration: Number(formData.duration),
        genre: Array.isArray(formData.genre)
          ? Array.from(new Set(formData.genre.map(g => String(g).trim()).filter(Boolean)))
          : formData.genre.split(",").map((g) => g.trim()).filter(Boolean),
        poster_url: formData.poster_url.trim(),
        trailer_url: formData.trailer_url.trim(),
        release_date: formData.release_date,
      };

      const url = selectedMovie
        ? `http://localhost:5000/api/movies/${selectedMovie._id}`
        : "http://localhost:5000/api/movies";

      const method = selectedMovie ? "PUT" : "POST";

      console.log("🚀 Submitting movie:", { url, method, payload });

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));
      console.log("📥 Response:", { status: response.status, data: responseData });

      if (response.status !== 200 && response.status !== 201) {
        const errorMessage = responseData.message || responseData.error || `Lỗi ${response.status}: ${response.statusText}`;
        console.error("❌ Error response:", errorMessage);
        throw new Error(errorMessage);
      }

      toast({
        title: "Thành công",
        description: selectedMovie
          ? "Đã cập nhật phim thành công"
          : "Đã thêm phim mới thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchMovies();
      onClose();
    } catch (err) {
      console.error("❌ Error in handleSubmit:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể lưu phim. Vui lòng thử lại.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const filterAndSortMovies = () => {
    let filtered = [...movies];

    if (searchTitle.trim()) {
      filtered = filtered.filter(m =>
        m.title?.toLowerCase().includes(searchTitle.toLowerCase())
      );
    }

    if (genreFilter !== "all") {
      filtered = filtered.filter(m =>
        m.genre?.includes(genreFilter)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(m => m.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.release_date?.utc || b.created_at || 0) - new Date(a.release_date?.utc || a.created_at || 0);
        case "oldest":
          return new Date(a.release_date?.utc || a.created_at || 0) - new Date(b.release_date?.utc || b.created_at || 0);
        case "title_asc":
          return (a.title || "").localeCompare(b.title || "");
        case "title_desc":
          return (b.title || "").localeCompare(a.title || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredMovies = filterAndSortMovies();
  const totalPages = Math.ceil(filteredMovies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedMovies = filteredMovies.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTitle, genreFilter, sortBy, statusFilter]);

  const formatDate = (dateObj) => {
    if (!dateObj) return "N/A";
    if (dateObj.vietnamFormatted) return dateObj.vietnamFormatted;
    if (dateObj.utc) return new Date(dateObj.utc).toLocaleDateString("vi-VN");
    return "N/A";
  };

  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg="#0f1117">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      {isAdmin ? <SidebarAdmin /> : <SidebarStaff />}

      {/* Main Content */}
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading color="orange.400">Quản lý Phim</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme="orange"
            onClick={handleAddMovie}
            _hover={{ transform: "scale(1.05)" }}
            transition="0.2s"
          >
            Thêm phim mới
          </Button>
        </Flex>

        {/* Filters */}
        <HStack spacing={4} mb={6} flexWrap="wrap">
          <Input
            placeholder="Tìm theo tên phim..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            maxW="300px"
            bg="gray.800"
            color="white"
            border="none"
            _focus={{ bg: "gray.700" }}
          />
          <Select
            value={genreFilter}
            onChange={(e) => setGenreFilter(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>
              Tất cả thể loại
            </option>
            {genres.map((genre) => (
              <option
                key={genre}
                value={genre}
                style={{ background: "#181a20", color: "#fff" }}
              >
                {genre}
              </option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>
              Tất cả trạng thái
            </option>
            <option value="active" style={{ background: "#181a20", color: "#fff" }}>
              Đang hoạt động
            </option>
            <option value="inactive" style={{ background: "#181a20", color: "#fff" }}>
              Đã khóa
            </option>
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="newest" style={{ background: "#181a20", color: "#fff" }}>
              Mới nhất
            </option>
            <option value="oldest" style={{ background: "#181a20", color: "#fff" }}>
              Cũ nhất
            </option>
            <option value="title_asc" style={{ background: "#181a20", color: "#fff" }}>
              Tên A-Z
            </option>
            <option value="title_desc" style={{ background: "#181a20", color: "#fff" }}>
              Tên Z-A
            </option>
          </Select>
        </HStack>

        {/* Statistics */}
        <HStack spacing={4} mb={6}>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Tổng số phim</Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.400">{movies.length}</Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Kết quả lọc</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.400">{filteredMovies.length}</Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Đang hoạt động</Text>
            <Text fontSize="2xl" fontWeight="bold" color="blue.400">
              {movies.filter(m => m.status === "active").length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Đã khóa</Text>
            <Text fontSize="2xl" fontWeight="bold" color="red.400">
              {movies.filter(m => m.status === "inactive").length}
            </Text>
          </Box>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="#ff8c00" />
          </Flex>
        ) : filteredMovies.length === 0 ? (
          <Text textAlign="center" color="gray.400" fontSize="lg" mt={10}>
            Không có dữ liệu phim
          </Text>
        ) : (
          <>
            <Box overflowX="auto" bg="#1a1e29" borderRadius="2xl" p={6} boxShadow="0 0 15px rgba(255,140,0,0.1)">
              <Table variant="simple" colorScheme="whiteAlpha" size="sm">
                <Thead bg="#222633">
                  <Tr>
                    <Th color="orange.300">Poster</Th>
                    <Th color="orange.300">Tên phim</Th>
                    <Th color="orange.300">Thời lượng</Th>
                    <Th color="orange.300">Thể loại</Th>
                    <Th color="orange.300">Ngày phát hành</Th>
                    <Th color="orange.300">Trạng thái</Th>
                    <Th color="orange.300">Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedMovies.map((movie) => {
                    const canUnlock = !hasDuplicateActiveMovie(movie.title, movie._id);
                    
                    return (
                      <Tr key={movie._id} _hover={{ bg: "#252a38" }} transition="0.2s">
                        <Td>
                          {movie.poster_url ? (
                            <Image
                              src={movie.poster_url}
                              alt={movie.title}
                              boxSize="60px"
                              borderRadius="md"
                              objectFit="cover"
                              fallbackSrc="https://via.placeholder.com/60"
                            />
                          ) : (
                            <Box boxSize="60px" bg="gray.700" borderRadius="md" />
                          )}
                        </Td>
                        <Td>
                          <Text fontWeight="bold" fontSize="sm">{movie.title || "N/A"}</Text>
                          <Text fontSize="xs" color="gray.400" noOfLines={2}>
                            {movie.description || ""}
                          </Text>
                        </Td>
                        <Td fontSize="sm">{movie.duration ? `${movie.duration} phút` : "N/A"}</Td>
                        <Td>
                          <Flex gap={1} flexWrap="wrap">
                            {movie.genre?.map((g, idx) => (
                              <Badge key={idx} colorScheme="purple" fontSize="xs">
                                {g}
                              </Badge>
                            ))}
                          </Flex>
                        </Td>
                        <Td fontSize="sm">{formatDate(movie.release_date)}</Td>
                        <Td>
                          <Badge 
                            colorScheme={movie.status === "active" ? "green" : "red"}
                            fontSize="xs"
                            px={2}
                            py={1}
                          >
                            {movie.status === "active" ? "Hoạt động" : "Đã khóa"}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <IconButton
                              icon={<EditIcon />}
                              colorScheme="blue"
                              size="sm"
                              aria-label="Chỉnh sửa"
                              onClick={() => handleEditMovie(movie)}
                              _hover={{ transform: "scale(1.1)" }}
                              transition="0.2s"
                            />
                            <Tooltip 
                              label={
                                movie.status === "inactive" && !canUnlock
                                  ? "Không thể mở khóa: Đã có phim cùng tên đang hoạt động"
                                  : movie.status === "inactive"
                                  ? "Mở khóa phim"
                                  : "Khóa phim"
                              }
                              hasArrow
                            >
                              <IconButton
                                icon={movie.status === "inactive" ? <UnlockIcon /> : <LockIcon />}
                                colorScheme={movie.status === "inactive" ? "green" : "red"}
                                size="sm"
                                aria-label="Thay đổi trạng thái phim"
                                onClick={() => toggleMovieStatus(movie)}
                                isDisabled={movie.status === "inactive" && !canUnlock}
                                isLoading={togglingStatus}
                                _hover={{ transform: "scale(1.1)" }}
                                transition="0.2s"
                              />
                            </Tooltip>
                          </HStack>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6}>
                <Text color="gray.400" fontSize="sm">
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredMovies.length)} / {filteredMovies.length}
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    bg="#23242a"
                    color="white"
                    _hover={{ bg: "#2d2e35" }}
                  >
                    Trước
                  </Button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1;
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <Button
                          key={page}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          bg={currentPage === page ? "orange.400" : "#23242a"}
                          color="white"
                          _hover={{
                            bg: currentPage === page ? "orange.500" : "#2d2e35",
                          }}
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <Text key={page} color="gray.400">...</Text>;
                    }
                    return null;
                  })}
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    isDisabled={currentPage === totalPages}
                    bg="#23242a"
                    color="white"
                    _hover={{ bg: "#2d2e35" }}
                  >
                    Sau
                  </Button>
                </HStack>
              </Flex>
            )}
          </>
        )}

        {/* Add/Edit Modal */}
        <Modal isOpen={isOpen} onClose={onClose} size="xl">
          <ModalOverlay />
          <ModalContent bg="#1a1e29" color="white">
            <ModalHeader>{selectedMovie ? "Chỉnh sửa phim" : "Thêm phim mới"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tên phim</FormLabel>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    bg="gray.800"
                    border="none"
                    placeholder="Nhập tên phim..."
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Mô tả</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    bg="gray.800"
                    border="none"
                    rows={4}
                    placeholder="Nhập mô tả phim..."
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Thời lượng (phút)</FormLabel>
                  <Input
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    bg="gray.800"
                    border="none"
                    placeholder="Ví dụ: 148"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Thể loại</FormLabel>
                  <VStack align="start" spacing={3} w="100%">
                    <Wrap spacing={2}>
                      {genres.map((g) => {
                        const norm = String(g || "").trim();
                        const selected = (Array.isArray(formData.genre) ? formData.genre : [])
                          .some(x => String(x || "").trim().toLowerCase() === norm.toLowerCase());
                        return (
                          <WrapItem key={norm}>
                            <Button
                              size="sm"
                              colorScheme={selected ? "orange" : "gray"}
                              variant={selected ? "solid" : "outline"}
                              color="white"
                              onClick={() => {
                                setFormData(prev => {
                                  const cur = Array.isArray(prev.genre) ? prev.genre.map(x => String(x).trim()) : [];
                                  if (selected) {
                                    return { ...prev, genre: cur.filter(x => x.toLowerCase() !== norm.toLowerCase()) };
                                  }
                                  return { ...prev, genre: [...cur, norm] };
                                });
                              }}
                            >
                              {norm}
                            </Button>
                          </WrapItem>
                        );
                      })}
                    </Wrap>

                    {/* Selected tags with remove */}
                    <Wrap>
                      {(Array.isArray(formData.genre) ? formData.genre.map(g => String(g).trim()).filter(Boolean) : [])
                        .map((g) => (
                          <WrapItem key={`tag-${g}`}>
                            <Tag size="md" borderRadius="full" variant="solid" colorScheme="purple">
                              <TagLabel>{g}</TagLabel>
                              <TagCloseButton onClick={() => handleRemoveSelectedGenre(g)} />
                            </Tag>
                          </WrapItem>
                        ))
                      }
                    </Wrap>

                    {/* Add new genre */}
                    <HStack w="100%">
                      <Input
                        placeholder="Thêm thể loại mới"
                        value={newGenre}
                        onChange={(e) => setNewGenre(e.target.value)}
                        bg="gray.800"
                        border="none"
                      />
                      <Button colorScheme="orange" onClick={handleAddGenre}>
                        +
                      </Button>
                    </HStack>
                  </VStack>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>URL Poster</FormLabel>
                  <Input
                    value={formData.poster_url}
                    onChange={(e) => setFormData({ ...formData, poster_url: e.target.value })}
                    bg="gray.800"
                    border="none"
                    placeholder="https://example.com/poster.jpg"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>URL Trailer</FormLabel>
                  <Input
                    value={formData.trailer_url}
                    onChange={(e) => setFormData({ ...formData, trailer_url: e.target.value })}
                    bg="gray.800"
                    border="none"
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Ngày phát hành</FormLabel>
                  <Input
                    type="date"
                    value={formData.release_date}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    bg="gray.800"
                    border="none"
                  />
                </FormControl>

                <Flex gap={3} w="100%" justify="flex-end" pt={4}>
                  <Button onClick={onClose} bg="gray.700" _hover={{ bg: "gray.600" }}>
                    Hủy
                  </Button>
                  <Button 
                    colorScheme="orange"
                    onClick={handleSubmit}
                    isDisabled={!formData.title || !formData.description || !formData.duration || !formData.release_date}
                  >
                    {selectedMovie ? "Cập nhật" : "Thêm"}
                  </Button>
                </Flex>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};

export default MovieManagementPage;