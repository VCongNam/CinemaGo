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
  Textarea,
  Image,
  SimpleGrid,
} from "@chakra-ui/react";
import { ViewIcon, EditIcon, AddIcon, CheckIcon, CloseIcon } from "@chakra-ui/icons";
import SidebarAdmin from "../Navbar/SidebarAdmin";
import SidebarStaff from "../Navbar/SidebarStaff";

const CombosManagement = () => {
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchName, setSearchName] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedCombo, setSelectedCombo] = useState(null);
  const toast = useToast();
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isStatusOpen, onOpen: onStatusOpen, onClose: onStatusClose } = useDisclosure();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
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
    fetchCombos();
  }, []);

  const fetchCombos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://localhost:5000/api/combos/all", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Không thể tải dữ liệu combo");
      }

      const data = await response.json();
      
      if (data.data && Array.isArray(data.data)) {
        setCombos(data.data);
      } else if (Array.isArray(data)) {
        setCombos(data);
      } else {
        setCombos([]);
      }
    } catch (err) {
      console.error("Fetch combos error:", err);
      setCombos([]);
      toast({
        title: "Lỗi tải dữ liệu",
        description: err.message,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCombo = () => {
    setSelectedCombo(null);
    setFormData({
      name: "",
      description: "",
      price: "",
      image_url: "",
    });
    onOpen();
  };

  const handleEditCombo = (combo) => {
    setSelectedCombo(combo);
    setFormData({
      name: combo.name || "",
      description: combo.description || "",
      price: combo.price || "",
      image_url: combo.image_url || "",
    });
    onOpen();
  };

  const handleViewCombo = (combo) => {
    setSelectedCombo(combo);
    onDetailOpen();
  };

  const handleStatusConfirm = (combo) => {
    setSelectedCombo(combo);
    onStatusOpen();
  };

  const handleUpdateStatus = async () => {
    try {
      const token = localStorage.getItem("token");
      const newStatus = selectedCombo.status === "active" ? "inactive" : "active";
      
      const response = await fetch(`http://localhost:5000/api/combos/${selectedCombo._id}/status`, {
        method: "PATCH",
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
        description: `Đã ${newStatus === "active" ? "kích hoạt" : "vô hiệu hóa"} combo`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchCombos();
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
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        image_url: formData.image_url.trim(),
      };

      const url = selectedCombo
        ? `http://localhost:5000/api/combos/${selectedCombo._id}`
        : "http://localhost:5000/api/combos";

      const method = selectedCombo ? "PUT" : "POST";

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
        throw new Error(errData.message || "Không thể lưu combo");
      }

      toast({
        title: "Thành công",
        description: selectedCombo ? "Đã cập nhật combo" : "Đã thêm combo mới",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      fetchCombos();
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

  const filterAndSortCombos = () => {
    let filtered = [...combos];

    if (searchName.trim()) {
      filtered = filtered.filter((c) =>
        c.name?.toLowerCase().includes(searchName.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((c) => c.status === statusFilter);
    }

    filtered.sort((a, b) => {
      switch (sortBy) {
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

  const filteredCombos = filterAndSortCombos();
  const totalPages = Math.ceil(filteredCombos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCombos = filteredCombos.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, statusFilter, sortBy]);

  const formatPrice = (price) => {
    if (!price) return "0đ";
    const numericPrice = typeof price === 'object' && price.$numberDecimal 
      ? parseFloat(price.$numberDecimal) 
      : parseFloat(price);
    
    if (isNaN(numericPrice)) return "0đ";
    return Math.round(numericPrice).toLocaleString("vi-VN") + "đ";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "Invalid Date";
    
    // Nếu dateStr là object với vietnamFormatted (format: "13:57:57 13/11/2025")
    if (typeof dateStr === 'object' && dateStr.vietnamFormatted) {
      // Tách lấy phần ngày (bỏ phần giờ)
      const parts = dateStr.vietnamFormatted.split(' ');
      return parts.length > 1 ? parts[1] : dateStr.vietnamFormatted;
    }
    
    // Nếu dateStr là object với vietnam hoặc utc
    const dateValue = (typeof dateStr === 'object' && (dateStr.vietnam || dateStr.utc)) || dateStr;
    
    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "Invalid Date";
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  };

  return (
    <Flex minH="100vh" bg="#181a20" color="white">
      {isAdmin ? <SidebarAdmin /> : <SidebarStaff />}
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading color="orange.400">Quản lý Combo</Heading>
          <Button leftIcon={<AddIcon />} colorScheme="orange" onClick={handleAddCombo}>
            Thêm combo mới
          </Button>
        </Flex>

        {/* Filters */}
        <HStack spacing={4} mb={6} flexWrap="wrap">
          <Input
            placeholder="Tìm theo tên combo..."
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            maxW="300px"
            bg="gray.800"
            color="white"
            border="none"
          />
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>Tất cả trạng thái</option>
            <option value="active" style={{ background: "#181a20", color: "#fff" }}>Hoạt động</option>
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

        {/* Statistics */}
        <HStack spacing={4} mb={6}>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Tổng số combo</Text>
            <Text fontSize="2xl" fontWeight="bold" color="orange.400">
              {combos.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Kết quả lọc</Text>
            <Text fontSize="2xl" fontWeight="bold" color="green.400">
              {filteredCombos.length}
            </Text>
          </Box>
          <Box bg="#1a1e29" p={4} borderRadius="lg" flex="1">
            <Text fontSize="sm" color="gray.400">Đang hoạt động</Text>
            <Text fontSize="2xl" fontWeight="bold" color="purple.400">
              {combos.filter((c) => c.status === "active").length}
            </Text>
          </Box>
        </HStack>

        {loading ? (
          <Flex justify="center" align="center" h="50vh">
            <Spinner size="xl" color="#ff8c00" />
          </Flex>
        ) : filteredCombos.length === 0 ? (
          <Flex justify="center" align="center" h="50vh" direction="column">
            <Text color="gray.400" fontSize="lg">
              {combos.length === 0 ? "Chưa có combo nào" : "Không tìm thấy kết quả"}
            </Text>
          </Flex>
        ) : (
          <>
            <Box bg="#1a1e29" borderRadius="2xl" p={6} overflowX="auto">
              <Table variant="simple" size="sm">
                <Thead bg="#222633">
                  <Tr>
                    <Th color="orange.300">Hình ảnh</Th>
                    <Th color="orange.300">Tên combo</Th>
                    <Th color="orange.300">Mô tả</Th>
                    <Th color="orange.300">Giá</Th>
                    <Th color="orange.300">Trạng thái</Th>
                    <Th color="orange.300">Ngày tạo</Th>
                    <Th color="orange.300">Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedCombos.map((combo) => (
                    <Tr key={combo._id} _hover={{ bg: "#252a38" }}>
                      <Td>
                        <Image
                          src={combo.image_url}
                          alt={combo.name}
                          boxSize="50px"
                          objectFit="cover"
                          borderRadius="md"
                          fallbackSrc="https://via.placeholder.com/50"
                        />
                      </Td>
                      <Td>
                        <Text fontWeight="bold">{combo.name || "N/A"}</Text>
                      </Td>
                      <Td maxW="200px">
                        <Text noOfLines={2} fontSize="sm" color="gray.300">
                          {combo.description || "N/A"}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontWeight="bold" color="green.400">
                          {formatPrice(combo.price || 0)}
                        </Text>
                      </Td>
                      <Td>
                        <Badge colorScheme={combo.status === "active" ? "green" : "red"}>
                          {combo.status === "active" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                        </Badge>
                      </Td>
                      <Td>{formatDate(combo.created_at)}</Td>
                      <Td>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<ViewIcon />}
                            colorScheme="green"
                            size="sm"
                            onClick={() => handleViewCombo(combo)}
                          />
                          <IconButton
                            icon={<EditIcon />}
                            colorScheme="blue"
                            size="sm"
                            onClick={() => handleEditCombo(combo)}
                          />
                          <IconButton
                            icon={combo.status === "active" ? <CloseIcon /> : <CheckIcon />}
                            colorScheme={combo.status === "active" ? "red" : "green"}
                            size="sm"
                            onClick={() => handleStatusConfirm(combo)}
                            title={combo.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
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
                  Hiển thị {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredCombos.length)} / {filteredCombos.length}
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
            <ModalHeader>{selectedCombo ? "Chỉnh sửa combo" : "Thêm combo mới"}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl isRequired>
                  <FormLabel>Tên combo</FormLabel>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    bg="gray.800"
                    placeholder="Nhập tên combo..."
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Mô tả</FormLabel>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    bg="gray.800"
                    placeholder="Nhập mô tả..."
                    rows={3}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Giá (VNĐ)</FormLabel>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    bg="gray.800"
                    placeholder="Nhập giá..."
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>URL hình ảnh</FormLabel>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    bg="gray.800"
                    placeholder="https://..."
                  />
                </FormControl>

                {formData.image_url && (
                  <Box w="100%">
                    <Text fontSize="sm" color="gray.400" mb={2}>Xem trước:</Text>
                    <Image
                      src={formData.image_url}
                      alt="Preview"
                      maxH="200px"
                      objectFit="cover"
                      borderRadius="md"
                      fallbackSrc="https://via.placeholder.com/200"
                    />
                  </Box>
                )}

                <Flex gap={3} w="100%" justify="flex-end" pt={4}>
                  <Button onClick={onClose} bg="gray.700">Hủy</Button>
                  <Button
                    colorScheme="orange"
                    onClick={handleSubmit}
                    isDisabled={!formData.name || !formData.description || !formData.price || !formData.image_url}
                  >
                    {selectedCombo ? "Cập nhật" : "Thêm"}
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
            <ModalHeader>Chi tiết combo: {selectedCombo?.name}</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={6} align="stretch">
                <Flex gap={6}>
                  <Image
                    src={selectedCombo?.image_url}
                    alt={selectedCombo?.name}
                    boxSize="200px"
                    objectFit="cover"
                    borderRadius="md"
                    fallbackSrc="https://via.placeholder.com/200"
                  />
                  <VStack align="stretch" flex="1" spacing={4}>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Tên combo</Text>
                      <Text fontWeight="bold" fontSize="lg">{selectedCombo?.name}</Text>
                    </Box>
                    <Box bg="gray.800" p={4} borderRadius="md">
                      <Text fontSize="xs" color="gray.400" mb={1}>Giá</Text>
                      <Text fontWeight="bold" fontSize="2xl" color="green.400">
                        {formatPrice(selectedCombo?.price || 0)}
                      </Text>
                    </Box>
                  </VStack>
                </Flex>

                <SimpleGrid columns={2} spacing={4}>
                  <Box bg="gray.800" p={4} borderRadius="md">
                    <Text fontSize="xs" color="gray.400" mb={1}>Trạng thái</Text>
                    <Badge colorScheme={selectedCombo?.status === "active" ? "green" : "red"} fontSize="sm" px={3} py={1}>
                      {selectedCombo?.status === "active" ? "HOẠT ĐỘNG" : "KHÔNG HOẠT ĐỘNG"}
                    </Badge>
                  </Box>
                  <Box bg="gray.800" p={4} borderRadius="md">
                    <Text fontSize="xs" color="gray.400" mb={1}>Ngày tạo</Text>
                    <Text fontWeight="bold">{formatDate(selectedCombo?.created_at)}</Text>
                  </Box>
                </SimpleGrid>

                <Box bg="gray.800" p={4} borderRadius="md">
                  <Text fontSize="xs" color="gray.400" mb={2}>Mô tả</Text>
                  <Text>{selectedCombo?.description}</Text>
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
                Bạn có chắc muốn {selectedCombo?.status === "active" ? "vô hiệu hóa" : "kích hoạt"} combo <strong>{selectedCombo?.name}</strong>?
              </Text>
              {selectedCombo?.status === "active" && (
                <Text color="orange.400" fontSize="sm" mt={2}>
                  Lưu ý: Combo sẽ không hiển thị cho khách hàng khi bị vô hiệu hóa!
                </Text>
              )}
              <Flex gap={3} justify="flex-end" mt={6}>
                <Button onClick={onStatusClose} bg="gray.700">Hủy</Button>
                <Button 
                  colorScheme={selectedCombo?.status === "active" ? "red" : "green"} 
                  onClick={handleUpdateStatus}
                >
                  {selectedCombo?.status === "active" ? "Vô hiệu hóa" : "Kích hoạt"}
                </Button>
              </Flex>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  );
};

export default CombosManagement;