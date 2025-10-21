import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Input, Select, Box, Flex, useToast, Button, Text, HStack } from "@chakra-ui/react"
import Sidebar from "../Navbar/Sidebar";
import UserTable from "../Navbar/UserTable"

export default function CustomerManagementPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState(localStorage.getItem("customerSearch") || "")
  const [statusFilter, setStatusFilter] = useState(localStorage.getItem("customerStatusFilter") || "all")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    const token = localStorage.getItem("token")
    
    const fetchAllUsers = async () => {
      try {
        const res = await fetch("http://localhost:5000/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` })
          },
          body: JSON.stringify({
            page: 1,
            pageSize: 100 
          })
        })
        
        if (!res.ok) throw new Error("Network response was not ok")
        
        const data = await res.json()
        
        const usersWithStatus = (data.list || []).map(user => {
          let status = "active"
          if (user.status === "locked") {
            status = "locked"
          } else if (user.suspendedAt) {
            status = "suspended"
          }
          return { ...user, status }
        })
        
        setUsers(usersWithStatus)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    
    fetchAllUsers()
  }, [])

  const handleViewInfo = (user) => {
    navigate(`/admin/user/${user.id}`)
  }

  const handleToggleStatus = async (user, newStatus) => {
    const token = localStorage.getItem("token")
    
    try {
      const res = await fetch(`http://localhost:5000/users/${user.id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: JSON.stringify({
          status: newStatus
        })
      })
      
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.message || "Cập nhật trạng thái thất bại")
      
      setUsers(users =>
        users.map(u =>
          u.id === user.id 
            ? { 
                ...u, 
                suspendedAt: data.data?.suspendedAt || null,
                status: newStatus
              } 
            : u
        )
      )
      
      const statusText = {
        active: "kích hoạt",
        suspended: "tạm ngưng",
        locked: "khóa"
      }
      
      toast({
        title: "Thành công",
        description: `Đã ${statusText[newStatus]} tài khoản thành công`,
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

  let customerUsers = users.filter(user => user.role === "customer")

  if (statusFilter !== "all") {
    customerUsers = customerUsers.filter(user => user.status === statusFilter)
  }

  if (search.trim()) {
    customerUsers = customerUsers.filter(
      user =>
        user.username.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
    )
  }

  const totalPages = Math.ceil(customerUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedUsers = customerUsers.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter])

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  // ✅ Lưu search và filter vào localStorage
  useEffect(() => {
    localStorage.setItem("customerSearch", search)
  }, [search])

  useEffect(() => {
    localStorage.setItem("customerStatusFilter", statusFilter)
  }, [statusFilter])

  if (loading) return <p>Đang tải...</p>
  if (error) return <p>Lỗi: {error}</p>

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
              <option value="suspended" style={{background:'#181a20', color:'#fff'}}>Tạm ngưng</option>
              <option value="locked" style={{background:'#181a20', color:'#fff'}}>Khóa</option>
            </Select>
          </Flex>
        </Box>
        <UserTable
          users={paginatedUsers}
          onViewInfo={handleViewInfo}
          onToggleStatus={handleToggleStatus}
        />
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Flex justify="space-between" align="center" mt={6}>
            <Text color="gray.400" fontSize="sm">
              Hiển thị {startIndex + 1} - {Math.min(endIndex, customerUsers.length)} / {customerUsers.length} tài khoản
            </Text>
            <HStack spacing={2}>
              <Button
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                isDisabled={currentPage === 1}
                bg="#23242a"
                color="white"
                _hover={{ bg: "#2d2e35" }}
                _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
              >
                Trước
              </Button>
              
              {[...Array(totalPages)].map((_, index) => {
                const page = index + 1
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      bg={currentPage === page ? "orange.400" : "#23242a"}
                      color="white"
                      _hover={{ bg: currentPage === page ? "orange.500" : "#2d2e35" }}
                    >
                      {page}
                    </Button>
                  )
                } else if (
                  page === currentPage - 2 ||
                  page === currentPage + 2
                ) {
                  return <Text key={page} color="gray.400">...</Text>
                }
                return null
              })}
              
              <Button
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                isDisabled={currentPage === totalPages}
                bg="#23242a"
                color="white"
                _hover={{ bg: "#2d2e35" }}
                _disabled={{ opacity: 0.4, cursor: "not-allowed" }}
              >
                Sau
              </Button>
            </HStack>
          </Flex>
        )}
      </Box>
    </Flex>
  )
}
