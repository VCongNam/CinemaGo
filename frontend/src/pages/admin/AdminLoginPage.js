import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Button, Input, Heading, FormControl, FormLabel, Alert } from "@chakra-ui/react"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const res = await fetch("http://localhost:5000/login-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại")
      localStorage.setItem("token", data.accessToken)
      navigate("/admin/dashboard") // Chuyển hướng sau khi đăng nhập thành công
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Box maxW="400px" mx="auto" mt={20} p={6} bg="white" borderRadius="lg" boxShadow="md">
      <Heading mb={6} size="md">Đăng nhập Admin</Heading>
      <form onSubmit={handleSubmit}>
        <FormControl mb={4}>
          <FormLabel>Tên đăng nhập</FormLabel>
          <Input value={username} onChange={e => setUsername(e.target.value)} required />
        </FormControl>
        <FormControl mb={4}>
          <FormLabel>Mật khẩu</FormLabel>
          <Input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </FormControl>
        {error && <Alert status="error" mb={4}>{error}</Alert>}
        <Button type="submit" colorScheme="teal" width="full">Đăng nhập</Button>
      </form>
    </Box>
  )
}