import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input, Select, Box, Flex, useToast } from "@chakra-ui/react"
import AdminLayout from "../layouts/AdminLayout"
import UserTable from "../Navbar/UserTable"

export default function CustomerManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const navigate = useNavigate()
  const toast = useToast()

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
      .then(data => setUsers(data.list || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const handleViewInfo = (user) => {
    navigate(`/admin/user/${user.id}`)
  }

  // Hàm gọi API đổi trạng thái
  const handleToggleStatus = async (user) => {
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("http://localhost:5000/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          id: user.id,
          status: user.status === "active" ? "deactive" : "active"
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Cập nhật trạng thái thất bại")
      // Cập nhật lại danh sách user
      setUsers(users =>
        users.map(u =>
          u.id === user.id ? { ...u, status: data.status } : u
        )
      )
      toast({
        title: "Thành công",
        description: "Cập nhật trạng thái tài khoản thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
    } catch (err) {
      toast({
        title: "Lỗi",
        description: err.message,
        status: "error",
        duration: 4000,
        isClosable: true,
      })
    }
  }

  // Lọc chỉ lấy user có role là "customer"
  let customerUsers = users.filter(user => user.role === "customer")

  // Lọc theo trạng thái
  if (statusFilter !== "all") {
    customerUsers = customerUsers.filter(user => user.status === statusFilter)
  }

  // Tìm kiếm theo tên hoặc email
  if (search.trim()) {
    customerUsers = customerUsers.filter(
      user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )
  }

  if (loading) return <AdminLayout><p>Đang tải...</p></AdminLayout>
  if (error) return <AdminLayout><p>Lỗi: {error}</p></AdminLayout>

  return (
    <AdminLayout>
      <Box mb={4}>
        <Flex gap={4}>
          <Input
            placeholder="Tìm theo tên hoặc email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            maxW="300px"
            bg="white"
            color="black"
          />
          <Select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            maxW="200px"
            bg="white"
            color="black"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="deactive">Khóa</option>
          </Select>
        </Flex>
      </Box>
      <UserTable
        users={customerUsers}
        onViewInfo={handleViewInfo}
        onToggleStatus={handleToggleStatus}
      />
    </AdminLayout>
  )
}