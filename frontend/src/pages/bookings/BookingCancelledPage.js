import { Box, Button, Heading, VStack, Icon } from "@chakra-ui/react";
import { CheckCircleIcon } from '@chakra-ui/icons';
import { useNavigate } from "react-router-dom";

const BookingCancelledPage = () => {
  const navigate = useNavigate();

  return (
    <Box textAlign="center" py={10} px={6} bg="#0f1117" minH="100vh" color="white">
      <VStack spacing={4}>
        <Icon as={CheckCircleIcon} w={20} h={20} color="red.500" />
        <Heading as="h2" size="xl" mt={6} mb={2}>
          Hủy đặt vé thành công
        </Heading>
        <Button
          colorScheme="pink"
          onClick={() => navigate("/")}
        >
          Quay về trang chủ
        </Button>
      </VStack>
    </Box>
  );
};

export default BookingCancelledPage;
