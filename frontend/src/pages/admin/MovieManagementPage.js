import { useEffect, useState } from "react"
import {
  Box,
  Heading,
  Button,
  Spinner,
  Text,
  Flex,
  HStack,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  TableContainer,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Input,
} from "@chakra-ui/react"
import Sidebar from "../Navbar/Sidebar"

export default function MovieManagementPage() {
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddOpen, setAddOpen] = useState(false)
  const [newShowtime, setNewShowtime] = useState({
    movie_id: "",
    room_id: "",
    date: "",
    time: "",
  })
  const [adding, setAdding] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const toast = useToast()

  // 🔹 Lấy danh sách suất chiếu
  const fetchShowtimes = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://localhost:5000/api/showtimes", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      if (!res.ok) throw new Error("Không thể tải danh sách suất chiếu.")
      const data = await res.json()
      
      // Sắp xếp theo thời gian mới nhất
      const sortedData = (data.data || []).sort((a, b) => {
        return new Date(b.start_time.utc) - new Date(a.start_time.utc)
      })
      
      setShowtimes(sortedData)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // 🔹 Lấy danh sách phim và phòng
  const fetchMoviesAndRooms = async () => {
    const token = localStorage.getItem("token")
    try {
      // Fetch movies
      const movieRes = await fetch("http://localhost:5000/api/movies", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      
      if (movieRes.ok) {
        const movieData = await movieRes.json()
        console.log("🎬 Movies data:", movieData)
        setMovies(movieData.data || [])
      } else {
        console.error("❌ Failed to fetch movies:", movieRes.status)
      }

      // Fetch rooms - thử endpoint khác
      const roomRes = await fetch("http://localhost:5000/api/all-room", {
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      })
      
      if (roomRes.ok) {
        const roomData = await roomRes.json()
        console.log("🏠 Rooms data:", roomData)
        // API có thể trả về data hoặc list
        setRooms(roomData.data || roomData.list || roomData || [])
      } else {
        console.error("❌ Failed to fetch rooms:", roomRes.status)
        toast({
          title: "Không thể tải danh sách phòng",
          description: "Vui lòng kiểm tra kết nối API",
          status: "warning",
          duration: 3000
        })
      }
    } catch (err) {
      console.error("❌ Lỗi tải phim hoặc phòng:", err)
      toast({
        title: "Lỗi tải dữ liệu",
        description: err.message,
        status: "error",
        duration: 3000
      })
    }
  }

  useEffect(() => {
    fetchShowtimes()
    fetchMoviesAndRooms()
  }, [])

  // 🔹 Mở / đóng modal thêm suất chiếu
  const openAdd = () => setAddOpen(true)
  const closeAdd = () => {
    setAddOpen(false)
    setNewShowtime({
      movie_id: "",
      room_id: "",
      date: "",
      time: "",
    })
  }

  // 🔹 Thêm suất chiếu mới
  const addShowtime = async () => {
    // Validate input
    if (!newShowtime.movie_id || !newShowtime.room_id || !newShowtime.date || !newShowtime.time) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng điền đầy đủ thông tin", 
        status: "error" 
      })
      return
    }

    setAdding(true)
    const token = localStorage.getItem("token")
    
    // 🔹 Log data trước khi gửi để debug
    const payload = {
      movie_id: newShowtime.movie_id,
      room_id: newShowtime.room_id,
      date: newShowtime.date,
      time: newShowtime.time,
    }
    
    console.log("📤 Payload gửi đi:", payload)
    console.log("📝 movie_id:", payload.movie_id)
    console.log("📝 room_id:", payload.room_id)
    
    try {
      const res = await fetch("http://localhost:5000/api/showtimes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        console.error("❌ API Error:", err)
        throw new Error(err.message || "Không thể thêm suất chiếu.")
      }
      
      const result = await res.json()
      console.log("✅ Thêm suất chiếu thành công:", result)
      
      toast({ 
        title: "Thêm suất chiếu thành công!", 
        status: "success",
        duration: 3000 
      })
      
      fetchShowtimes()
      closeAdd()
    } catch (err) {
      console.error("❌ Lỗi thêm suất chiếu:", err)
      toast({ 
        title: "Lỗi", 
        description: err.message, 
        status: "error",
        duration: 5000 
      })
    } finally {
      setAdding(false)
    }
  }

  // 🔹 Tính trạng thái suất chiếu (dựa vào end_time)
  const getStatus = (showtime) => {
    if (!showtime?.end_time?.utc) {
      return { label: "Không xác định", color: "gray.400" }
    }
    
    const now = new Date()
    const startTime = new Date(showtime.start_time.utc)
    const endTime = new Date(showtime.end_time.utc)
    
    if (now < startTime) {
      return { label: "Sắp chiếu", color: "blue.400" }
    }
    
    if (now >= startTime && now <= endTime) {
      return { label: "Đang chiếu", color: "green.400" }
    }
    
    return { label: "Đã kết thúc", color: "gray.500" }
  }

  // 🔹 Format ngày giờ hiển thị
  const formatDateTime = (showtime) => {
    if (!showtime?.start_time?.vietnamFormatted) {
      return "Không xác định"
    }
    
    // Lấy ngày và giờ từ vietnamFormatted
    // Format: "01:56:53 22/10/2025"
    const parts = showtime.start_time.vietnamFormatted.split(" ")
    const time = parts[0] // HH:mm:ss
    const date = parts[1] // DD/MM/YYYY
    
    // Chỉ lấy HH:mm (bỏ giây)
    const shortTime = time.split(":").slice(0, 2).join(":")
    
    return `${date} - ${shortTime}`
  }

  // 🔹 Phân trang
  const totalPages = Math.ceil(showtimes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = showtimes.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const adminLinks = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
    { to: "/admin/customers", label: "Thông tin khách hàng" },
    { to: "/admin/staffs", label: "Thông tin nhân viên" },
    { to: "/moviesmanagement", label: "Quản lý phim" },
    { to: "/admin/bookings", label: "Quản lý đặt phim" },
    { to: "/admin/reports", label: "Báo cáo khác" },
  ]

  return (
    <Flex flex="1" bg="#0f1117" color="white">
      <Sidebar links={adminLinks} />
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Quản lý phim / suất chiếu</Heading>
          <Button colorScheme="orange" onClick={openAdd}>
            Thêm suất chiếu
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner color="orange.400" size="xl" />
          </Flex>
        ) : error ? (
          <Text color="red.400">{error}</Text>
        ) : (
          <>
            <TableContainer bg="gray.800" borderRadius="md" p={2}>
              <Table variant="simple" size="sm">
                <Thead bg="gray.700">
                  <Tr>
                    <Th color="orange.300">Poster</Th>
                    <Th color="orange.300">Tên phim</Th>
                    <Th color="orange.300">Phòng chiếu</Th>
                    <Th color="orange.300">Thời gian chiếu</Th>
                    <Th color="orange.300">Người tạo</Th>
                    <Th color="orange.300">Trạng thái</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.map((s) => {
                    const { label, color } = getStatus(s)
                    return (
                      <Tr key={s._id} _hover={{ bg: "gray.700" }}>
                        <Td>
                          <Image
                            src={s.movie_id?.poster_url}
                            alt={s.movie_id?.title}
                            boxSize="60px"
                            borderRadius="md"
                            objectFit="cover"
                          />
                        </Td>
                        <Td fontWeight="bold">{s.movie_id?.title || "Không rõ"}</Td>
                        <Td>{s.room_id?.name || "Không rõ"}</Td>
                        <Td>{formatDateTime(s)}</Td>
                        <Td>{s.created_by?.name || s.created_by?.email || "Admin"}</Td>
                        <Td color={color} fontWeight="semibold">
                          {label}
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            {/* 🔹 Phân trang */}
            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6}>
                <Text color="gray.400" fontSize="sm">
                  Hiển thị {startIndex + 1} -{" "}
                  {Math.min(startIndex + itemsPerPage, showtimes.length)} / {showtimes.length}
                </Text>
                <HStack spacing={2}>
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                    bg="#23242a"
                    color="white"
                    _hover={{ bg: "#2d2e35" }}
                  >
                    Trước
                  </Button>
                  {[...Array(totalPages)].map((_, index) => {
                    const page = index + 1
                    return (
                      <Button
                        key={page}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        bg={currentPage === page ? "orange.400" : "#23242a"}
                        color="white"
                        _hover={{
                          bg: currentPage === page ? "orange.500" : "#2d2e35",
                        }}
                      >
                        {page}
                      </Button>
                    )
                  })}
                  <Button
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
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
      </Box>

      {/* 🔹 Modal thêm suất chiếu */}
      <Modal isOpen={isAddOpen} onClose={closeAdd} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Thêm suất chiếu mới</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4} isRequired>
              <FormLabel>Phim *</FormLabel>
              <Select
                placeholder="Chọn phim"
                value={newShowtime.movie_id}
                onChange={(e) => {
                  console.log("Selected movie_id:", e.target.value)
                  setNewShowtime({ ...newShowtime, movie_id: e.target.value })
                }}
                bg="gray.700"
                borderColor="gray.600"
                _hover={{ borderColor: "orange.400" }}
                _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px #d53f8c" }}
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id} style={{ background: "#1a202c", color: "white" }}>
                    {m.title}
                  </option>
                ))}
              </Select>
              {newShowtime.movie_id && (
                <Text fontSize="xs" color="gray.400" mt={1}>
                  ID đã chọn: {newShowtime.movie_id}
                </Text>
              )}
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Phòng chiếu *</FormLabel>
              <Select
                placeholder="Chọn phòng"
                value={newShowtime.room_id}
                onChange={(e) => {
                  console.log("Selected room_id:", e.target.value)
                  setNewShowtime({ ...newShowtime, room_id: e.target.value })
                }}
                bg="gray.700"
                borderColor="gray.600"
                _hover={{ borderColor: "orange.400" }}
                _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px #d53f8c" }}
              >
                {rooms.map((r) => (
                  <option key={r._id} value={r._id} style={{ background: "#1a202c", color: "white" }}>
                    {r.name}
                  </option>
                ))}
              </Select>
              {newShowtime.room_id && (
                <Text fontSize="xs" color="gray.400" mt={1}>
                  ID đã chọn: {newShowtime.room_id}
                </Text>
              )}
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Ngày chiếu</FormLabel>
              <Input
                type="date"
                value={newShowtime.date}
                onChange={(e) =>
                  setNewShowtime({ ...newShowtime, date: e.target.value })
                }
                bg="gray.700"
                borderColor="gray.600"
                _hover={{ borderColor: "orange.400" }}
                _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px #d53f8c" }}
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Giờ chiếu (HH:mm)</FormLabel>
              <Input
                type="time"
                value={newShowtime.time}
                onChange={(e) =>
                  setNewShowtime({ ...newShowtime, time: e.target.value })
                }
                bg="gray.700"
                borderColor="gray.600"
                _hover={{ borderColor: "orange.400" }}
                _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px #d53f8c" }}
              />
            </FormControl>

            <Button
              colorScheme="orange"
              w="full"
              mt={4}
              isLoading={adding}
              onClick={addShowtime}
              loadingText="Đang thêm..."
            >
              Xác nhận thêm
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}