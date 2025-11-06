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
} from "@chakra-ui/react";
import { ViewIcon, EditIcon, AddIcon, DeleteIcon, ArrowBackIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import Sidebar from "../Navbar/SidebarAdmin";
import { useNavigate, useSearchParams } from "react-router-dom";

const RoomsManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [theaterFilter, setTheaterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isStatusOpen, onOpen: onStatusOpen, onClose: onStatusClose } = useDisclosure();

  const [formData, setFormData] = useState({
    theater_id: "",
    name: "",
  });

  useEffect(() => {
    fetchTheaters();
  }, []);

  useEffect(() => {
    const theaterIdFromUrl = searchParams.get("theater");
    if (theaterIdFromUrl) {
      setTheaterFilter(theaterIdFromUrl);
      fetchRooms(theaterIdFromUrl);
    } else {
      fetchRooms();
    }
  }, [searchParams]);

  const fetchTheaters = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:5000/api/theaters/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ page: 1, pageSize: 100 })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || "Không thể tải danh sách rạp");
      }

      const data = await response.json();
      // nhiều backend trả { list: [...] } hoặc trực tiếp mảng hoặc { data: { list: [...] } }
      const list = data?.list || data?.data?.list || (Array.isArray(data) ? data : []);
      setTheaters(list);
    } catch (err) {
      console.error("Fetch theaters error:", err);
      setTheaters([]);
    }
  };

  const fetchRooms = async (theaterId = null) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const payload = {
        page: 1,
        pageSize: 100,
        orderBy: "created_at",
        orderDir: "DESC",
      };

      if (theaterId) {
        payload.theater_id = theaterId;
      }

      // IMPORTANT: backend collection endpoint uses /api/rooms/list (match API design used for theaters)
      const response = await fetch("http://localhost:5000/api/rooms/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Lỗi ${response.status}: Không thể tải phòng`);
      }

      const data = await response.json();
      // Hỗ trợ nhiều shape của response
      const list = data?.list || data?.data?.list || (Array.isArray(data) ? data : []);
      setRooms(list);
    } catch (err) {
      console.error("Fetch rooms error:", err);
      setRooms([]);
      toast({
        title: "Lỗi tải dữ liệu",
        description: err.message || "Dữ liệu không hợp lệ",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoom = () => {
    setSelectedRoom(null);
    const theaterIdFromUrl = searchParams.get("theater");
    setFormData({ 
      theater_id: theaterIdFromUrl || "", 
      name: "" 
    });
    onOpen();
  };

  const handleEditRoom = (room) => {
    setSelectedRoom(room);
    setFormData({
      theater_id: room.theater_id || "",
      name: room.name || "",
    });
    onOpen();
  };

  const handleViewRoom = (room) => {
    setSelectedRoom(room);
    onDetailOpen();
  };

  const handleStatusConfirm = (room) => {
    setSelectedRoom(room);
    onStatusOpen();
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = selectedRoom.status === "active" ? "inactive" : "active";
      
      const response = await fetch(`http://localhost:5000/api/rooms/${selectedRoom._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể cập nhật trạng thái");
      }

      toast({
        title: "Thành công",
        description: `Đã ${newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"} phòng`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      const theaterIdFromUrl = searchParams.get("theater");
      fetchRooms(theaterIdFromUrl);
      onStatusClose();
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

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        theater_id: formData.theater_id.trim(),
        name: formData.name.trim(),
      };

      if (selectedRoom) {
        delete payload.theater_id;
      }

      const url = selectedRoom
        ? `http://localhost:5000/api/rooms/${selectedRoom._id}`
        : "http://localhost:5000/api/rooms";

      const method = selectedRoom ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200 && response.status !== 201) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || "Không thể lưu phòng");
      }

      toast({
        title: "Thành công",
        description: selectedRoom ? "Đã cập nhật phòng" : "Đã thêm phòng mới",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      const theaterIdFromUrl = searchParams.get("theater");
      fetchRooms(theaterIdFromUrl);
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

  const filterAndSortRooms = () => {
    let filtered = [...rooms];

    if (searchName.trim()) {
      filtered = filtered.filter(
        (r) =>
          r.name?.toLowerCase().includes(searchName.toLowerCase()) ||
          r.theater_name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (theaterFilter !== "all") {
      filtered = filtered.filter((r) => r.theater_id === theaterFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((r) => r.status === statusFilter);
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

  const filteredRooms = filterAndSortRooms();
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRooms = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, theaterFilter, statusFilter, sortBy]);

  const selectedTheaterInfo = theaters.find(t => t._id === theaterFilter);

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      <Sidebar />
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={3}>
            <IconButton
              icon={<ArrowBackIcon />}
              colorScheme="gray"
              onClick={() => navigate("/admin/theaters")}
              aria-label="Quay lại"
            />
            <Box>
              <Heading color="orange.400">Quản lý Phòng Chiếu</Heading>
              {selectedTheaterInfo && (
                <Text fontSize="sm" color="gray.400" mt={1}>
                  Rạp: {selectedTheaterInfo.name} - {selectedTheaterInfo.location}
                </Text>
              )}
            </Box>
          </HStack>
          <Button leftIcon={<AddIcon />} colorScheme="orange" onClick={handleAddRoom}>
            Thêm phòng mới
          </Button>
        </Flex>

        <HStack spacing={4} mb={6} flexWrap="wrap">
          <Input
            placeholder="Tìm theo tên phòng..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            maxW="300px"
            bg="gray.800"
            color="white"
            border="none"
          />
          <Select
            value={theaterFilter}
            onChange={(e) => {
              setTheaterFilter(e.target.value);
              if (e.target.value === "all") {
                navigate("/admin/rooms");
                fetchRooms();
              } else {
                navigate(`/admin/rooms?theater=${e.target.value}`);
                fetchRooms(e.target.value);
              }
            }}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>Tất cả rạp</option>
            {theaters.map((theater) => (
              <option key={theater._id} value={theater._id} style={{ background: "#181a20", color: "#fff" }}>
                {theater.name} - {theater.location}
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
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>Tất cả trạng thái</option>
            <option value="active"style={{ background: "#181a20", color: "#fff" }}>Hoạt động</option>
            <option value="inactive" style={{ background: "#181a20", color: "#fff" }}>Không hoạt động</option>
          </Select>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="newest" style={{ background: "#181a20", color: "#fff" }}>Mới nhất</option>
            <option value="oldest" style={{ background: "#181a20", color: "#fff" }}>Cũ nhất</option>
            <option value="name_asc" style={{ background: "#181a20", color: "#fff" }}>Tên A-Z</option>
            <option value="name_desc" style={{ background: "#181a20", color: "#fff" }}>Tên Z-A</option>
          </Select>
        </HStack>

        <HStack spacing={4} mb={6}>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Tổng số phòng</Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.400">
              {rooms.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Kết quả lọc</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.400">
              {filteredRooms.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Đang hoạt động</Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.400">
              {rooms.filter((r) => r.status === "active").length}
            </Text>
          </Box>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="#ff8c00" />
          </Flex>
        ) : filteredRooms.length === 0 ? (
          <Flex justify="center" align="center" h="50vh" direction="column">
            <Text color="gray.400" fontSize="lg">
              {rooms.length === 0 ? "Chưa có phòng nào" : "Không tìm thấy kết quả"}
            </Text>
          </Flex>
        ) : (
          <>
            <Box bg="#1a1e29" borderRadius="2xl" p={6} overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg="#222633">
                  <Tr>
                    <Th color="orange.300">Tên phòng</Th>
                    <Th color="orange.300">Rạp</Th>
                    <Th color="orange.300">Số ghế</Th>
                    <Th color="orange.300">Trạng thái</Th>
                    <Th color="orange.300">Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedRooms.map((room) => (
                    <Tr key={room._id} _hover={{ bg: "#252a38" }}>
                      <Td>
                        <Text fontWeight="bold">{room.name || "N/A"}</Text>
                      </Td>
                      <Td>{room.theater_name || "N/A"}</Td>
                      <Td textAlign="center">
                        <Text fontWeight="bold" color="blue.400">
                          {room.total_seats || 0}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={room.status === "active" ? "green" : "red"}>
                          {room.status === "active" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                        </Badge>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<ViewIcon />}
                            colorScheme="green"
                            size="sm"
                            onClick={() => handleViewRoom(room)}
                          />
                          <IconButton
                            icon={<EditIcon />}
                            colorScheme="blue"
                            size="sm"
                            onClick={() => handleEditRoom(room)}
                          />
                          <IconButton
                            icon={room.status === "active" ? <CloseIcon /> : <CheckIcon />}
                            colorScheme={room.status === "active" ? "red" : "green"}
                            size="sm"
                            onClick={() => handleStatusConfirm(room)}
                            title={room.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </Box>

            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6}>
                <Text color="gray.400" fontSize="sm">
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredRooms.length)} / {filteredRooms.length}
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    bg="#23242a"
                    color="white"
                  >
                    Trước
                  </Button>
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
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
            <ModalHeader>{selectedRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                {!selectedRoom && (
                  <FormControl isRequired>
                    <FormLabel>Rạp chiếu</FormLabel>
                    <Select
                      value={formData.theater_id}
                      onChange={(e) => setFormData({ ...formData, theater_id: e.target.value })}
                      bg="gray.800"
                      placeholder="Chọn rạp..."
                    >
                      {theaters.map((theater) => (
                        <option key={theater._id} value={theater._id}>
                          {theater.name} - {theater.location}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}

                {selectedRoom && (
                  <FormControl>
                    <FormLabel>Rạp chiếu</FormLabel>
                    <Input value={selectedRoom.theater_name || "N/A"} bg="gray.800" isDisabled />
                    <Text fontSize="xs" color="gray.500" mt={1}>
                      Không thể thay đổi rạp khi chỉnh sửa
                    </Text>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Tên phòng</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    bg="gray.800"
                    placeholder="Nhập tên phòng..."
                  />
                </FormControl>

                <Flex gap={3} w="100%" justify="flex-end" pt={4}>
                  <Button onClick={onClose} bg="gray.700">Hủy</Button>
                  <Button
                    colorScheme="orange"
                    onClick={handleSubmit}
                    isDisabled={!formData.name || (!selectedRoom && !formData.theater_id)}
                  >
                    {selectedRoom ? "Cập nhật" : "Thêm"}
                  </Button>
                </Flex>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Detail Modal */}
        <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="2xl">
          <ModalOverlay />
          <ModalContent bg="#1a1e29" color="white">
            <ModalHeader>Chi tiết phòng: {selectedRoom?.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={6} align="stretch">
                <Box>
                  <Heading size="sm" color="orange.400" mb={3}>Thông tin cơ bản</Heading>
                  <SimpleGrid columns={2} spacing={4}>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Tên phòng</Text>
                      <Text fontWeight="bold">{selectedRoom?.name}</Text>
                    </Box>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Rạp chiếu</Text>
                      <Text fontWeight="bold">{selectedRoom?.theater_name}</Text>
                    </Box>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Tổng số ghế</Text>
                      <Text fontWeight="bold" fontSize="2xl" color="blue.400">
                        {selectedRoom?.total_seats || 0}
                      </Text>
                    </Box>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Ghế đã đặt</Text>
                      <Text fontWeight="bold" fontSize="2xl" color="orange.400">
                        {selectedRoom?.booked_seats || 0}
                      </Text>
                    </Box>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Ghế còn trống</Text>
                      <Text fontWeight="bold" fontSize="2xl" color="green.400">
                        {(selectedRoom?.total_seats || 0) - (selectedRoom?.booked_seats || 0)}
                      </Text>
                    </Box>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Tỷ lệ lấp đầy</Text>
                      <Text fontWeight="bold" fontSize="2xl" color="purple.400">
                        {selectedRoom?.total_seats > 0 
                          ? Math.round((selectedRoom?.booked_seats || 0) / selectedRoom.total_seats * 100)
                          : 0}%
                      </Text>
                    </Box>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Trạng thái</Text>
                      <Badge colorScheme={selectedRoom?.status === "active" ? "green" : "red"} fontSize="sm" px={3} py={1}>
                        {selectedRoom?.status === "active" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                      </Badge>
                    </Box>
                  </SimpleGrid>
                </Box>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>

        {/* Status Update Modal */}
        <Modal isOpen={isStatusOpen} onClose={onStatusClose} size="md">
          <ModalOverlay />
          <ModalContent bg="#1a1e29" color="white">
            <ModalHeader>Xác nhận thay đổi trạng thái</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <Text>
                Bạn có chắc muốn {selectedRoom?.status === "active" ? "vô hiệu hóa" : "kích hoạt"} phòng <strong>{selectedRoom?.name}</strong>?
              </Text>
              {selectedRoom?.status === "active" && (
                <Text color="orange.400" fontSize="sm" mt={2}>
                  Lưu ý: Phòng sẽ không thể đặt vé khi bị vô hiệu hóa!
                </Text>
              )}
              <Flex gap={3} justify="flex-end" mt={6}>
                <Button onClick={onStatusClose} bg="gray.700">Hủy</Button>
                <Button 
                  colorScheme={selectedRoom?.status === "active" ? "red" : "green"} 
                  onClick={handleUpdateStatus}
                >
                  {selectedRoom?.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
                </Button>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};

export default RoomsManagement;