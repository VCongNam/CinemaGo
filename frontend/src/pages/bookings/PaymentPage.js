import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  Stack,
  Text,
  Divider,
  FormControl,
  FormLabel,
  Radio,
  RadioGroup,
  useToast,
} from "@chakra-ui/react";
import { useState } from "react";

export default function PaymentPage() {
  const [method, setMethod] = useState("credit");
  const toast = useToast();

  const handlePayment = () => {
    toast({
      title: "Thanh toán thành công!",
      description: "Cảm ơn bạn đã đặt vé tại CinemaGo 🎬",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };

  return (
    <Box maxW="lg" mx="auto" mt={10}>
      <Card shadow="md" borderRadius="xl">
        <CardHeader>
          <Text fontSize="xl" fontWeight="bold">
            Thanh toán
          </Text>
        </CardHeader>
        <Divider />
        <CardBody>
          <FormControl mb={5}>
            <FormLabel>Phương thức thanh toán</FormLabel>
            <RadioGroup value={method} onChange={setMethod}>
              <Stack direction="column">
                <Radio value="credit">Thẻ tín dụng / ghi nợ</Radio>
                <Radio value="momo">Momo</Radio>
                <Radio value="zalopay">ZaloPay</Radio>
              </Stack>
            </RadioGroup>
          </FormControl>

          {method === "credit" && (
            <Box mb={5}>
              <FormControl mb={3}>
                <FormLabel>Số thẻ</FormLabel>
                <Input placeholder="xxxx-xxxx-xxxx-xxxx" />
              </FormControl>
              <FormControl mb={3}>
                <FormLabel>Họ tên trên thẻ</FormLabel>
                <Input placeholder="Nguyen Van A" />
              </FormControl>
              <Stack direction="row" spacing={4}>
                <FormControl>
                  <FormLabel>MM/YY</FormLabel>
                  <Input placeholder="12/25" />
                </FormControl>
                <FormControl>
                  <FormLabel>CVV</FormLabel>
                  <Input placeholder="123" type="password" />
                </FormControl>
              </Stack>
            </Box>
          )}

          <Button colorScheme="teal" w="full" onClick={handlePayment}>
            Xác nhận thanh toán
          </Button>
        </CardBody>
      </Card>
    </Box>
  );
}
