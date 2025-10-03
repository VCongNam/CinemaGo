import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input, Select, Box, Flex, useToast, Button } from "@chakra-ui/react"
import Sidebar from "../Navbar/Sidebar";
import UserTable from "../Navbar/UserTable"

const PAGE_SIZE = 8

export default function CustomerManagementPage() {
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
      setRefresh(r => !r) // reload lại danh sách
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

  // Khi search/filter đổi thì về trang 1
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

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
              _focus={{ bg: "#23242a" }}
            >
              <option value="all" style={{background:'#181a20', color:'#fff'}}>Tất cả trạng thái</option>
              <option value="active" style={{background:'#181a20', color:'#fff'}}>Hoạt động</option>
              <option value="deactive" style={{background:'#181a20', color:'#fff'}}>Khóa</option>
            </Select>
          </Flex>
        </Box>
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