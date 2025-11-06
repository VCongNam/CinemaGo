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
  const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';

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
                  <HStack w="full" align="center">
                    <Divider borderColor="gray.600" />
                    <Text color="gray.400" whiteSpace="nowrap" px={2}>hoặc</Text>
                    <Divider borderColor="gray.600" />
                  </HStack>

                  <Button
                    as="a"
                    href={`${backendUrl}/auth/google`}
                    w="full"
                    colorScheme="red" // Google's color scheme
                    leftIcon={<svg width="18" height="18" viewBox="0 0 18 18" fill="currentColor"><path d="M17.64,9.2c0-0.63-0.06-1.25-0.16-1.84H9.18v3.48h4.79c-0.2,1.12-0.84,2.07-1.84,2.72v2.26h2.91C16.8,14.7,17.64,12.14,17.64,9.2z"></path><path d="M9.18,18c2.43,0,4.47-0.8,5.96-2.18l-2.91-2.26c-0.8,0.54-1.84,0.86-2.96,0.86c-2.28,0-4.21-1.54-4.9-3.61H1.28v2.33C2.74,16.1,5.7,18,9.18,18z"></path><path d="M4.28,10.89c-0.11-0.33-0.17-0.68-0.17-1.04s0.06-0.71,0.17-1.04V6.48H1.28C0.47,8.04,0,9.85,0,11.82s0.47,3.78,1.28,5.34L4.28,10.89z"></path><path d="M9.18,3.36c1.32,0,2.52,0.45,3.46,1.35l2.59-2.59C13.65,0.8,11.61,0,9.18,0C5.7,0,2.74,1.9,1.28,4.66l3,2.33C4.97,4.9,6.9,3.36,9.18,3.36z"></path></svg>}
                  >
                    Đăng nhập với Google
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