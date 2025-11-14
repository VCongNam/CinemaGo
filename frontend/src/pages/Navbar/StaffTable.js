import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tooltip,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
} from "@chakra-ui/react";
import { Box, Heading, Flex, Button, Icon, Badge } from "@chakra-ui/react";
import { FaUsers, FaEye, FaChevronDown, FaUserEdit, FaUndo } from "react-icons/fa";

const StaffTable = ({
   users,
    onViewInfo,
    onToggleStatus,
    onEditRole,
    onSendResetPassEmail,
     }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "green.500";
      case "suspended":
        return "orange.500";
      case "locked":
        return "red.500";
      default:
        return "gray.500";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "active":
        return "Hoạt động";
      case "suspended":
        return "Tạm ngưng";
      case "locked":
        return "Khóa";
      default:
        return "Không xác định";
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "LV1":
        return "Cấp 1";
      case "LV2":
        return "Cấp 2";
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "LV1":
        return "blue";
      case "LV2":
        return "purple";
      default:
        return "gray";
    }
  };

  return (
    <Box p={6} bg="#1a1d29" borderRadius="lg" shadow="md" color="white">
      <Flex align="center" mb={4} gap={2}>
        <Icon as={FaUsers} color="orange.400" boxSize={5} />
        <Heading size="md" color="orange.400">
          Danh sách nhân viên
        </Heading>
      </Flex>
      <TableContainer>
        <Table variant="simple">
          <Thead bg="gray.800">
            <Tr>
              <Th color="orange.300">ID</Th>
              <Th color="orange.300">Tên</Th>
              <Th color="orange.300">Email</Th>
              <Th color="orange.300">Vai trò</Th>
              <Th color="orange.300">Trạng thái</Th>
              <Th color="orange.300">Thao tác</Th>
            </Tr>
          </Thead>
          <Tbody>
            {users.map((user) => (
              <Tr
                key={user.id}
                _hover={{ bg: "gray.700" }}
                transition="0.2s ease"
              >
                <Td color="white">{user.id}</Td>
                <Td color="white">{user.username}</Td>
                <Td color="white">{user.email}</Td>
                <Td>
                  <Badge colorScheme={getRoleColor(user.role)} px={2} py={1} borderRadius="md">
                    {getRoleLabel(user.role)}
                  </Badge>
                </Td>
                <Td>
                  <Menu>
                    <MenuButton
                      as={Button}
                      size="sm"
                      bg={getStatusColor(user.status)}
                      color="white"
                      rightIcon={<FaChevronDown />}
                      _hover={{
                        opacity: 0.8,
                      }}
                      _active={{
                        bg: getStatusColor(user.status),
                      }}
                    >
                      {getStatusLabel(user.status)}
                    </MenuButton>
                    <MenuList bg="gray.800" borderColor="gray.700">
                      <MenuItem
                        bg="gray.800"
                        _hover={{ bg: "gray.700" }}
                        onClick={() => onToggleStatus(user, "active")}
                        isDisabled={user.status === "active"}
                      >
                        Kích hoạt
                      </MenuItem>
                      <MenuItem
                        bg="gray.800"
                        _hover={{ bg: "gray.700" }}
                        onClick={() => onToggleStatus(user, "suspended")}
                        isDisabled={user.status === "suspended"}
                      >
                        Tạm ngưng
                      </MenuItem>
                      <MenuItem
                        bg="gray.800"
                        _hover={{ bg: "gray.700" }}
                        onClick={() => onToggleStatus(user, "locked")}
                        isDisabled={user.status === "locked"}
                      >
                        Khóa
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Td>
                <Td>
                  <Flex gap={2}>
                    <Tooltip label="Xem thông tin" hasArrow>
                      <IconButton
                        icon={<FaEye />}
                        size="sm"
                        bg="gray.600"
                        _hover={{ bg: "gray.700" }}
                        onClick={() => onViewInfo(user)}
                      />
                    </Tooltip>
                    <Tooltip label="Cập nhật vai trò" hasArrow>
                      <IconButton
                        icon={<FaUserEdit />}
                        size="sm"
                        colorScheme="blue"
                        variant="ghost"
                        _hover={{ bg: "blue.600" }}
                        onClick={() => onEditRole(user)}
                      />
                    </Tooltip>
                    <Tooltip label="Gửi Mail Khôi phục MK" hasArrow>
                      <IconButton
                        icon={<FaUndo />}
                        size="sm"
                        colorScheme="red"
                        variant="solid"
                        onClick={() => onSendResetPassEmail(user)}
                      />
                    </Tooltip>
                  </Flex>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default StaffTable;