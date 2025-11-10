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
  VStack,
  SimpleGrid,
  Divider,
} from "@chakra-ui/react";
import { ViewIcon, EditIcon, AddIcon } from "@chakra-ui/icons";
import { MdMeetingRoom } from "react-icons/md";
import Sidebar from "../Navbar/SidebarAdmin";
import { useNavigate } from "react-router-dom";

const TheatersManagement = () => {
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTheater, setSelectedTheater] = useState(null);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [formData, setFormData] = useState({
  name: "",
  location: "",
  status: "active" // Add default status
});

  useEffect(() => {
    fetchTheaters();
  }, []);

  const fetchTheaters = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/theaters/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          page: 1,
          pageSize: 100
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi ${response.status}: Không thể tải dữ liệu rạp`);
      }

      const data = await response.json();
      console.log("Theater data:", data);
      setTheaters(data.list || []);
    } catch (err) {
      console.error("Fetch theaters error:", err);
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

  const handleAddTheater = () => {
    setSelectedTheater(null);
    setFormData({ name: "", location: "" });
    onOpen();
  };

  const handleEditTheater = (theater) => {
  setSelectedTheater(theater);
  setFormData({
    name: theater.name || "",
    location: theater.location || "",
  });
  onOpen();
};

const handleSubmit = async () => {
  try {
    if (!formData.name.trim()) {
      throw new Error("Tên rạp không được để trống");
    }

    const token = localStorage.getItem("token");
    const url = selectedTheater
      ? `http://localhost:5000/api/theaters/${selectedTheater._id}`
      : "http://localhost:5000/api/theaters";

    const method = selectedTheater ? "PUT" : "POST";
    const payload = {
      name: formData.name.trim(),
      ...(method === "POST" && { location: formData.location.trim() })
    };

    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Không thể lưu thông tin rạp");
    }

    toast({
      title: "Thành công",
      description: selectedTheater
        ? "Đã cập nhật rạp thành công"
        : "Đã thêm rạp mới thành công",
      status: "success",
      duration: 3000,
      isClosable: true,
    });

    fetchTheaters();
    onClose();
  } catch (err) {
    toast({
      title: "Lỗi",
      description: err.message,
      status: "error", 
      duration: 3000,
      isClosable: true,
    });
  }
};

  const filterAndSortTheaters = () => {
    let filtered = [...theaters];

    if (searchName.trim()) {
      filtered = filtered.filter(
        (t) =>
          t.name?.toLowerCase().includes(searchName.toLowerCase()) ||
          t.location?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case "oldest":
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
        case "name_asc":
          return (a.name || "").localeCompare(b.name || "");
        case "name_desc":
          return (b.name || "").localeCompare(a.name || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredTheaters = filterAndSortTheaters();
  const totalPages = Math.ceil(filteredTheaters.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTheaters = filteredTheaters.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, statusFilter, sortBy]);

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      <Sidebar />
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading color={"orange.400"}>Quản lý Rạp</Heading>
          <Button
            leftIcon={<AddIcon />}
            colorScheme={"orange"}
            onClick={handleAddTheater}
            _hover={{ transform: "scale(1.05)" }}
            transition="0.2s"
          >
            Thêm rạp mới
          </Button>
        </Flex>

        {/* Filters */}
        <HStack spacing={4} mb={6} flexWrap="wrap">
          <Input
            placeholder="Tìm theo tên hoặc địa điểm..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            maxW="300px"
            bg="gray.800"
            color="white"
            border="none"
            _focus={{ bg: "gray.700" }}
          />
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
              Hoạt động
            </option>
            <option value="inactive" style={{ background: "#181a20", color: "#fff" }}>
              Không hoạt động
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
            <option value="name_asc" style={{ background: "#181a20", color: "#fff" }}>
              Tên A-Z
            </option>
            <option value="name_desc" style={{ background: "#181a20", color: "#fff" }}>
              Tên Z-A
            </option>
          </Select>
        </HStack>

        {/* Statistics */}
        <HStack spacing={4} mb={6}>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">
              Tổng số rạp
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color={"orange.400"}>
              {theaters.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">
              Kết quả lọc
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.400">
              {filteredTheaters.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">
              Đang hoạt động
            </Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.400">
              {theaters.filter((t) => t.status === "active").length}
            </Text>
          </Box>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color={"#ff8c00"} />
          </Flex>
        ) : filteredTheaters.length === 0 ? (
          <Text textAlign="center" color="gray.400" fontSize="lg" mt={10}>
            Không có dữ liệu rạp
          </Text>
        ) : (
          <>
            <Box
              overflowX="auto"
              bg="#1a1e29"
              borderRadius="2xl"
              p={6}
              boxShadow={`0 0 15px rgba(255,140,0,0.1)`}
            >
              <Table variant="simple" colorScheme="whiteAlpha" size="sm">
                <Thead bg="#222633">
                  <Tr>
                    <Th color={"orange.300"}>Tên rạp</Th>
                    <Th color={"orange.300"}>Địa điểm</Th>
                    <Th color={"orange.300"}>Số phòng</Th>
                    <Th color={"orange.300"}>Tổng ghế</Th>
                    <Th color={"orange.300"}>Trạng thái</Th>
                    <Th color={"orange.300"}>Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedTheaters.map((theater) => (
                    <Tr key={theater._id} _hover={{ bg: "#252a38" }} transition="0.2s">
                      <Td>
                        <Text fontWeight="bold" fontSize="sm">
                          {theater.name || "N/A"}
                        </Text>
                      </Td>
                      <Td fontSize="sm">{theater.location || "N/A"}</Td>
                      <Td fontSize="sm" textAlign="center">{theater.rooms_count || 0}</Td>
                      <Td fontSize="sm" textAlign="center">{theater.total_seats || 0}</Td>
                      <Td>
                        <Badge colorScheme={theater.status === "active" ? "green" : "red"}>
                          {theater.status === "active" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<EditIcon />}
                            colorScheme={"blue"}
                            size="sm"
                            aria-label="Chỉnh sửa"
                            onClick={() => handleEditTheater(theater)}
                            _hover={{ transform: "scale(1.1)" }}
                            transition="0.2s"
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6}>
                <Text color="gray.400" fontSize="sm">
                  Hiển thị {startIndex + 1} -{" "}
                  {Math.min(startIndex + itemsPerPage, filteredTheaters.length)} /{" "}
                  {filteredTheaters.length}
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
                      return (
                        <Text key={page} color="gray.400">
                          ...
                        </Text>
                      );
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
            <ModalHeader>
              {selectedTheater ? "Chỉnh sửa rạp" : "Thêm rạp mới"}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tên rạp</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    bg="gray.800"
                    border="none"
                    placeholder="Nhập tên rạp..."
                  />
                </FormControl>

                <FormControl isRequired={!selectedTheater}>
                  <FormLabel>Địa điểm</FormLabel>
                  <Input
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    bg="gray.800"
                    border="none"
                    placeholder="Ví dụ: Hà Nội, HN"
                    isDisabled={!!selectedTheater}
                  />
                  {selectedTheater && (
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Không thể thay đổi địa điểm khi chỉnh sửa
                    </Text>
                  )}
                </FormControl>

                <Flex gap={3} w="100%" justify="flex-end" pt={4}>
                  <Button onClick={onClose} bg="gray.700" _hover={{ bg: "gray.600" }}>
                    Hủy
                  </Button>
                  <Button
                    colorScheme="orange"
                    onClick={handleSubmit}
                    isDisabled={!formData.name || (!selectedTheater && !formData.location)}
                  >
                    {selectedTheater ? "Cập nhật" : "Thêm"}
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

export default TheatersManagement;