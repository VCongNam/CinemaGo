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
    start_time: "",
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
      const res = await fetch("http://localhost:5000/api/showtimes/list", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ page: 1, pageSize: 100 }),
      })
      if (!res.ok) throw new Error("Không thể tải danh sách suất chiếu.")
      const data = await res.json()
      setShowtimes(data.data || [])
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
      const [movieRes, roomRes] = await Promise.all([
        fetch("http://localhost:5000/api/movies", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }),
        fetch("http://localhost:5000/api/rooms", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }),
      ])

      const movieData = await movieRes.json()
      const roomData = await roomRes.json()
      setMovies(movieData.data || [])
      setRooms(roomData.data || [])
    } catch (err) {
      console.error("Lỗi tải phim hoặc phòng:", err)
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
      start_time: "",
      time: "",
    })
  }

  // 🔹 Thêm suất chiếu mới
  const addShowtime = async () => {
    setAdding(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://localhost:5000/api/showtimes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(newShowtime),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || "Không thể thêm suất chiếu.")
      }
      await res.json()
      toast({ title: "Thêm suất chiếu thành công!", status: "success" })
      fetchShowtimes()
      closeAdd()
    } catch (err) {
      toast({ title: "Lỗi", description: err.message, status: "error" })
    } finally {
      setAdding(false)
    }
  }

  // 🔹 Tính trạng thái suất chiếu
  const getStatus = (startTime) => {
    if (!startTime) return { label: "Không xác định", color: "gray.400" }
    const now = new Date()
    const start = new Date(startTime)
    if (start > now) return { label: "Sắp chiếu", color: "blue.400" }
    const diff = (now - start) / (1000 * 60 * 60)
    if (diff > 2) return { label: "Hết hạn", color: "gray.500" }
    return { label: "Đang chiếu", color: "green.400" }
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
          <Spinner />
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
                    <Th color="orange.300">Thời gian chiếu</Th>
                    <Th color="orange.300">Người tạo</Th>
                    <Th color="orange.300">Trạng thái</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginated.map((s, index) => {
                    const { label, color } = getStatus(s.start_time)
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
                        <Td fontWeight="bold">{s.movie_id?.title}</Td>
                        <Td>
                          {new Date(s.start_time).toLocaleDateString("vi-VN")} - {s.time}
                        </Td>
                        <Td>{s.created_by || "Admin"}</Td>
                        <Td color={color} fontWeight="semibold">{label}</Td>
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
        <ModalContent>
          <ModalHeader>Thêm suất chiếu</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <FormControl mb={3}>
              <FormLabel>Phim</FormLabel>
              <Select
                placeholder="Chọn phim"
                value={newShowtime.movie_id}
                onChange={(e) =>
                  setNewShowtime({ ...newShowtime, movie_id: e.target.value })
                }
              >
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Phòng chiếu</FormLabel>
              <Select
                placeholder="Chọn phòng"
                value={newShowtime.room_id}
                onChange={(e) =>
                  setNewShowtime({ ...newShowtime, room_id: e.target.value })
                }
              >
                {rooms.map((r) => (
                  <option key={r._id} value={r._id}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Ngày chiếu</FormLabel>
              <Input
                type="date"
                value={newShowtime.start_time}
                onChange={(e) =>
                  setNewShowtime({ ...newShowtime, start_time: e.target.value })
                }
              />
            </FormControl>

            <FormControl mb={3}>
              <FormLabel>Giờ chiếu</FormLabel>
              <Input
                type="time"
                value={newShowtime.time}
                onChange={(e) =>
                  setNewShowtime({ ...newShowtime, time: e.target.value })
                }
              />
            </FormControl>

            <Button
              colorScheme="orange"
              w="full"
              mt={4}
              isLoading={adding}
              onClick={addShowtime}
            >
              Xác nhận thêm
            </Button>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  )
}
