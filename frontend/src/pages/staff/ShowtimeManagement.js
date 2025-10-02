import {
  Box,
  Heading,
  Table,
  Button,
  Flex,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
} from "@chakra-ui/react";

import { useState } from "react";

const ShowtimeManagement = () => {
  const [showtimes] = useState([
    { id: 1, movie: "Avengers", room: "Room 1", time: "18:30" },
    { id: 2, movie: "Inception", room: "Room 2", time: "20:00" },
  ]);

  const toast = useToast();

  const handleDelete = (id) => {
    toast({
      title: "Suất chiếu đã xóa",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  return (
    <Box p={6}>
      <Heading mb={4}>Quản lý suất chiếu</Heading>
      <Table variant="striped">
        <Thead>
          <Tr>
            <Th>Phim</Th>
            <Th>Phòng</Th>
            <Th>Thời gian</Th>
            <Th>Hành động</Th>
          </Tr>
        </Thead>
        <Tbody>
          {showtimes.map((s) => (
            <Tr key={s.id}>
              <Td>{s.movie}</Td>
              <Td>{s.room}</Td>
              <Td>{s.time}</Td>
              <Td>
                <Flex gap={2}>
                  <Button size="sm" colorScheme="blue">
                    Sửa
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => handleDelete(s.id)}
                  >
                    Xóa
                  </Button>
                </Flex>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
};

export default ShowtimeManagement;
