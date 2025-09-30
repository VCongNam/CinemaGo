import { Box, Container, Grid, GridItem, Text, Link, VStack, HStack, Icon, Divider } from "@chakra-ui/react"
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube } from "react-icons/fa"

const Footer = () => {
  return (
    <Box bg="gray.900" color="white" py={10}>
      <Container maxW="1200px">
        <Grid templateColumns={{ base: "1fr", md: "repeat(4, 1fr)" }} gap={8}>
          {/* Logo và mô tả */}
          <GridItem>
            <VStack align="start" spacing={4}>
              <Text fontSize="2xl" fontWeight="bold" color="orange.400">
                CINEMAGO
              </Text>
              <Text fontSize="sm" color="gray.400">
                Hệ thống rạp chiếu phim hiện đại với công nghệ Dolby Atmos và hình ảnh 4K sắc nét.
              </Text>
              <HStack spacing={4}>
                <Link href="#" _hover={{ color: "orange.400" }}>
                  <Icon as={FaFacebook} boxSize={5} />
                </Link>
                <Link href="#" _hover={{ color: "orange.400" }}>
                  <Icon as={FaInstagram} boxSize={5} />
                </Link>
                <Link href="#" _hover={{ color: "orange.400" }}>
                  <Icon as={FaTwitter} boxSize={5} />
                </Link>
                <Link href="#" _hover={{ color: "orange.400" }}>
                  <Icon as={FaYoutube} boxSize={5} />
                </Link>
              </HStack>
            </VStack>
          </GridItem>

          {/* Phim */}
          <GridItem>
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold" color="orange.400">
                Phim
              </Text>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Phim đang chiếu
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Phim sắp chiếu
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Phim IMAX
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Phim 4DX
              </Link>
            </VStack>
          </GridItem>

          {/* Rạp chiếu */}
          <GridItem>
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold" color="orange.400">
                Rạp chiếu
              </Text>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                TP. Hồ Chí Minh
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Hà Nội
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Đà Nẵng
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Cần Thơ
              </Link>
            </VStack>
          </GridItem>

          {/* Hỗ trợ */}
          <GridItem>
            <VStack align="start" spacing={3}>
              <Text fontWeight="bold" color="orange.400">
                Hỗ trợ
              </Text>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Liên hệ
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Câu hỏi thường gặp
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Chính sách bảo mật
              </Link>
              <Link href="#" fontSize="sm" _hover={{ color: "orange.400" }}>
                Điều khoản sử dụng
              </Link>
            </VStack>
          </GridItem>
        </Grid>

        <Divider my={8} borderColor="gray.700" />

        <Text textAlign="center" fontSize="sm" color="gray.400">
          © 2024 CINEMAGO. Tất cả quyền được bảo lưu.
        </Text>
      </Container>
    </Box>
  )
}

export default Footer