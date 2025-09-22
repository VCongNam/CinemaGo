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

const Login = () => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const toast = useToast()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Đăng nhập thành công!",
        status: "success",
        duration: 3000,
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
                Đăng nhập
              </Heading>

              <form onSubmit={handleSubmit} style={{ width: "100%" }}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
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
