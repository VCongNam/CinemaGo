import { VStack, Box, Link, Icon, Text, Flex } from "@chakra-ui/react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  FaChartLine, 
  FaUsers, 
  FaUserTie, 
  FaFilm, 
  FaTicketAlt, 
  FaFileAlt 
} from "react-icons/fa";

const ADMIN_LINKS = [
  { to: "/admin/dashboard", label: "Báo cáo doanh thu", icon: FaChartLine },
  { to: "/admin/customers", label: "Thông tin khách hàng", icon: FaUsers },
  { to: "/admin/staffs", label: "Thông tin nhân viên", icon: FaUserTie },
  { to: "/admin/movies", label: "Quản lý phim", icon: FaFilm },
  { to: "/showtimes", label: "Quản lý xuất chiếu", icon: FaFilm },
  { to: "/admin/bookings", label: "Quản lý đặt phim", icon: FaTicketAlt },
  { to: "/admin/reports", label: "Báo cáo khác", icon: FaFileAlt },
];

export default function Sidebar() {
  const location = useLocation();
  
  // Use provided links or default to ADMIN_LINKS
  const menuLinks = ADMIN_LINKS;

  return (
    <Box
      as="aside"
      w="250px"
      bg="#1a1d29"
      color="white"
      p={4}
      borderRight="1px solid"
      borderColor="gray.700"
      minH="100vh"
    >
      <VStack align="stretch" spacing={2}>
        {menuLinks.map((link) => {
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
                bg: "orange.500", 
                color: "white",
                transform: "translateX(4px)"
              }}
              bg={isActive ? "orange.400" : "transparent"}
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