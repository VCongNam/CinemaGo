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


export default function AdminLoginPage() {
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
  localStorage.setItem("token", data.accessToken);
  navigate("/admin/dashboard");
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
                Đăng nhập Admin
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