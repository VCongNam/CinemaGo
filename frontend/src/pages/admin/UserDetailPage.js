import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Heading,
  Text,
  Spinner,
  Flex,
  VStack,
  HStack,
  Badge,
  Button,
  Divider,
  Center,
} from "@chakra-ui/react";
import { useAdminAuth } from "../../hooks/useAdminAuth";

const UserDetailPage = () => {
  const isAuthorized = useAdminAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthorized) return;
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/users/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => setUser(data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isAuthorized]);

  // Hàm hiển thị badge theo trạng thái
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge colorScheme="green" px={3} py={1} borderRadius="lg">
            Hoạt động
          </Badge>
        );
      case "locked":
        return (
          <Badge colorScheme="red" px={3} py={1} borderRadius="lg">
            Bị khóa
          </Badge>
        );
      case "suspended":
        return (
          <Badge
            bg="orange.400"
            color="white"
            px={3}
            py={1}
            borderRadius="lg"
            _hover={{ bg: "orange.500" }}
          >
            Tạm ngưng
          </Badge>
        );
      default:
        return (
          <Badge colorScheme="gray" px={3} py={1} borderRadius="lg">
            Không xác định
          </Badge>
        );
    }
  };

  if (!isAuthorized) {
    return (
      <Center minH="100vh" bg="#0f1117">
        <Spinner size="xl" color="orange.400" />
      </Center>
    );
  }

  return (
    <Flex
      bg="#0f1117"
      color="white"
      minH="100vh"
      justify="center"
      align="center"
      p={8}
    >
      <Box
        bg="#1a1e29"
        p={10}
        borderRadius="2xl"
        boxShadow="0 0 15px rgba(255,140,0,0.15)"
        maxW="600px"
        w="100%"
      >
        <Heading
          mb={6}
          color="#ff8c00"
          fontSize="2xl"
          textAlign="center"
          letterSpacing="wide"
        >
          Thông tin tài khoản
        </Heading>

        {loading && (
          <Flex justify="center" align="center" py={10}>
            <Spinner size="xl" color="#ff8c00" />
          </Flex>
        )}

        {error && (
          <Text color="red.400" textAlign="center" fontSize="lg">
            {error}
          </Text>
        )}

        {user && (
          <VStack align="start" spacing={4}>
            <HStack>
              <Text fontWeight="bold" color="gray.300" w="140px">
                ID:
              </Text>
              <Text>{user.id}</Text>
            </HStack>
            <Divider borderColor="gray.700" />

            <HStack>
              <Text fontWeight="bold" color="gray.300" w="140px">
                Tên:
              </Text>
              <Text>{user.username}</Text>
            </HStack>

            <HStack>
              <Text fontWeight="bold" color="gray.300" w="140px">
                Email:
              </Text>
              <Text>{user.email}</Text>
            </HStack>

            <HStack>
              <Text fontWeight="bold" color="gray.300" w="140px">
                Role:
              </Text>
              <Text>{user.role}</Text>
            </HStack>

            <HStack>
              <Text fontWeight="bold" color="gray.300" w="140px">
                Trạng thái:
              </Text>
              {getStatusBadge(user.status)}
            </HStack>

            <HStack>
              <Text fontWeight="bold" color="gray.300" w="140px">
                Ngày tạo:
              </Text>
              <Text>
                {new Date(user.createdAt).toLocaleString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </HStack>
          </VStack>
        )}

        <Flex justify="center" mt={8}>
          <Button
            bg="#ff8c00"
            _hover={{ bg: "#ffa733" }}
            color="white"
            px={8}
            borderRadius="lg"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </Button>
        </Flex>
      </Box>
    </Flex>
  );
};

export default UserDetailPage;
