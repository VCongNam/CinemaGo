"use client"

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
import { Link as RouterLink } from "react-router-dom"

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Mật khẩu không khớp!",
        status: "error",
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Đăng ký thành công!",
        description: "Vui lòng kiểm tra email để xác thực tài khoản.",
        status: "success",
        duration: 5000,
        isClosable: true,
      })
    }, 1000)
  }

  return (
    <Box bg="gray.900" minH="calc(100vh - 140px)" py={16}>
      <Container maxW="400px">
        <Card bg="gray.800" color="white">
          <CardBody p={8}>
            <VStack spacing={6}>
              <Heading color="orange.400" textAlign="center">
                Đăng ký
              </Heading>

              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Họ và tên</FormLabel>
                    <Input
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      bg="gray.700"
                      border="none"
                      _focus={{ bg: "gray.600" }}
                      placeholder="Nhập họ và tên"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      bg="gray.700"
                      border="none"
                      _focus={{ bg: "gray.600" }}
                      placeholder="Nhập email của bạn"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Mật khẩu</FormLabel>
                    <Input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      bg="gray.700"
                      border="none"
                      _focus={{ bg: "gray.600" }}
                      placeholder="Nhập mật khẩu"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Xác nhận mật khẩu</FormLabel>
                    <Input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      bg="gray.700"
                      border="none"
                      _focus={{ bg: "gray.600" }}
                      placeholder="Nhập lại mật khẩu"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    bg="orange.400"
                    color="white"
                    _hover={{ bg: "orange.500" }}
                    w="full"
                    isLoading={isLoading}
                    loadingText="Đang đăng ký..."
                  >
                    Đăng ký
                  </Button>
                </VStack>
              </form>

              <VStack spacing={3}>
                <Divider borderColor="gray.600" />

                <HStack>
                  <Text fontSize="sm" color="gray.400">
                    Đã có tài khoản?
                  </Text>
                  <Link as={RouterLink} to="/login" color="orange.400" fontSize="sm">
                    Đăng nhập ngay
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

export default Register
