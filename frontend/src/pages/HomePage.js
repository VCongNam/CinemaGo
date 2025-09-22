import {
  Box,
  Container,
  Text,
  Button,
  Grid,
  Image,
  Badge,
  VStack,
  HStack,
  Card,
  CardBody,
  Heading,
  Stack,
  Divider,
} from "@chakra-ui/react"
import { StarIcon, TimeIcon, CalendarIcon } from "@chakra-ui/icons"

const Homepage = () => {
  const movies = [
    {
      id: 1,
      title: "Avatar: The Way of Water",
      genre: "Hành động, Phiêu lưu",
      duration: "192 phút",
      rating: 8.5,
      image: "/avatar-movie-poster-blue-ocean-theme.jpg",
      showtimes: ["10:00", "14:30", "18:00", "21:30"],
    },
    {
      id: 2,
      title: "Top Gun: Maverick",
      genre: "Hành động, Drama",
      duration: "130 phút",
      rating: 9.0,
      image: "/top-gun-maverick-movie-poster-fighter-jet.jpg",
      showtimes: ["11:00", "15:30", "19:00", "22:00"],
    },
    {
      id: 3,
      title: "Black Panther",
      genre: "Hành động, Siêu anh hùng",
      duration: "161 phút",
      rating: 8.8,
      image: "/black-panther-poster.png",
      showtimes: ["12:00", "16:30", "20:00", "23:00"],
    },
    {
      id: 4,
      title: "The Batman",
      genre: "Hành động, Tội phạm",
      duration: "176 phút",
      rating: 8.7,
      image: "/the-batman-movie-poster-dark.jpg",
      showtimes: ["13:00", "17:30", "21:00", "23:30"],
    },
  ]

  const cinemas = [
    {
      name: "CINEMAGO Nguyễn Văn Cừ",
      address: "123 Nguyễn Văn Cừ, Q.5, TP.HCM",
      phone: "(028) 1234 5678",
      screens: 8,
    },
    {
      name: "CINEMAGO Vincom Center",
      address: "72 Lê Thánh Tôn, Q.1, TP.HCM",
      phone: "(028) 8765 4321",
      screens: 12,
    },
    {
      name: "CINEMAGO Times City",
      address: "458 Minh Khai, Hai Bà Trưng, Hà Nội",
      phone: "(024) 9876 5432",
      screens: 10,
    },
  ]

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bgImage="url('/cinematic-movie-theater-interior-with-red-seats-an.jpg')"
        bgSize="cover"
        bgPosition="center"
        position="relative"
        minH="70vh"
        display="flex"
        alignItems="center"
      >
        <Box position="absolute" top={0} left={0} right={0} bottom={0} bg="blackAlpha.600" />
        <Container maxW="1200px" position="relative" zIndex={1}>
          <VStack spacing={6} align="start" color="white">
            <Heading size="2xl" maxW="600px">
              Trải nghiệm điện ảnh đỉnh cao
            </Heading>
            <Text fontSize="xl" maxW="500px" opacity={0.9}>
              Thưởng thức những bộ phim bom tấn với chất lượng hình ảnh 4K và âm thanh Dolby Atmos
            </Text>
            <HStack spacing={4}>
              <Button bg="orange.400" color="white" size="lg" _hover={{ bg: "orange.500" }}>
                Đặt vé ngay
              </Button>
              <Button variant="outline" color="white" size="lg" _hover={{ bg: "whiteAlpha.200" }}>
                Xem lịch chiếu
              </Button>
            </HStack>
            <HStack spacing={8} pt={4}>
              <VStack spacing={1}>
                <Text fontSize="2xl" fontWeight="bold">
                  50+
                </Text>
                <Text fontSize="sm" opacity={0.8}>
                  Rạp chiếu
                </Text>
              </VStack>
              <VStack spacing={1}>
                <Text fontSize="2xl" fontWeight="bold">
                  Dolby Atmos
                </Text>
                <Text fontSize="sm" opacity={0.8}>
                  Âm thanh vòm
                </Text>
              </VStack>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Movies Section */}
      <Container maxW="1200px" py={16}>
        <VStack spacing={8}>
          <Heading textAlign="center" color="black">
            Phim đang chiếu
          </Heading>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
            {movies.map((movie) => (
              <Card key={movie.id} bg="gray.800" color="white" overflow="hidden">
                <Image src={movie.image || "/placeholder.svg"} alt={movie.title} h="300px" objectFit="cover" />
                <CardBody>
                  <Stack spacing={3}>
                    <HStack justify="space-between">
                      <Badge colorScheme="orange" variant="solid">
                        <HStack spacing={1}>
                          <StarIcon boxSize={3} />
                          <Text>{movie.rating}</Text>
                        </HStack>
                      </Badge>
                    </HStack>
                    <Heading size="md">{movie.title}</Heading>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.400">
                        {movie.genre}
                      </Text>
                      <HStack>
                        <TimeIcon boxSize={4} color="gray.400" />
                        <Text fontSize="sm" color="gray.400">
                          {movie.duration}
                        </Text>
                      </HStack>
                    </VStack>
                    <Divider borderColor="gray.600" />
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <CalendarIcon boxSize={4} color="orange.400" />
                        <Text fontSize="sm" fontWeight="bold">
                          Suất chiếu hôm nay:
                        </Text>
                      </HStack>
                      <HStack spacing={2} flexWrap="wrap">
                        {movie.showtimes.map((time) => (
                          <Button key={time} size="xs" variant="outline" colorScheme="orange">
                            {time}
                          </Button>
                        ))}
                      </HStack>
                    </VStack>
                    <Button bg="orange.400" color="white" _hover={{ bg: "orange.500" }} w="full">
                      Đặt vé
                    </Button>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </VStack>
      </Container>

      {/* Cinemas Section */}
      <Box bg="gray.800" py={16}>
        <Container maxW="1200px">
          <VStack spacing={8}>
            <Heading textAlign="center" color="white">
              Hệ thống rạp
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
              {cinemas.map((cinema, index) => (
                <Card key={index} bg="gray.700" color="white">
                  <CardBody>
                    <Stack spacing={3}>
                      <Heading size="md" color="orange.400">
                        {cinema.name}
                      </Heading>
                      <Text fontSize="sm">{cinema.address}</Text>
                      <Text fontSize="sm" color="gray.400">
                        {cinema.phone}
                      </Text>
                      <HStack justify="space-between">
                        <Text fontSize="sm">{cinema.screens} phòng chiếu</Text>
                        <Text fontSize="sm" color="green.400">
                          Đang hoạt động
                        </Text>
                      </HStack>
                    </Stack>
                  </CardBody>
                </Card>
              ))}
            </Grid>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

export default Homepage
