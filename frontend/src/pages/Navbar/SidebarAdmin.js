import { VStack, Box, Link, Icon, Text, Flex } from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FaChartLine,
  FaUsers,
  FaUserTie,
  FaFilm,
  FaTicketAlt,
  FaFileAlt,
  FaClock,
} from "react-icons/fa";

export default function SidebarAdmin() {
  const location = useLocation();
  const activeColor = "orange.400";
  const hoverColor = "orange.500";

  const ADMIN_LINKS = [
    { to: "/admin/dashboard", label: "Báo cáo doanh thu", icon: FaChartLine },
    { to: "/admin/customers", label: "Thông tin khách hàng", icon: FaUsers },
    { to: "/admin/staffs", label: "Thông tin nhân viên", icon: FaUserTie },
    { to: "/movies", label: "Quản lý phim", icon: FaFilm },
    { to: "/showtimes", label: "Quản lý xuất chiếu", icon: FaClock },
    { to: "/bookings", label: "Quản lý đặt phim", icon: FaTicketAlt },
    { to: "/admin/reports", label: "Báo cáo khác", icon: FaFileAlt },
  ];

  return (
    <Box
      as="aside"
      w="260px"
      bg="#1a1d29"
      color="white"
      p={5}
      borderRight="1px solid"
      borderColor="gray.700"
      minH="100vh"
      position="sticky"
      top={0}
      left={0}
    >
      {/* Header */}
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
          Administrator
        </Text>
      </Box>

      {/* Navigation */}
      <VStack align="stretch" spacing={2}>
        {ADMIN_LINKS.map((link) => {
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
  );
}
