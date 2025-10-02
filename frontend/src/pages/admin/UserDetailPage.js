import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import Sidebar from "../Navbar/Sidebar";
import { Box, Heading, Text, Spinner, Flex } from "@chakra-ui/react"

const UserDetailPage = () => {
  const { id } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const token = localStorage.getItem("token")
    fetch(`http://localhost:5000/users/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` })
      }
    })
      .then(res => {
        if (!res.ok) throw new Error("Network response was not ok")
        return res.json()
      })
      .then(data => setUser(data.data)) // Sửa ở đây
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

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
        <Heading mb={4}>Thông tin tài khoản</Heading>
        {loading && <Spinner />}
        {error && <Text color="red.400">{error}</Text>}
        {user && (
          <Box bg="gray.800" p={6} borderRadius="lg" color="white">
            <Text><b>ID:</b> {user.id}</Text>
            <Text><b>Tên:</b> {user.username}</Text>
            <Text><b>Email:</b> {user.email}</Text>
            <Text><b>Role:</b> {user.role}</Text>
            <Text><b>Trạng thái:</b> {user.status}</Text>
            <Text><b>Ngày tạo:</b> {user.createdAt}</Text>
          </Box>
        )}
      </Box>
    </Flex>
  )
}

export default UserDetailPage