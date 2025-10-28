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
  IconButton,
  Tooltip,
} from "@chakra-ui/react"
import { FaEdit, FaBan, FaCheckCircle } from "react-icons/fa"
import Sidebar from "../Navbar/Sidebar"

export default function ShowtimeManagementPage() {
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isAddOpen, setAddOpen] = useState(false)
  const [isEditOpen, setEditOpen] = useState(false)
  const [editingShowtime, setEditingShowtime] = useState(null)
  const [newShowtime, setNewShowtime] = useState({
    movie_id: "",
    room_id: "",
    date: "",
    time: "",
  })
  const [editForm, setEditForm] = useState({
    movie_id: "",
    room_id: "",
    date: "",
    time: "",
  })
  const [adding, setAdding] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [canceling, setCanceling] = useState(false)
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

      // Fetch rooms - Dùng POST với body pagination
      const roomRes = await fetch("http://localhost:5000/api/rooms/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          page: 1,
          pageSize: 100
        })
      })
      
      if (roomRes.ok) {
        const roomData = await roomRes.json()
        console.log("🏠 Rooms data:", roomData)
        // API trả về list array
        const roomList = roomData.list || roomData.data || []
        console.log("🏠 Room list:", roomList)
        setRooms(roomList)
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

  // 🔹 Kiểm tra xem có thể chỉnh sửa không (15 phút trước khi chiếu)
  const canEdit = (showtime) => {
    if (!showtime?.start_time?.utc) return false
    
    const now = new Date()
    const startTime = new Date(showtime.start_time.utc)
    const diffMinutes = (startTime - now) / (1000 * 60)
    
    // Có thể chỉnh sửa nếu còn hơn 15 phút
    return diffMinutes > 15
  }

  // 🔹 Mở modal thêm
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

  // 🔹 Mở modal chỉnh sửa
  const openEdit = (showtime) => {
    if (!canEdit(showtime)) {
      toast({
        title: "Không thể chỉnh sửa",
        description: "Chỉ có thể chỉnh sửa suất chiếu trước 15 phút khi bắt đầu",
        status: "warning",
        duration: 3000,
      })
      return
    }

    setEditingShowtime(showtime)
    
    // Parse ngày giờ từ start_time
    const startTime = new Date(showtime.start_time.utc)
    const date = startTime.toISOString().split('T')[0] // YYYY-MM-DD
    const time = startTime.toTimeString().split(' ')[0].slice(0, 5) // HH:mm
    
    setEditForm({
      movie_id: showtime.movie_id?._id || showtime.movie_id || "",
      room_id: showtime.room_id?._id || showtime.room_id || "",
      date: date,
      time: time,
    })
    
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingShowtime(null)
    setEditForm({
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
    
    // 🔹 Chuẩn bị payload - đảm bảo là string ID thuần
    const payload = {
      movie_id: String(newShowtime.movie_id).trim(),
      room_id: String(newShowtime.room_id).trim(),
      date: newShowtime.date,
      time: newShowtime.time,
    }
    
    console.log("=".repeat(50))
    console.log("📤 PAYLOAD GỬI ĐI:")
    console.log(JSON.stringify(payload, null, 2))
    console.log("=".repeat(50))
    console.log("📝 movie_id:", payload.movie_id, "- Type:", typeof payload.movie_id)
    console.log("📝 room_id:", payload.room_id, "- Type:", typeof payload.room_id)
    console.log("📝 date:", payload.date)
    console.log("📝 time:", payload.time)
    console.log("=".repeat(50))
    
    // Validate ObjectId format (24 hex characters)
    const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id)
    
    if (!isValidObjectId(payload.movie_id)) {
      toast({ 
        title: "Lỗi", 
        description: "ID phim không hợp lệ", 
        status: "error" 
      })
      setAdding(false)
      return
    }
    
    if (!isValidObjectId(payload.room_id)) {
      toast({ 
        title: "Lỗi", 
        description: "ID phòng không hợp lệ", 
        status: "error" 
      })
      setAdding(false)
      return
    }
    
    try {
      const res = await fetch("http://localhost:5000/api/showtimes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })
      
      const responseText = await res.text()
      console.log("📥 Raw response:", responseText)
      
      if (!res.ok) {
        let err
        try {
          err = JSON.parse(responseText)
        } catch {
          err = { message: responseText }
        }
        console.error("❌ API Error:", err)
        throw new Error(err.message || "Không thể thêm suất chiếu.")
      }
      
      const result = JSON.parse(responseText)
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

  // 🔹 Cập nhật suất chiếu
  const updateShowtime = async () => {
    if (!editForm.movie_id || !editForm.room_id || !editForm.date || !editForm.time) {
      toast({ 
        title: "Lỗi", 
        description: "Vui lòng điền đầy đủ thông tin", 
        status: "error" 
      })
      return
    }

    setUpdating(true)
    const token = localStorage.getItem("token")
    
    const payload = {
      movie_id: String(editForm.movie_id).trim(),
      room_id: String(editForm.room_id).trim(),
      date: editForm.date,
      time: editForm.time,
    }
    
    try {
      const res = await fetch(`http://localhost:5000/api/showtimes/${editingShowtime._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      })
      
      const responseText = await res.text()
      
      if (!res.ok) {
        let err
        try {
          err = JSON.parse(responseText)
        } catch {
          err = { message: responseText }
        }
        throw new Error(err.message || "Không thể cập nhật suất chiếu.")
      }
      
      toast({ 
        title: "Cập nhật suất chiếu thành công!", 
        status: "success",
        duration: 3000 
      })
      
      fetchShowtimes()
      closeEdit()
    } catch (err) {
      toast({ 
        title: "Lỗi", 
        description: err.message, 
        status: "error",
        duration: 5000 
      })
    } finally {
      setUpdating(false)
    }
  }

  // 🔹 Hủy suất chiếu
  const toggleShowtimeStatus = async (showtime) => {
    if (!canEdit(showtime)) {
      toast({
        title: "Không thể thay đổi",
        description: "Chỉ có thể thay đổi trạng thái trước 15 phút khi bắt đầu",
        status: "warning",
        duration: 3000,
      })
      return
    }

    setCanceling(true)
    const token = localStorage.getItem("token")
    
    // Toggle giữa active và inactive
    const newStatus = showtime.status === "inactive" ? "active" : "inactive"
    
    try {
      const res = await fetch(`http://localhost:5000/api/showtimes/${showtime._id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus })
      })
      
      const responseText = await res.text()
      
      if (!res.ok) {
        let err
        try {
          err = JSON.parse(responseText)
        } catch {
          err = { message: responseText }
        }
        throw new Error(err.message || "Không thể thay đổi trạng thái suất chiếu.")
      }
      
      toast({ 
        title: newStatus === "inactive" ? "Đã hủy suất chiếu!" : "Đã kích hoạt lại suất chiếu!",
        status: "success",
        duration: 3000 
      })
      
      fetchShowtimes()
    } catch (err) {
      toast({ 
        title: "Lỗi", 
        description: err.message, 
        status: "error",
        duration: 5000 
      })
    } finally {
      setCanceling(false)
    }
  }

  // 🔹 Tính trạng thái suất chiếu
  const getStatus = (showtime) => {
    // Kiểm tra status từ API trước
    if (showtime.status === "inactive") {
      return { label: "Đã hủy", color: "red.500" }
    }
    
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
    
    const parts = showtime.start_time.vietnamFormatted.split(" ")
    const time = parts[0]
    const date = parts[1]
    const shortTime = time.split(":").slice(0, 2).join(":")
    
    return `${date} - ${shortTime}`
  }

  // 🔹 Lọc bỏ các suất chiếu đã kết thúc
  const activeShowtimes = showtimes.filter((showtime) => {
    if (!showtime?.end_time?.utc) return true
    const now = new Date()
    const endTime = new Date(showtime.end_time.utc)
    return now <= endTime // Chỉ hiển thị suất chưa kết thúc
  })

  // 🔹 Phân trang
  const totalPages = Math.ceil(activeShowtimes.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginated = activeShowtimes.slice(startIndex, startIndex + itemsPerPage)

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
                    <Th color="orange.300">Thao tác</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.map((s) => {
                    const { label, color } = getStatus(s)
                    const editable = canEdit(s)
                    
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
                        <Td>
                          <Tooltip 
                            label={
                              s.status === "inactive" 
                                ? editable 
                                  ? "Kích hoạt lại suất chiếu"
                                  : "Không thể kích hoạt (dưới 15 phút)"
                                : editable 
                                  ? "Hủy suất chiếu" 
                                  : "Không thể hủy (dưới 15 phút)"
                            } 
                            hasArrow
                          >
                            <IconButton
                              icon={s.status === "inactive" ? <FaCheckCircle /> : <FaBan />}
                              size="sm"
                              colorScheme={
                                !editable 
                                  ? "gray" 
                                  : s.status === "inactive" 
                                    ? "green" 
                                    : "red"
                              }
                              onClick={() => toggleShowtimeStatus(s)}
                              isDisabled={!editable}
                              isLoading={canceling}
                            />
                          </Tooltip>
                        </Td>
                      </Tr>
                    )
                  })}
                </Tbody>
              </Table>
            </TableContainer>

            {totalPages > 1 && (
              <Flex justify="space-between" align="center" mt={6}>
                <Text color="gray.400" fontSize="sm">
                  Hiển thị {startIndex + 1} -{" "}
                  {Math.min(startIndex + itemsPerPage, activeShowtimes.length)} / {activeShowtimes.length}
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
                {movies.length === 0 ? (
                  <option disabled style={{ background: "#1a202c", color: "gray" }}>
                    Đang tải phim...
                  </option>
                ) : (
                  movies.map((m) => (
                    <option key={m._id} value={m._id} style={{ background: "#1a202c", color: "white" }}>
                      {m.title}
                    </option>
                  ))
                )}
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
                  const selectedId = e.target.value
                  console.log("📝 Selected room_id (raw):", selectedId)
                  console.log("📝 Type:", typeof selectedId)
                  
                  const selectedRoom = rooms.find(r => String(r._id) === String(selectedId))
                  console.log("🏠 Selected room object:", selectedRoom)
                  
                  if (selectedRoom) {
                    console.log("✅ Room found - ID:", selectedRoom._id)
                    console.log("✅ Room name:", selectedRoom.name)
                  }
                  
                  setNewShowtime({ ...newShowtime, room_id: selectedId })
                }}
                bg="gray.700"
                borderColor="gray.600"
                _hover={{ borderColor: "orange.400" }}
                _focus={{ borderColor: "orange.400", boxShadow: "0 0 0 1px #d53f8c" }}
              >
                {rooms.length === 0 ? (
                  <option disabled style={{ background: "#1a202c", color: "gray" }}>
                    Đang tải phòng...
                  </option>
                ) : (
                  rooms.map((r) => {
                    const roomId = r._id || r.id
                    const roomName = r.name || `Phòng ${roomId}`
                    
                    console.log("🔍 Room option:", { id: roomId, name: roomName })
                    
                    return (
                      <option 
                        key={roomId} 
                        value={roomId} 
                        style={{ background: "#1a202c", color: "white" }}
                      >
                        {roomName}
                      </option>
                    )
                  })
                )}
              </Select>
              {newShowtime.room_id && (
                <Text fontSize="xs" color="gray.400" mt={1}>
                  ID đã chọn: {newShowtime.room_id}
                </Text>
              )}
              {rooms.length === 0 && (
                <Text fontSize="xs" color="red.400" mt={1}>
                  ⚠️ Không có phòng nào. Vui lòng thêm phòng trước.
                </Text>
              )}
              {rooms.length > 0 && (
                <Text fontSize="xs" color="blue.300" mt={1}>
                  ℹ️ Có {rooms.length} phòng khả dụng
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

      {/* 🔹 Modal chỉnh sửa suất chiếu */}
      <Modal isOpen={isEditOpen} onClose={closeEdit} isCentered>
        <ModalOverlay />
        <ModalContent bg="gray.800" color="white">
          <ModalHeader>Chỉnh sửa suất chiếu</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={4} isRequired>
              <FormLabel>Phim *</FormLabel>
              <Select
                placeholder="Chọn phim"
                value={editForm.movie_id}
                onChange={(e) => setEditForm({ ...editForm, movie_id: e.target.value })}
                bg="gray.700"
                borderColor="gray.600"
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id} style={{ background: "#1a202c", color: "white" }}>
                    {m.title}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Phòng chiếu *</FormLabel>
              <Select
                placeholder="Chọn phòng"
                value={editForm.room_id}
                onChange={(e) => setEditForm({ ...editForm, room_id: e.target.value })}
                bg="gray.700"
                borderColor="gray.600"
              >
                {rooms.map((r) => (
                  <option key={r._id} value={r._id} style={{ background: "#1a202c", color: "white" }}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Ngày chiếu</FormLabel>
              <Input
                type="date"
                value={editForm.date}
                onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>

            <FormControl mb={4} isRequired>
              <FormLabel>Giờ chiếu (HH:mm)</FormLabel>
              <Input
                type="time"
                value={editForm.time}
                onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                bg="gray.700"
                borderColor="gray.600"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              w="full"
              mt={4}
              isLoading={updating}
              onClick={updateShowtime}
              loadingText="Đang cập nhật..."
            >
              Cập nhật suất chiếu
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}