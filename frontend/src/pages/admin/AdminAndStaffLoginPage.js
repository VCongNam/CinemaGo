import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Box,
  Container,
  Card,
  CardBody,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
} from "@chakra-ui/react"

export default function AdminAndStaffLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const res = await fetch("http://localhost:5000/login-staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      setIsLoading(false);
      
      if (!res.ok) throw new Error(data.message || "Đăng nhập thất bại");
      
      const accessToken = data.accessToken;
      const userRole = data.user?.role || "lv1";
      const userInfo = data.user || null;
      const normalizedRole = (userRole || "").toLowerCase();
      const isStaff =
        normalizedRole.startsWith("lv") || normalizedRole === "admin";

      // Lưu token theo cả 2 key để tương thích
      if (accessToken) {
        localStorage.setItem("token", accessToken);
        localStorage.setItem("accessToken", accessToken);
      }

      // Lưu role theo 2 cách để đảm bảo tương thích
      localStorage.setItem("role", JSON.stringify({ role: userRole }));
      localStorage.setItem("userRole", userRole);

      // Lưu cờ staff và thông tin người dùng để các trang staff sử dụng
      localStorage.setItem("isStaff", isStaff ? "true" : "false");
      if (userInfo) {
        localStorage.setItem("staff", JSON.stringify(userInfo));
        // Đồng bộ với authService để các hook/services tái sử dụng
        localStorage.setItem("user", JSON.stringify(userInfo));
      }
      
      // Console log để debug
      console.log("Login successful - Role:", userRole);
      
      // Điều hướng theo role
      if (userRole.toLowerCase() === "admin") {
        navigate("/admin/dashboard");
      } else if (userRole.toLowerCase() === "lv1") {
        navigate("/staff/l1");
      } else if (userRole.toLowerCase() === "lv2") {
        navigate("/staff/l2");
      } else {
        navigate("/admin/dashboard");
      }
      
      window.location.reload();
      
    } catch (err) {
      setIsLoading(false);
      setError(err.message);
    }
  };

  return (
    <Box bg="gray.900" minH="100vh">
      <Container maxW="400px" pt={16}>
        <Card bg="gray.800" color="white">
          <CardBody p={8}>
            <VStack spacing={6}>
              <Heading color="orange.400" textAlign="center">
                Đăng nhập Admin/Staff
              </Heading>
              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Tên đăng nhập</FormLabel>
                    <Input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      bg="gray.700"
                      border="none"
                      _focus={{ bg: "gray.600" }}
                      placeholder="Nhập tên đăng nhập"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Mật khẩu</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      bg="gray.700"
                      border="none"
                      _focus={{ bg: "gray.600" }}
                      placeholder="Nhập mật khẩu"
                    />
                  </FormControl>
                  {error && <Alert status="error" mb={2} width="full">{error}</Alert>}
                  <Button
                    type="submit"
                    bg="orange.400"
                    color="white"
                    _hover={{ bg: "orange.500" }}
                    w="full"
                    isLoading={isLoading}
                    loadingText="Đang đăng nhập..."
                  >
                    Đăng nhập
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
}