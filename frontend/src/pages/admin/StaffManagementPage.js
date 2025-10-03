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
import Sidebar from "../Navbar/Sidebar";
import UserTable from "../Navbar/UserTable"

const PAGE_SIZE = 8

export default function StaffManagementPage() {
  const [staffs, setStaffs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState({ username: "", password: "", email: "" })
  const [creating, setCreating] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    const token = localStorage.getItem("token")
    fetch("http://localhost:5000/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      },
      body: JSON.stringify({
        page: currentPage,
        pageSize: PAGE_SIZE,
        role: "staff"
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok")
        return res.json()
      })
      .then(data => {
        setStaffs(data.list || [])
        setTotalPage(Math.ceil((data.totalCount || 1) / PAGE_SIZE))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [currentPage, creating])

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

  const handleViewInfo = (user) => {
    navigate(`/admin/user/${user.id}`)
  }

  const adminLinks = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu" },
    { to: "/admin/customers", label: "Thông tin khách hàng" },
    { to: "/admin/staffs", label: "Thông tin nhân viên" },
    { to: "/admin/reports", label: "Báo cáo khác" },
  ];

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
        {loading && <Spinner />}
        {error && <Text color="red.400">{error}</Text>}
        <UserTable users={staffs} onViewInfo={handleViewInfo} />
        {/* PHÂN TRANG */}
        <Flex mt={6} justify="center" gap={2}>
          <Button
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            isDisabled={currentPage === 1}
          >
            Trang trước
          </Button>
          {[...Array(totalPage)].map((_, idx) => (
            <Button
              key={idx}
              size="sm"
              variant={currentPage === idx + 1 ? "solid" : "outline"}
              colorScheme="orange"
              onClick={() => setCurrentPage(idx + 1)}
            >
              {idx + 1}
            </Button>
          ))}
          <Button
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPage, p + 1))}
            isDisabled={currentPage === totalPage || totalPage === 0}
          >
            Trang sau
          </Button>
        </Flex>
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
      </Box>
    </Flex>
  )
}