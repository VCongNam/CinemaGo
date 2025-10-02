import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Tooltip,
} from "@chakra-ui/react";
import { Box, Heading, Flex, Button, Icon } from "@chakra-ui/react";
import { FaUsers, FaEye } from "react-icons/fa";

const UserTable = ({ users, onViewInfo, onToggleStatus }) => {
  return (
    <Box p={6} bg="#1a1d29" borderRadius="lg" shadow="md" color="white">
      <Flex align="center" mb={4} gap={2}>
        <Icon as={FaUsers} color="orange.400" boxSize={5} />
        <Heading size="md" color="orange.400">
          Danh sách người dùng
        </Heading>
      </Flex>
      <TableContainer>
        <Table variant="simple">
          <Thead bg="gray.800">
            <Tr>
              <Th color="orange.300">ID</Th>
              <Th color="orange.300">Tên</Th>
              <Th color="orange.300">Email</Th>
              <Th color="orange.300">Role</Th>
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
                <Td color="white">{user.role}</Td>
                <Td>
                  <Button
                    size="sm"
                    bg={user.status === "active" ? "green.500" : "red.500"}
                    color="white"
                    _hover={{
                      bg: user.status === "active" ? "green.600" : "red.600",
                    }}
                    onClick={() => onToggleStatus(user)}
                  >
                    {user.status === "active" ? "Hoạt động" : "Khóa"}
                  </Button>
                </Td>
                <Td>
                  <Flex gap={2}>
                    <Tooltip label="Xem thông tin" hasArrow>
                      <Button
                        size="sm"
                        bg="gray.600"
                        _hover={{ bg: "gray.700" }}
                        onClick={() => onViewInfo(user)}
                      >
                        <Icon as={FaEye} />
                      </Button>
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

export default UserTable;