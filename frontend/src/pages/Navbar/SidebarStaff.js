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
} from "@chakra-ui/react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  FaShoppingCart,
  FaFilm,
  FaClock,
  FaTicketAlt,
  FaSignOutAlt,
} from "react-icons/fa";
import { useRef } from "react";

export default function SidebarStaff() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeColor = "orange.400";
  const hoverColor = "orange.500";

  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.clear();
    navigate("/login");
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
      bg="#1a1d29"
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
                color={isActive ? "white" : "gray.300"}
                textDecoration="none"
                _focus={{ boxShadow: "none" }}
              >
                <Flex align="center" gap={3}>
                  {link.icon && <Icon as={link.icon} boxSize={5} />}
                  <Text fontSize="sm">{link.label}</Text>
                </Flex>
              </Link>
            );
          })}
        </VStack>
      </Box>

      {/* Logout button */}
      <Box p={5} borderTop="1px solid" borderColor="gray.700">
        <Button
          w="100%"
          colorScheme="red"
          leftIcon={<FaSignOutAlt />}
          onClick={onOpen}
        >
          Đăng xuất
        </Button>
      </Box>

      {/* Logout confirm dialog */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
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
    </Flex>
  );
}
