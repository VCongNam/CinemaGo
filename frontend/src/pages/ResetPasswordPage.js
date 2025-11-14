import { useState, useEffect } from "react";
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
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Center,
  Spinner,
} from "@chakra-ui/react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useNavigate, useSearchParams } from "react-router-dom";

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Kiểm tra token có tồn tại không
    if (!token) {
      setIsValidatingToken(false);
      setTokenValid(false);
      toast({
        title: "Lỗi",
        description: "Token không hợp lệ. Vui lòng kiểm tra lại link.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } else {
      // Token có trong URL, cho phép người dùng nhập mật khẩu
      setIsValidatingToken(false);
      setTokenValid(true);
    }
  }, [token, toast]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Vui lòng nhập đầy đủ thông tin",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu phải có ít nhất 6 ký tự",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);

    // Gọi API reset password - không cần auth header vì sử dụng token trong body
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${backendUrl}/reset-password-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          newPassword: newPassword,
        }),
      });

      const data = await response.json();
      
      setIsLoading(false);
      
      if (response.ok) {
        toast({
          title: "Thành công",
          description: data?.message || "Đặt lại mật khẩu thành công",
          status: "success",
          duration: 5000,
          isClosable: true,
        });
        // Redirect về trang login sau 2 giây
        setTimeout(() => {
          navigate("/admin/login");
        }, 2000);
      } else {
        toast({
          title: "Lỗi",
          description:
            data?.message ||
            "Đặt lại mật khẩu thất bại. Vui lòng thử lại.",
          status: "error",
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      setIsLoading(false);
      toast({
        title: "Lỗi",
        description: "Có lỗi xảy ra. Vui lòng thử lại sau.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (isValidatingToken) {
    return (
      <Center minH="100vh" bg="#0f1117">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

  if (!tokenValid) {
    return (
      <Center minH="100vh" bg="#0f1117" color="white">
        <Card bg="#1a1e29" maxW="500px" w="100%" mx={4}>
          <CardBody p={8}>
            <VStack spacing={4}>
              <Heading size="lg" color="orange.400" textAlign="center">
                Link không hợp lệ
              </Heading>
              <Text textAlign="center" color="gray.300">
                Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn. Vui lòng
                yêu cầu link mới.
              </Text>
              <Button
                colorScheme="orange"
                onClick={() => navigate("/admin/login")}
                mt={4}
              >
                Quay về trang đăng nhập
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Center>
    );
  }

  return (
    <Center minH="100vh" bg="#0f1117" color="white">
      <Container maxW="500px" py={8}>
        <Card bg="#1a1e29" boxShadow="0 0 15px rgba(255,140,0,0.15)">
          <CardBody p={8}>
            <VStack spacing={6} align="stretch">
              <Box textAlign="center">
                <Heading size="lg" color="orange.400" mb={2}>
                  Đặt lại mật khẩu
                </Heading>
                <Text color="gray.300" fontSize="sm">
                  Vui lòng nhập mật khẩu mới cho tài khoản của bạn
                </Text>
              </Box>

              <form onSubmit={handleSubmit}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel color="white">Mật khẩu mới</FormLabel>
                    <InputGroup>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Nhập mật khẩu mới"
                        bg="gray.800"
                        border="none"
                        color="white"
                        _placeholder={{ color: "gray.400" }}
                        _focus={{ bg: "gray.700", border: "1px solid orange.400" }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={
                            showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"
                          }
                          icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                          variant="ghost"
                          color="gray.400"
                          _hover={{ color: "white" }}
                          onClick={() => setShowPassword(!showPassword)}
                        />
                      </InputRightElement>
                    </InputGroup>
                    <Text fontSize="xs" color="gray.400" mt={1}>
                      Mật khẩu phải có ít nhất 6 ký tự
                    </Text>
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color="white">Xác nhận mật khẩu</FormLabel>
                    <InputGroup>
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Nhập lại mật khẩu mới"
                        bg="gray.800"
                        border="none"
                        color="white"
                        _placeholder={{ color: "gray.400" }}
                        _focus={{ bg: "gray.700", border: "1px solid orange.400" }}
                      />
                      <InputRightElement>
                        <IconButton
                          aria-label={
                            showConfirmPassword
                              ? "Ẩn mật khẩu"
                              : "Hiện mật khẩu"
                          }
                          icon={
                            showConfirmPassword ? <ViewOffIcon /> : <ViewIcon />
                          }
                          variant="ghost"
                          color="gray.400"
                          _hover={{ color: "white" }}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                        />
                      </InputRightElement>
                    </InputGroup>
                    {confirmPassword &&
                      newPassword !== confirmPassword &&
                      confirmPassword.length > 0 && (
                        <Text fontSize="xs" color="red.400" mt={1}>
                          Mật khẩu xác nhận không khớp
                        </Text>
                      )}
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="orange"
                    width="100%"
                    size="lg"
                    isLoading={isLoading}
                    loadingText="Đang xử lý..."
                    mt={4}
                  >
                    Đặt lại mật khẩu
                  </Button>

                  <Button
                    variant="ghost"
                    width="100%"
                    onClick={() => navigate("/admin/login")}
                  >
                    Quay về trang đăng nhập
                  </Button>
                </VStack>
              </form>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Center>
  );
};

export default ResetPasswordPage;

