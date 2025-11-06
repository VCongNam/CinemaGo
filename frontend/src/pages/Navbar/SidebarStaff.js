import {
  VStack,
  Box,
  Link,
  Icon,
  Text,
  Flex,
  Button,
  useDisclosure,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
  FormControl,
  FormLabel,
  useToast,
} from "@chakra-ui/react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaFilm,
  FaClock,
  FaTicketAlt,
  FaSignOutAlt,
  FaChevronUp,
  FaChevronDown,
  FaLock,
} from "react-icons/fa";
import { useRef, useState, useEffect } from "react";
import axios from "axios";

export default function SidebarStaff() {
  const location = useLocation();
  const navigate = useNavigate();
  const toast = useToast();

  const [username, setUsername] = useState("Tài khoản");
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [showChangePass, setShowChangePass] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
   const [isChangingPass, setIsChangingPass] = useState(false);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const activeColor = "orange.400";
  const hoverColor = "orange.500";

  // ✅ Lấy username từ localStorage
  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user"));
    if (storedUser && storedUser.username) {
      setUsername(storedUser.username);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.clear();
    onClose(); 
    setTimeout(() => {
      window.location.href = "/login";
    }, 100);
  };

  // ✅ Gọi API đổi mật khẩu (ngay trong modal)
   const handleChangePassword = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Vui lòng nhập đầy đủ thông tin.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mật khẩu mới không khớp.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      if (isChangingPass) return;
      setIsChangingPass(true);
      const token = localStorage.getItem("token");
      await axios.post(
        "http://localhost:5000//reset-password-link",
        { oldPassword, newPassword },
       {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
     // endpoint: PUT /api/user/change-password (tự chỉnh nếu backend khác)
      const res = await axios.put(
        "http://localhost:5000/api/user/change-password",
        { oldPassword, newPassword },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res?.data?.success === false) {
        throw new Error(res.data.message || "Đổi mật khẩu thất bại");
      }

      toast({
        title: "Đổi mật khẩu thành công!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowChangePass(false);
    } catch (error) {
      toast({
        title: "Đổi mật khẩu thất bại.",
        description: error.response?.data?.message || error.message || "Lỗi máy chủ.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const STAFF_LINKS = [
    { to: "/staff/l2", label: "Bán vé & Bắp nước", icon: FaShoppingCart },
    { to: "/movies", label: "Quản lý phim", icon: FaFilm },
    { to: "/showtimes", label: "Quản lý xuất chiếu", icon: FaClock },
    { to: "/bookings", label: "Quản lý đặt vé", icon: FaTicketAlt },
  ];

  return (
    <Flex
      as="aside"
      direction="column"
      justify="space-between"
      w="260px"
      bg="#11141d"
      color="white"
      borderRight="1px solid"
      borderColor="gray.700"
      h="100vh"
      position="sticky"
      top={0}
      left={0}
    >
      {/* Header */}
      <Box p={5}>
        <Box mb={8} pb={4} borderBottom="1px solid" borderColor="gray.700">
          <Text fontSize="2xl" fontWeight="bold" color="orange.400" mb={1}>
            CINEMAGO
          </Text>
          <Text
            fontSize="xs"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Staff Level 2
          </Text>
        </Box>

        {/* Navigation */}
        <VStack align="stretch" spacing={2}>
          {STAFF_LINKS.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                as={NavLink}
                to={link.to}
                p={3}
                borderRadius="lg"
                transition="all 0.2s"
                _hover={{
                  bg: hoverColor,
                  color: "white",
                  transform: "translateX(4px)",
                }}
                bg={isActive ? activeColor : "transparent"}
                fontWeight={isActive ? "bold" : "normal"}
                color={isActive ? "white" : "gray.400"}
                textDecoration="none"
                _focus={{ boxShadow: "none" }}
              >
                <Flex align="center" gap={3}>
                  <Icon
                    as={link.icon}
                    boxSize={5}
                    color={isActive ? "white" : "gray.300"}
                  />
                  <Text fontSize="sm">{link.label}</Text>
                </Flex>
              </Link>
            );
          })}
        </VStack>
      </Box>

      {/* Dropdown account menu */}
      <Box p={5} borderTop="1px solid" borderColor="gray.700">
        <Menu onOpen={() => setMenuOpen(true)} onClose={() => setMenuOpen(false)}>
          <MenuButton
            as={Button}
            w="100%"
            variant="outline"
            borderColor="gray.600"
            bg="#1a1d29"
            color="gray.200"
            _hover={{
              bg: "gray.700",
              color: "orange.300",
              borderColor: "orange.400",
            }}
            rightIcon={
              isMenuOpen ? (
                <FaChevronUp color="orange.300" />
              ) : (
                <FaChevronDown color="orange.300" />
              )
            }
          >
            {username}
          </MenuButton>
          <MenuList bg="#1a1d29" borderColor="gray.700">
            <MenuItem
              icon={<FaLock color="orange.300" />}
              _hover={{ bg: "orange.500", color: "white" }}
              onClick={() => setShowChangePass(true)}
            >
              Đổi mật khẩu
            </MenuItem>
            <MenuItem
              icon={<FaSignOutAlt color="red.400" />}
              _hover={{ bg: "red.500", color: "white" }}
              onClick={onOpen}
            >
              Đăng xuất
            </MenuItem>
          </MenuList>
        </Menu>
      </Box>

      {/* Logout confirm dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent bg="#1a1d29" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xác nhận đăng xuất
            </AlertDialogHeader>

            <AlertDialogBody>
              Bạn có chắc chắn muốn đăng xuất không?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Hủy
              </Button>
              <Button colorScheme="red" onClick={handleLogout} ml={3}>
                Đăng xuất
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Modal đổi mật khẩu */}
      {showChangePass && (
        <AlertDialog isOpen={showChangePass} onClose={() => setShowChangePass(false)}>
          <AlertDialogOverlay>
            <AlertDialogContent bg="#1a1d29" color="white">
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Đổi mật khẩu
              </AlertDialogHeader>

              <AlertDialogBody>
                <FormControl mb={3}>
                  <FormLabel>Mật khẩu hiện tại</FormLabel>
                  <Input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    bg="gray.800"
                    borderColor="gray.600"
                    placeholder="Nhập mật khẩu hiện tại"
                  />
                </FormControl>
                <FormControl mb={3}>
                  <FormLabel>Mật khẩu mới</FormLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    bg="gray.800"
                    borderColor="gray.600"
                    placeholder="Nhập mật khẩu mới"
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Nhập lại mật khẩu mới</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    bg="gray.800"
                    borderColor="gray.600"
                    placeholder="Xác nhận mật khẩu mới"
                  />
                </FormControl>
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button onClick={() => setShowChangePass(false)}>Hủy</Button>
                <Button colorScheme="orange" onClick={handleChangePassword} ml={3}>
                  Xác nhận
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      )}
    </Flex>
  );
}
