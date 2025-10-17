import { useEffect, useState } from "react"
import {
  Box,
  Heading,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Input,
  FormControl,
  FormLabel,
  useDisclosure,
  Spinner,
  Text,
  Flex,
  Select,
  HStack,
  useToast
} from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Navbar/Sidebar"
import UserTable from "../Navbar/UserTable"

export default function StaffManagementPage() {
  const [staffs, setStaffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [form, setForm] = useState({
    username: "",
    password: "",
    email: "",
    fullName: "",
    role: "LV1"
  })
  const [creating, setCreating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const navigate = useNavigate()

  // ✅ Lấy danh sách staff
  const fetchAllStaffs = async () => {
    setLoading(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://localhost:5000/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
  page: 1,
  pageSize: 100,
  orderBy: "created_at",
  orderDir: "DESC",
  filterCriterias: [
    {
      field: "role",
      operator: "in",
      value: ["LV1", "LV2"]
    }
  ]
})

      })
      if (!res.ok) throw new Error("Không thể tải danh sách nhân viên.")
      const data = await res.json()

      const staffsWithStatus = (data.list || []).map(staff => {
        let status = "active"
        if (staff.status === "locked") status = "locked"
        else if (staff.suspendedAt) status = "suspended"
        return { ...staff, status }
      })
      setStaffs(staffsWithStatus)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllStaffs()
  }, [])

  // ✅ Tạo tài khoản mới
  const handleCreateStaff = async () => {
    setCreating(true)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://localhost:5000/register-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Tạo tài khoản thất bại")
      toast({
        title: "Thành công",
        description: "Đã tạo tài khoản nhân viên mới.",
        status: "success",
        duration: 3000,
        isClosable: true
      })
      setForm({ username: "", password: "", email: "", fullName: "", role: "LV1" })
      onClose()
      fetchAllStaffs()
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true
      })
    } finally {
      setCreating(false)
    }
  }

  // ✅ Đổi trạng thái tài khoản
  const handleToggleStatus = async (user, newStatus) => {
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`http://localhost:5000/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.message || "Cập nhật trạng thái thất bại")
      }
      setStaffs(staffs =>
        staffs.map(s =>
          s.id === user.id
            ? {
                ...s,
                suspendedAt: newStatus === "suspended" ? new Date().toISOString() : null,
                status: newStatus
              }
            : s
        )
      )
      toast({
        title: "Thành công",
        description: `Đã ${newStatus === "active" ? "kích hoạt" : "tạm ngưng"} tài khoản.`,
        status: "success",
        duration: 3000,
        isClosable: true
      })
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true
      })
    }
  }

  // ✅ Bộ lọc tìm kiếm và phân trang
  let filteredStaffs = staffs
  if (statusFilter !== "all") {
    filteredStaffs = filteredStaffs.filter(s => s.status === statusFilter)
  }
  if (search.trim()) {
    filteredStaffs = filteredStaffs.filter(
      s =>
        s.username.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    )
  }

  const totalPages = Math.ceil(filteredStaffs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedStaffs = filteredStaffs.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const adminLinks = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
    { to: "/admin/customers", label: "Thông tin khách hàng" },
    { to: "/admin/staffs", label: "Thông tin nhân viên" },
    { to: "/moviesmanagement", label: "Quản lí phim" },
    { to: "/admin/reports", label: "Báo cáo khác" },
  ]

  return (
    <Flex flex="1" bg="#0f1117" color="white">
      <Sidebar links={adminLinks} />
      <Box flex="1" p={6}>
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">Danh sách nhân viên</Heading>
          <Button colorScheme="orange" onClick={onOpen}>
            Thêm nhân viên mới
          </Button>
        </Flex>

        {/* Bộ lọc tìm kiếm */}
        <Flex gap={4} mb={4}>
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            maxW="300px"
            bg="gray.800"
            color="white"
            border="none"
            _focus={{ bg: "gray.700" }}
          />
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            maxW="200px"
            bg="#181a20"
            color="#fff"
            border="1px solid #23242a"
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>Tất cả</option>
            <option value="active" style={{ background: "#181a20", color: "#fff" }}>Hoạt động</option>
            <option value="suspended" style={{ background: "#181a20", color: "#fff" }}>Tạm ngưng</option>
            <option value="locked" style={{ background: "#181a20", color: "#fff" }}>Khóa</option>
          </Select>
        </Flex>

        {/* Bảng danh sách */}
        {loading ? (
          <Spinner />
        ) : (
          <UserTable users={paginatedStaffs} onViewInfo={u => navigate(`/admin/user/${u.id}`)} onToggleStatus={handleToggleStatus} />
        )}

        {/* Phân trang */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={6}>
            <Text color="gray.400" fontSize="sm">
              Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredStaffs.length)} / {filteredStaffs.length}
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
                const p = i + 1
                if (p === 1 || p === totalPages || (p >= currentPage - 1 && p <= currentPage + 1)) {
                  return (
                    <Button
                      key={p}
                      size="sm"
                      onClick={() => setCurrentPage(p)}
                      bg={currentPage === p ? "orange.400" : "#23242a"}
                    >
                      {p}
                    </Button>
                  )
                } else if (p === currentPage - 2 || p === currentPage + 2) {
                  return <Text key={p} color="gray.400">...</Text>
                }
                return null
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

        {/* Modal tạo tài khoản nhân viên */}
        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent bg="gray.900" color="white">
            <ModalHeader>Tạo tài khoản nhân viên mới</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl mb={3}>
                <FormLabel>Tên đăng nhập</FormLabel>
                <Input
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  bg="gray.800"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Email</FormLabel>
                <Input
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  bg="gray.800"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Họ và tên</FormLabel>
                <Input
                  value={form.fullName}
                  onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                  bg="gray.800"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Mật khẩu</FormLabel>
                <Input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  bg="gray.800"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Vai trò</FormLabel>
                <Select
                  value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  bg="gray.800"
                >
                  <option value="LV1">Nhân viên cấp 1</option>
                  <option value="LV2">Nhân viên cấp 2</option>
                </Select>
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button onClick={onClose} mr={3}>
                Hủy
              </Button>
              <Button colorScheme="orange" onClick={handleCreateStaff} isLoading={creating}>
                Tạo mới
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Box>
    </Flex>
  )
}
