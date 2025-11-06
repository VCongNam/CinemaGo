import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import authService from '../services/authService'; // Giả sử bạn có authService
import { useToast, Spinner, Center, VStack, Heading } from '@chakra-ui/react';

const SocialAuthSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const encodedUser = params.get('user');

    if (token && encodedUser) {
      try {
        // Giải mã thông tin user từ Base64
        const decodedUser = JSON.parse(atob(encodedUser));
        
        // Lưu thông tin xác thực, giống hệt luồng đăng nhập thường
        authService.setAuthData(token, decodedUser);

        toast({
          title: "Đăng nhập thành công!",
          description: `Chào mừng ${decodedUser.fullName || decodedUser.username}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Chuyển hướng về trang chủ và tải lại để cập nhật header
        navigate('/');
        setTimeout(() => window.location.reload(), 0);

      } catch (error) {
        console.error("Lỗi giải mã thông tin người dùng:", error);
        toast({ title: "Lỗi đăng nhập", description: "Dữ liệu người dùng không hợp lệ.", status: "error" });
        navigate('/login');
      }
    } else {
      toast({ title: "Lỗi đăng nhập", description: "Không nhận được thông tin xác thực.", status: "error" });
      navigate('/login');
    }
  }, [location, navigate, toast]);

  return (
    <Center h="calc(100vh - 140px)" bg="gray.900">
      <VStack spacing={4}>
        <Spinner size="xl" color="orange.400" />
        <Heading color="white" size="md">Đang xử lý đăng nhập...</Heading>
      </VStack>
    </Center>
  );
};

export default SocialAuthSuccess;