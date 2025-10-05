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
  InputGroup,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react"
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import { Link as RouterLink, useNavigate } from "react-router-dom"
import apiService from "../services/apiService"
import authService from "../services/authService"

const Login = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [fpEmail, setFpEmail] = useState("")
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [fpStep, setFpStep] = useState(1) // 1 = request OTP, 2 = submit OTP+newPwd
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
                      autoComplete="username"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Mật khẩu</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        bg="gray.700"
                        border="none"
                        _focus={{ bg: "gray.600" }}
                        placeholder="Nhập mật khẩu"
                        autoComplete="current-password"
                      />
                      <InputRightElement>
                        <IconButton color="white" variant="ghost" aria-label={showPassword ? 'Hide' : 'Show'} icon={showPassword ? <ViewOffIcon /> : <ViewIcon />} onClick={() => setShowPassword(s => !s)} />
                      </InputRightElement>
                    </InputGroup>
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
                {!showForgot ? (
                  <Link href="#" color="orange.400" fontSize="sm" onClick={() => { setShowForgot(true); setFpStep(1); }}>
                    Quên mật khẩu?
                  </Link>
                ) : (
                  <Box w="full">
                    {fpStep === 1 && (
                      <VStack spacing={3} align="start">
                        <Text fontSize="sm">Nhập email để nhận mã OTP</Text>
                        <Input
                          value={fpEmail}
                          onChange={(e) => setFpEmail(e.target.value)}
                          bg="gray.700"
                          border="none"
                        />
                        <HStack>
                          <Button colorScheme="orange" onClick={() => {
                            if (!fpEmail) return toast({ title: 'Nhập email', status: 'warning' })
                            setIsLoading(true)
                            apiService.post('/forgot-password', { email: fpEmail }, (res, success) => {
                              setIsLoading(false)
                              if (success) {
                                toast({ title: res?.message || 'Yêu cầu OTP thành công', status: 'success' })
                                setFpStep(2)
                              } else {
                                toast({ title: res?.message || 'Lỗi', status: 'error' })
                              }
                            })
                          }}>Gửi OTP</Button>
                          <Button variant="ghost" onClick={() => { setShowForgot(false); setFpEmail(''); setOtp(''); setNewPassword(''); }}>Hủy</Button>
                        </HStack>
                      </VStack>
                    )}

                    {fpStep === 2 && (
                      <VStack spacing={3} align="start">
                        <Text fontSize="sm">Nhập mã OTP và mật khẩu mới</Text>
                        <Input value={otp} onChange={(e) => setOtp(e.target.value)} bg="gray.700" border="none" placeholder="OTP" />
                        <InputGroup>
                          <Input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} bg="gray.700" border="none" placeholder="Mật khẩu mới" type={showNewPassword ? 'text' : 'password'} />
                          <InputRightElement>
                            <IconButton color="white" variant="ghost" aria-label={showNewPassword ? 'Hide' : 'Show'} icon={showNewPassword ? <ViewOffIcon /> : <ViewIcon />} onClick={() => setShowNewPassword(s => !s)} />
                          </InputRightElement>
                        </InputGroup>
                        <HStack>
                          <Button colorScheme="orange" onClick={() => {
                            if (!fpEmail || !otp || !newPassword) return toast({ title: 'Nhập đầy đủ thông tin', status: 'warning' })
                            setIsLoading(true)
                            apiService.post('/reset-password', { email: fpEmail, otp, newPassword }, (res, success) => {
                              setIsLoading(false)
                              if (success) {
                                toast({ title: res?.message || 'Đổi mật khẩu thành công', status: 'success' })
                                setShowForgot(false)
                                setFpEmail('')
                                setOtp('')
                                setNewPassword('')
                                setFpStep(1)
                              } else {
                                toast({ title: res?.message || 'Lỗi', status: 'error' })
                              }
                            })
                          }}>Đổi mật khẩu</Button>
                          <Button variant="ghost" onClick={() => { setShowForgot(false); setFpEmail(''); setOtp(''); setNewPassword(''); setFpStep(1); }}>Hủy</Button>
                        </HStack>
                      </VStack>
                    )}
                  </Box>
                )}

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