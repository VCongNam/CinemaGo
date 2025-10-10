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
} from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import Sidebar from "../Navbar/Sidebar"
import UserTable from "../Navbar/UserTable"

export default function StaffManagementPage() {
  const [staffs, setStaffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ username: "", password: "", email: "" })
  const [statusFilter, setStatusFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [creating, setCreating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem("token")

    // ✅ Lấy danh sách nhân viên LV1
    fetch("http://localhost:5000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({
        role: "LV1",
        page: 1,
        pageSize: 100,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok")
        return res.json()
      })
      .then((data) => {
        // ✅ Lấy thêm nhân viên LV2
        fetch("http://localhost:5000/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify({
            role: "LV2",
            page: 1,
            pageSize: 100,
          }),
        })
          .then((res2) => {
            if (!res2.ok) throw new Error("Network response was not ok")
            return res2.json()
          })
          .then((data2) => {
            setStaffs([...(data.list || []), ...(data2.list || [])])
          })
          .catch((err) => setError(err.message))
          .finally(() => setLoading(false))
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [creating])

  const handleCreateStaff = async () => {
    setCreating(true)
    setError(null)
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://localhost:5000/register-staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Tạo tài khoản thất bại")
      setForm({ username: "", password: "", email: "" })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleViewInfo = (user) => {
    navigate(`/admin/user/${user.id}`)
  }

  // ✅ Lọc theo trạng thái và tìm kiếm
  let filteredStaffs = staffs
  if (statusFilter !== "all") {
    filteredStaffs = filteredStaffs.filter((staff) => staff.status === statusFilter)
  }
  if (search.trim()) {
    filteredStaffs = filteredStaffs.filter(
      (staff) =>
        staff.username.toLowerCase().includes(search.toLowerCase()) ||
        staff.email.toLowerCase().includes(search.toLowerCase())
    )
  }

  // ✅ Đổi trạng thái tuần tự: active -> locked -> suspended -> active
  const handleToggleStatus = async (user) => {
    const token = localStorage.getItem("token")
    try {
      let newStatus = "active"
      if (user.status === "active") newStatus = "locked"
      else if (user.status === "locked") newStatus = "suspended"
      else if (user.status === "suspended") newStatus = "active"

      const res = await fetch(`http://localhost:5000/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Cập nhật trạng thái thất bại")
      setStaffs((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: data.data.status } : u))
      )
    } catch (err) {
      setError(err.message)
    }
  }

  const adminLinks = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
    { to: "/admin/customers", label: "Thông tin khách hàng" },
    { to: "/admin/staffs", label: "Thông tin nhân viên" },
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

        <Flex gap={4} mb={4}>
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
            _focus={{ bg: "#23242a" }}
          >
            <option value="all" style={{ background: "#181a20", color: "#fff" }}>
              Tất cả trạng thái
            </option>
            <option value="active" style={{ background: "#181a20", color: "#fff" }}>
              Hoạt động
            </option>
            <option value="locked" style={{ background: "#181a20", color: "#fff" }}>
              Khóa
            </option>
            <option value="suspended" style={{ background: "#181a20", color: "#fff" }}>
              Tạm ngưng
            </option>
          </Select>
        </Flex>

        {loading && <Spinner />}
        {error && <Text color="red.400">{error}</Text>}

        <UserTable
          users={filteredStaffs}
          onViewInfo={handleViewInfo}
          onToggleStatus={handleToggleStatus}
        />

        {/* ✅ Modal tạo tài khoản staff */}
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
                  onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                  bg="gray.800"
                  color="white"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Email</FormLabel>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  bg="gray.800"
                  color="white"
                />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Mật khẩu</FormLabel>
                <Input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  bg="gray.800"
                  color="white"
                />
              </FormControl>
              {error && <Text color="red.400">{error}</Text>}
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
