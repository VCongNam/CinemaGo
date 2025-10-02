import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import AdminLayout from "../layouts/AdminLayout"
import { Box, Heading, Text, Spinner } from "@chakra-ui/react"

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

  return (
    <AdminLayout>
      <Box p={6}>
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
    </AdminLayout>
  )
}

export default UserDetailPage