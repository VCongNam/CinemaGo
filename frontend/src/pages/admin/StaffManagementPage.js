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
} from "@chakra-ui/react"
import { useNavigate } from "react-router-dom"
import AdminLayout from "../layouts/AdminLayout"
import UserTable from "../Navbar/UserTable"

export default function StaffManagementPage() {
  const [staffs, setStaffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ username: "", password: "", email: "" })
  const [creating, setCreating] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch("http://localhost:5000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok")
        return res.json()
      })
      .then(data => {
        setStaffs((data.list || []).filter(u => u.role === "staff"))
      })
      .catch(err => setError(err.message))
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
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify(form)
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

  // Thêm hàm chuyển màn xem chi tiết nhân viên
  const handleViewInfo = (user) => {
    navigate(`/admin/user/${user.id}`)
  }

  return (
    <AdminLayout>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="md">Danh sách nhân viên</Heading>
        <Button colorScheme="orange" onClick={onOpen}>
          Thêm nhân viên mới
        </Button>
      </Flex>
      {loading && <Spinner />}
      {error && <Text color="red.400">{error}</Text>}
      <UserTable users={staffs} onViewInfo={handleViewInfo} />
      {/* Modal tạo tài khoản staff */}
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
                color="white"
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Email</FormLabel>
              <Input
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                bg="gray.800"
                color="white"
              />
            </FormControl>
            <FormControl mb={3}>
              <FormLabel>Mật khẩu</FormLabel>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
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
    </AdminLayout>
  )
}