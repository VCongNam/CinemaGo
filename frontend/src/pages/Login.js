import { useState } from "react"
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
  Text,
  Link,
  Divider,
  HStack,
  useToast,
} from "@chakra-ui/react"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import apiService from "../services/apiService"
import authService from "../services/authService"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      apiService.post('/login-customer', {
        username: username,
        password: password
      }, (response, success) => {
        setIsLoading(false)
        if (success && response) {
          authService.setAuthData(response.accessToken, response.user)
          toast({
            title: "Đăng nhập thành công!",
            description: `Chào mừng ${response.user.username}`,
            status: "success",
            duration: 3000,
            isClosable: true,
          })
          navigate('/')
          setTimeout(() => window.location.reload(), 0)
        } else {
          const errorMessage = response?.message || "Đăng nhập thất bại"
          toast({
            title: "Lỗi đăng nhập",
            description: errorMessage,
            status: "error",
            duration: 5000,
            isClosable: true,
          })
        }
      })
    } catch (error) {
      setIsLoading(false)
      toast({
        title: "Lỗi kết nối",
        description: "Không thể kết nối đến server",
        status: "error",
        duration: 5000,
        isClosable: true,
      })
    }
  }

  return (
    <Box bg="gray.900" minH="calc(100vh - 140px)" py={16}>
      <Container maxW="400px">
        <Card bg="gray.800" color="white">
          <CardBody p={8}>
            <VStack spacing={6}>
              <Heading color="orange.400" textAlign="center">
                Đăng nhập
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
                  {/* Nút chuyển sang trang đăng nhập admin */}
                  <Button
                    as={RouterLink}
                    to="/admin/login"
                    variant="outline"
                    colorScheme="orange"
                    w="full"
                  >
                    Đăng nhập Admin
                  </Button>
                </VStack>
              </form>

              <VStack spacing={3}>
                <Link href="#" color="orange.400" fontSize="sm">
                  Quên mật khẩu?
                </Link>

                <Divider borderColor="gray.600" />

                <HStack>
                  <Text fontSize="sm" color="gray.400">
                    Chưa có tài khoản?
                  </Text>
                  <Link as={RouterLink} to="/register" color="orange.400" fontSize="sm">
                    Đăng ký ngay
                  </Link>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  )
}

export default Login