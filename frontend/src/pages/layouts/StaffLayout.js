import { Flex, Box } from "@chakra-ui/react";
import Sidebar from "../Navbar/Sidebar";

const staffLinks = [
  { to: "/staff/l1", label: "Bán vé Offline (L1)" },
  { to: "/staff/l2", label: "Quản lý suất chiếu (L2)" },
];

export default function StaffLayout({ children }) {
  return (
    <Flex h="100vh" direction="column" bg="#1a1d29" color="white">
      {/* Navbar với chủ đề dark */}
      <Navbar title="🎬 CinemeGo - Staff" />

      <Flex flex="1">
        {/* Sidebar dark */}
        <Sidebar
          links={staffLinks}
          bg="#111827"
          color="white"
          hoverColor="orange.400"
        />

        {/* Nội dung chính */}
        <Box
          flex="1"
          p={6}
          bg="#1a1d29"
          borderLeft="1px solid"
          borderColor="gray.700"
        >
          {children}
        </Box>
      </Flex>
    </Flex>
  );
}
