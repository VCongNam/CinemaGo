import { Box, Button, Input, Text, VStack, HStack } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

export default function ShowtimeSelection() {
  const navigate = useNavigate();

  return (
    <VStack spacing={4} p={6} align="stretch">
      <Text fontSize="2xl" fontWeight="bold">
        Mua vé trực tuyến
      </Text>
      <Input placeholder="Nhập thành phố (ví dụ: Hà Nội)" />

      {/* Giả lập ngày chiếu */}
      <HStack spacing={2}>
        {["23/9", "24/9", "25/9"].map((date) => (
          <Button key={date} variant="outline">{date}</Button>
        ))}
      </HStack>

      {/* Giả lập danh sách rạp */}
      <Box borderWidth="1px" borderRadius="md" p={4}>
        <Text fontWeight="semibold">Beta Cinemas - Đan Phượng</Text>
        <HStack spacing={2} mt={2}>
          {["16:00", "18:30", "20:00"].map((time) => (
            <Button
              key={time}
              onClick={() => navigate("/booking/seats/123")}
            >
              {time}
            </Button>
          ))}
        </HStack>
      </Box>
    </VStack>
  );
}
