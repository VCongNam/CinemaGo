import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
<<<<<<< Updated upstream
import { Input, Select, Box, Flex, useToast, Button } from "@chakra-ui/react"
=======
import { Input, Select, Box, Flex, useToast, Button, Text } from "@chakra-ui/react"
>>>>>>> Stashed changes
import Sidebar from "../Navbar/Sidebar";
import UserTable from "../Navbar/UserTable"

const PAGE_SIZE = 8

export default function CustomerManagementPage() {
  const [allUsers, setAllUsers] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const [refresh, setRefresh] = useState(false)
  const navigate = useNavigate()
  const toast = useToast()

<<<<<<< Updated upstream
  // Fetch user list (phân trang từ backend, filter/search ở backend)
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
        role: "customer",
        search: search.trim(),
        status: statusFilter !== "all" ? statusFilter : undefined
      })
    })
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok")
        return res.json()
      })
      .then(data => {
        setUsers(data.list || [])
        setTotalPage(Math.ceil((data.totalCount || 1) / PAGE_SIZE))
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [currentPage, refresh, search, statusFilter])
=======
  // Fetch all customer users (không phân trang backend)
  // ...existing code...

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
      role: "customer",
      page: currentPage,
      pageSize: PAGE_SIZE,
      // Nếu muốn lọc theo trạng thái và tên thì truyền thêm:
      status: statusFilter !== "all" ? statusFilter : undefined,
      search: search.trim() ? search.trim() : undefined
    })
  })
    .then(res => {
      if (!res.ok) throw new Error("Network response was not ok")
      return res.json()
    })
    .then(data => {
      setUsers(data.list || [])
      setTotalPage(Math.ceil((data.totalCount || 1) / PAGE_SIZE))
    })
    .catch(err => setError(err.message))
    .finally(() => setLoading(false))
}, [currentPage, refresh, statusFilter, search])

// ...bỏ useEffect lọc phân trang ở frontend...

  // Lọc theo trạng thái (active/locked/suspended) và search theo tên ở frontend
  useEffect(() => {
    let filtered = allUsers
    if (statusFilter !== "all") {
      filtered = filtered.filter(u => u.status === statusFilter)
    }
    if (search.trim()) {
      filtered = filtered.filter(u =>
        u.username.toLowerCase().includes(search.trim().toLowerCase())
      )
    }
    setTotalPage(Math.ceil(filtered.length / PAGE_SIZE))
    setUsers(filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE))
  }, [allUsers, search, statusFilter, currentPage])

  // Khi search/filter đổi thì về trang 1
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])
>>>>>>> Stashed changes

  const handleViewInfo = (user) => {
    navigate(`/admin/user/${user.id}`)
  }

<<<<<<< Updated upstream
  // ...existing code...

  // Hàm gọi API đổi trạng thái
  const handleToggleStatus = async (user) => {
    const token = localStorage.getItem("token")
    try {
      // Đổi trạng thái tuần tự: active -> locked -> suspended -> active
=======
  // Đổi trạng thái tuần tự: active -> locked -> suspended -> active
  const handleToggleStatus = async (user) => {
    const token = localStorage.getItem("token")
    try {
>>>>>>> Stashed changes
      let newStatus = "active";
      if (user.status === "active") newStatus = "locked";
      else if (user.status === "locked") newStatus = "suspended";
      else if (user.status === "suspended") newStatus = "active";

      const res = await fetch(`http://localhost:5000/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Cập nhật trạng thái thất bại")
<<<<<<< Updated upstream
<<<<<<< Updated upstream
      setRefresh(r => !r) // reload lại danh sách
=======
>>>>>>> Stashed changes
=======
>>>>>>> Stashed changes
      toast({
        title: "Thành công",
        description: data.message || "Cập nhật trạng thái tài khoản thành công",
        status: "success",
        duration: 3000,
        isClosable: true,
      })
<<<<<<< Updated upstream
      // Cập nhật trạng thái user trong danh sách hiện tại ngay lập tức
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, status: newStatus } : u
=======
      setUsers(prev =>
        prev.map(u =>
          u.id === user.id ? { ...u, status: data.data.status } : u
>>>>>>> Stashed changes
        )
      )
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

<<<<<<< Updated upstream
<<<<<<< Updated upstream
  // Khi search/filter đổi thì về trang 1
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])
=======
// ...existing code...
>>>>>>> Stashed changes
=======
  // Lọc chỉ lấy user có role là "customer"
  let customerUsers = users.filter(user => user.role === "customer")

  // Lọc theo trạng thái (active, locked, suspended)
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
>>>>>>> Stashed changes

  if (loading) return <p>Đang tải...</p>
  if (error) return <p>Lỗi: {error}</p>

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
        <Box mb={4}>
          <Flex gap={4}>
            <Input
              placeholder="Tìm theo tên..."
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
              _focus={{ bg: "#23242a" }}
            >
              <option value="all" style={{background:'#181a20', color:'#fff'}}>Tất cả trạng thái</option>
              <option value="active" style={{background:'#181a20', color:'#fff'}}>Hoạt động</option>
              <option value="locked" style={{background:'#181a20', color:'#fff'}}>Khóa</option>
              <option value="suspended" style={{background:'#181a20', color:'#fff'}}>Tạm ngưng</option>
            </Select>
          </Flex>
        </Box>
        <Text mb={2} color="gray.400" fontSize="sm">
          Tổng số khách: {allUsers.length}
        </Text>
        <UserTable
          users={users}
          onViewInfo={handleViewInfo}
          onToggleStatus={handleToggleStatus}
        />
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
      </Box>
    </Flex>
  )
}