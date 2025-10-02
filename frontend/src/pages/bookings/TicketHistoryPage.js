import {
  Box,
  Heading,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@chakra-ui/react";


import CustomerLayout from "../layouts/CustomerLayout";

const mockTransactions = [
  {
    id: "TXN001",
    date: "2025-09-15",
    movie: "The Wandering Star",
    seat: "A5",
    total: 120000,
    status: "paid",
  },
  {
    id: "TXN002",
    date: "2025-09-10",
    movie: "Neon Nights",
    seat: "C8",
    total: 100000,
    status: "refunded",
  },
];

export default function TicketHistoryPage() {
  return (
    <CustomerLayout>
      <Heading mb={4}>Lịch sử giao dịch</Heading>
      <Box bg="white" p={4} borderRadius="lg" shadow="sm">
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Mã GD</Th>
              <Th>Ngày</Th>
              <Th>Phim</Th>
              <Th>Ghế</Th>
              <Th>Giá</Th>
              <Th>Trạng thái</Th>
            </Tr>
          </Thead>
          <Tbody>
            {mockTransactions.map((t) => (
              <Tr key={t.id}>
                <Td>{t.id}</Td>
                <Td>{t.date}</Td>
                <Td>{t.movie}</Td>
                <Td>{t.seat}</Td>
                <Td>{t.total.toLocaleString("vi-VN")} ₫</Td>
                <Td>
                  <Badge colorScheme={t.status === "paid" ? "green" : "red"}>
                    {t.status}
                  </Badge>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </CustomerLayout>
  );
}