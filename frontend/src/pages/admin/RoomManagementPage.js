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
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  VStack,
  SimpleGrid,
} from "@chakra-ui/react";
import { ViewIcon, EditIcon, AddIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
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
  const [creatingSeats, setCreatingSeats] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isStatusOpen, onOpen: onStatusOpen, onClose: onStatusClose } = useDisclosure();
  const { isOpen: isSeatOpen, onOpen: onSeatOpen, onClose: onSeatClose } = useDisclosure();

  // State cho thêm ghế
  const [seatSegments, setSeatSegments] = useState([]);
  const [seatMatrix, setSeatMatrix] = useState({});

  const [formData, setFormData] = useState({
    theater_id: "",
    name: "",
    status: "active"
  });

  // Helper function để lấy ID
  const getId = (obj) => obj?.id || obj?._id || "";

  // Xây dựng ma trận ghế từ segments
  const buildSeatMatrix = (segments) => {
    const map = {};
    if (!Array.isArray(segments) || segments.length === 0) return map;

    const maxPerRow = Math.max(...segments.map(s => parseInt(s.seatsPerRow || 0, 10)), 0);

    segments.forEach((seg) => {
      const start = String(seg.startRow || "A").trim().toUpperCase().charAt(0);
      const end = String(seg.endRow || start).trim().toUpperCase().charAt(0);
      const from = Math.min(start.charCodeAt(0), end.charCodeAt(0));
      const to = Math.max(start.charCodeAt(0), end.charCodeAt(0));
      const per = Math.max(0, parseInt(seg.seatsPerRow, 10) || 0);
      const type = String(seg.type || "normal");
      const price = Number(seg.base_price || 0);

      for (let r = from; r <= to; r++) {
        const row = String.fromCharCode(r);
        if (!map[row]) {
          map[row] = new Array(Math.max(per, maxPerRow)).fill(null).map((_, i) => ({
            seat_number: `${row}${i+1}`,
            type: "normal",
            base_price: 0,
          }));
        }
        for (let i = 0; i < per; i++) {
          map[row][i] = {
            seat_number: `${row}${i+1}`,
            type,
            base_price: Math.floor(price),
          };
        }
      }
    });
    return map;
  };

  // Cập nhật ma trận khi segments thay đổi
  useEffect(() => {
    setSeatMatrix(buildSeatMatrix(seatSegments));
  }, [seatSegments]);

  // Toggle loại ghế khi click (chỉ 2 loại: normal và vip)
  const toggleSeatType = (row, idx) => {
    setSeatMatrix(prev => {
      const next = { ...prev };
      if (!next[row] || !next[row][idx]) return prev;
      const current = next[row][idx].type || "normal";
      const newType = current === "normal" ? "vip" : "normal";
      next[row] = [...next[row]];
      next[row][idx] = { ...next[row][idx], type: newType };
      return next;
    });
  };

  // Chuyển ma trận thành mảng ghế
  const flattenMatrixToSeats = (matrix) => {
    const map = new Map();
    Object.keys(matrix).forEach(row => {
      (matrix[row] || []).forEach((s) => {
        if (!s || !s.seat_number) return;
        map.set(String(s.seat_number), {
          seat_number: String(s.seat_number),
          type: String(s.type || "normal"),
          base_price: Number(s.base_price || 0),
        });
      });
    });
    return Array.from(map.values());
  };

  // Mở modal thêm ghế
  const openSeatModal = (room) => {
    setSelectedRoom(room);
    setSeatSegments([
      { startRow: "A", endRow: "A", seatsPerRow: 8, type: "normal", base_price: 50000 },
    ]);
    onSeatOpen();
  };

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
      const response = await fetch("http://localhost:5000/api/public/theaters/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page: 1, pageSize: 100 })
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || "Không thể tải danh sách rạp");
      }

      const data = await response.json();
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
      const roomId = getId(selectedRoom);
      if (!roomId) throw new Error("Room ID không hợp lệ");

      const newStatus = selectedRoom.status === "active" ? "inactive" : "active";

      const response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Lỗi ${response.status}: Không thể cập nhật trạng thái`);
      }

      const resData = await response.json().catch(() => ({}));
      if (resData.success === false) throw new Error(resData.message || "Không thể cập nhật trạng thái");

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
        description: err.message || "Đổi trạng thái thất bại",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("token");

      if (!formData.name?.trim()) {
        throw new Error("Vui lòng nhập tên phòng");
      }
      
      if (!selectedRoom && !formData.theater_id) {
        throw new Error("Vui lòng chọn rạp");
      }

      let response;
      
      if (selectedRoom) {
        const roomId = getId(selectedRoom);
        if (!roomId) throw new Error("Room ID không hợp lệ");

        const payload = {
          name: formData.name.trim()
        };

        response = await fetch(`http://localhost:5000/api/rooms/${roomId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        const theaterId = formData.theater_id?.trim();
        
        if (!theaterId) {
          throw new Error("Vui lòng chọn rạp");
        }

        const theaterExists = theaters.find(t => getId(t) === theaterId);
        if (!theaterExists) {
          throw new Error("Rạp được chọn không hợp lệ");
        }

        const payload = {
          theater_id: theaterId,
          name: formData.name.trim(),
        };

        response = await fetch("http://localhost:5000/api/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      }

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(responseData.message || `Không thể ${selectedRoom ? 'cập nhật' : 'tạo'} phòng`);
      }

      toast({
        title: "Thành công",
        description: selectedRoom ? "Đã cập nhật phòng" : "Đã tạo phòng mới",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
      const theaterIdFromUrl = searchParams.get("theater");
      fetchRooms(theaterIdFromUrl);
      
    } catch (err) {
      console.error("Submit room error:", err);
      toast({
        title: "Lỗi",
        description: err.message || `${selectedRoom ? 'Cập nhật' : 'Tạo'} phòng thất bại`,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  };

  const handleCreateSeats = async () => {
    try {
      const token = localStorage.getItem("token");
      const roomId = String(getId(selectedRoom || "") || "").trim();
      
      if (!roomId) {
        toast({
          title: "Lỗi",
          description: "Vui lòng chọn phòng trước khi thêm ghế",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Lấy danh sách ghế từ ma trận
      const seats = flattenMatrixToSeats(seatMatrix);
      
      if (!Array.isArray(seats) || seats.length === 0) {
        throw new Error("Không có ghế để tạo");
      }

      if (seats.length > 2000) {
        throw new Error("Số ghế quá lớn (tối đa 2000)");
      }

      setCreatingSeats(true);

      const payload = {
        room_id: roomId,
        seats: seats.map((s) => ({
          seat_number: String(s.seat_number),
          type: String(s.type),
          base_price: Number(s.base_price),
        })),
      };

      const res = await fetch("http://localhost:5000/api/seats/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || "Tạo ghế thất bại");

      toast({
        title: "Thành công",
        description: `Đã tạo ${payload.seats.length} ghế cho phòng ${selectedRoom?.name || ""}`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onSeatClose();
      const theaterIdFromUrl = searchParams.get("theater");
      fetchRooms(theaterIdFromUrl);
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err.message || "Tạo ghế thất bại",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setCreatingSeats(false);
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

  const selectedTheaterInfo = theaters.find(t => getId(t) === theaterFilter);

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      <Sidebar />
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <HStack spacing={3}>
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
            {theaters.map((theater) => {
              const theaterId = getId(theater);
              return (
                <option key={theaterId} value={theaterId} style={{ background: "#181a20", color: "#fff" }}>
                  {theater.name} - {theater.location}
                </option>
              );
            })}
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
                    <Tr key={getId(room)} _hover={{ bg: "#252a38" }}>
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
                          <Button 
                            size="sm" 
                            colorScheme="orange" 
                            onClick={() => openSeatModal(room)}
                          >
                            Thêm ghế
                          </Button>
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
          <ModalContent style={{ background: "#181a20", color: "#fff" }}>
            <ModalHeader>{selectedRoom ? "Chỉnh sửa phòng" : "Thêm phòng mới"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                {!selectedRoom && (
                  <FormControl isRequired>
                    <FormLabel>Rạp chiếu</FormLabel>
                    <Select
                      placeholder="Chọn rạp"
                      value={formData.theater_id}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData,
                          theater_id: e.target.value
                        });
                      }}
                      bg="gray.800"
                      isRequired
                    >
                      {theaters
                        .filter(t => t.status === "active")
                        .map((theater) => {
                          const theaterId = getId(theater);
                          return (
                            <option 
                              key={theaterId}
                              value={theaterId}
                              style={{ background: "#181a20", color: "#fff" }}
                            >
                              {theater.name} - {theater.location}
                            </option>
                          );
                        })}
                    </Select>
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

        {/* Seat Modal */}
        <Modal isOpen={isSeatOpen} onClose={onSeatClose} size="4xl">
          <ModalOverlay />
          <ModalContent bg="#1a1e29" color="white">
            <ModalHeader>Thêm ghế cho phòng: {selectedRoom?.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <VStack spacing={4} align="stretch">
                {/* Danh sách segments */}
                {seatSegments.map((seg, idx) => (
                  <Box key={idx} bg="gray.800" p={3} borderRadius="md">
                    <HStack spacing={3} flexWrap="wrap">
                      <FormControl maxW="100px">
                        <FormLabel fontSize="sm">Hàng đầu</FormLabel>
                        <Input 
                          value={seg.startRow} 
                          onChange={(e) => {
                            const v = e.target.value.toUpperCase().slice(0,1);
                            setSeatSegments(prev => prev.map((p,i) => i===idx ? { ...p, startRow: v } : p));
                          }} 
                          bg="gray.700"
                          size="sm"
                        />
                      </FormControl>
                      <FormControl maxW="100px">
                        <FormLabel fontSize="sm">Hàng cuối</FormLabel>
                        <Input 
                          value={seg.endRow} 
                          onChange={(e) => {
                            const v = e.target.value.toUpperCase().slice(0,1);
                            setSeatSegments(prev => prev.map((p,i) => i===idx ? { ...p, endRow: v } : p));
                          }} 
                          bg="gray.700"
                          size="sm"
                        />
                      </FormControl>
                      <FormControl maxW="120px">
                        <FormLabel fontSize="sm">Ghế/hàng</FormLabel>
                        <Input 
                          type="number" 
                          min={1} 
                          value={seg.seatsPerRow}
                          onChange={(e) => setSeatSegments(prev => prev.map((p,i) => i===idx ? { ...p, seatsPerRow: Number(e.target.value) } : p))}
                          bg="gray.700"
                          size="sm"
                        />
                      </FormControl>
                      <FormControl maxW="120px">
                        <FormLabel fontSize="sm">Loại</FormLabel>
                        <Select 
                          value={seg.type} 
                          onChange={(e) => setSeatSegments(prev => prev.map((p,i) => i===idx ? { ...p, type: e.target.value } : p))} 
                          bg="gray.700"
                          size="sm"
                        >
                          <option value="normal">Thường</option>
                          <option value="vip">VIP</option>
                        </Select>
                      </FormControl>
                      <FormControl maxW="140px">
                        <FormLabel fontSize="sm">Giá cơ bản</FormLabel>
                        <Input 
                          type="number" 
                          value={seg.base_price}
                          onChange={(e) => setSeatSegments(prev => prev.map((p,i) => i===idx ? { ...p, base_price: Number(e.target.value) } : p))}
                          bg="gray.700"
                          size="sm"
                        />
                      </FormControl>
                      <Button 
                        colorScheme="red" 
                        size="sm"
                        onClick={() => setSeatSegments(prev => prev.filter((_,i) => i!==idx))}
                      >
                        Xóa
                      </Button>
                    </HStack>
                  </Box>
                ))}

                {/* Nút thêm segment */}
                <HStack spacing={2}>
                  <Button 
                    size="sm" 
                    colorScheme="orange" 
                    onClick={() => setSeatSegments(prev => [...prev, { startRow: "A", endRow: "A", seatsPerRow: 8, type: "normal", base_price: 50000 }])}
                  >
                    + Thêm đoạn Thường
                  </Button>
                  <Button 
                    size="sm" 
                    colorScheme="purple" 
                    onClick={() => setSeatSegments(prev => [...prev, { startRow: "A", endRow: "A", seatsPerRow: 8, type: "vip", base_price: 80000 }])}
                  >
                    + Thêm đoạn VIP
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => setSeatSegments([])}
                  >
                    Reset
                  </Button>
                </HStack>

                {/* Preview tổng số ghế */}
                <Text fontSize="sm" color="gray.400">
                  Tổng ghế: <strong>{flattenMatrixToSeats(seatMatrix).length}</strong> ghế
                </Text>

                {/* Hiển thị lưới ghế */}
                <Box mt={3} maxH="400px" overflowY="auto" p={3} bg="gray.900" borderRadius="md">
                  {Object.keys(seatMatrix).length === 0 ? (
                    <Text color="gray.500" fontSize="sm" textAlign="center">
                      Chưa có ghế để preview. Vui lòng thêm đoạn ghế ở trên.
                    </Text>
                  ) : (
                    <VStack spacing={2} align="stretch">
                      {Object.keys(seatMatrix).sort().map(row => (
                        <HStack key={row} spacing={2} justify="center" align="center">
                          <Text w="30px" textAlign="center" fontWeight="bold" color="orange.400">
                            {row}
                          </Text>
                          {(seatMatrix[row] || []).map((cell, idx) => {
  const type = String(cell?.type || "normal").toLowerCase();
  const bgColor = type === "vip" ? "purple.600" : "gray.700";
  const borderColor = type === "vip" ? "rgba(139,92,246,0.25)" : "rgba(255,255,255,0.06)";
  return (
    <Box
      key={`${row}-${idx}`}
      minW="40px"
      minH="34px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg={bgColor}
      color="white"
      borderRadius="6px"
      border={`1px solid ${borderColor}`}
      fontSize="sm"
      userSelect="none"
    >
      {idx + 1}
    </Box>
  );
})}
                        </HStack>
                      ))}
                    </VStack>
                  )}
                </Box>

                {/* Chú thích */}
                <HStack spacing={4} justify="center" pt={2}>
                  <HStack>
                    <Box w="20px" h="20px" bg="gray.500" borderRadius="sm"></Box>
                    <Text fontSize="sm">Thường</Text>
                  </HStack>
                  <HStack>
                    <Box w="20px" h="20px" bg="purple.500" borderRadius="sm"></Box>
                    <Text fontSize="sm">VIP</Text>
                  </HStack>
                </HStack>
              </VStack>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onSeatClose} mr={3}>Hủy</Button>
              <Button 
                colorScheme="orange" 
                onClick={handleCreateSeats} 
                isLoading={creatingSeats}
                isDisabled={flattenMatrixToSeats(seatMatrix).length === 0}
              >
                Tạo {flattenMatrixToSeats(seatMatrix).length} ghế
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};

export default RoomsManagement;