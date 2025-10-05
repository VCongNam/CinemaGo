import {
  Box,
  Container,
  Text,
  Button,
  Checkbox,
  CheckboxGroup,
  Grid,
  Image,
  Badge,
  VStack,
  HStack,
  Card,
  CardBody,
  Heading,
  Divider,
} from "@chakra-ui/react"
import { StarIcon, TimeIcon, CalendarIcon } from "@chakra-ui/icons"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import apiService from "../services/apiService"

const Homepage = () => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [featuredList, setFeaturedList] = useState([])
  const [featuredIndex, setFeaturedIndex] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 4 // 4 phim mỗi trang
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const navigate = useNavigate()

  // Lấy danh sách phim
  useEffect(() => {
    let isMounted = true
    setLoading(true)
    apiService.getPublic("/api/movies", {}, (data, success) => {
      if (!isMounted) return
      if (success) {
        setMovies(Array.isArray(data?.data) ? data.data : [])
        setError("")
      } else {
        const message = data?.message || "Không thể tải danh sách phim"
        setError(message)
      }
      setLoading(false)
    })
    // Lấy danh sách 3 movie nổi bật theo ID cho slide đầu trang
    const ids = [
      "68ce7c57b5418f1cb2dfddd9",
      "68ce7c57b5418f1cb2dfddd6",
      "68ce7c57b5418f1cb2dfddd3",
    ]

    const fetchById = (id) => new Promise((resolve) => {
      apiService.getById("/api/movies/", id, (data, success) => {
        resolve(success ? data?.data : null)
      })
    })

    // Lấy danh sách 3 movie nổi bật theo ID cho slide đầu trang
    Promise.all(ids.map(fetchById)).then((items) => {
      if (!isMounted) return
      setFeaturedList(items.filter(Boolean))
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Tự động đổi slide
  useEffect(() => {
    if (!featuredList.length) return
    const timer = setInterval(() => {
      setFeaturedIndex((prev) => (prev + 1) % featuredList.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [featuredList])

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return ""
    return `${minutes} phút`
  }

  // Lấy danh sách suất chiếu hôm nay
  const todayShowtimes = [
    ["10:00", "14:30", "18:00", "21:30"],
    ["11:00", "15:30", "19:00", "22:00"],
    ["12:00", "16:30", "20:00", "23:00"],
    ["13:00", "17:30", "21:00", "23:30"],
  ]

  // Lấy danh sách suất chiếu hôm nay
  const getRandomShowtimes = (index) => todayShowtimes[index % todayShowtimes.length]

  // Reset trang khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, selectedCategories, movies])

  // Read query params for search and categories
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ""
    const cats = params.get('cats') || ""
    setSearchQuery(q)
    setSelectedCategories(cats ? cats.split(',') : [])
  }, [location.search])

  const filteredMovies = movies.filter((m) => {
    // filter by categories (if any)
    if (selectedCategories && selectedCategories.length > 0) {
      const has = (m.genre || []).some((g) => selectedCategories.includes(g))
      if (!has) return false
    }
    // filter by search query in title
    if (searchQuery) {
      return (m.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  return (
    <Box bg="gray.50" pb={10}>
      <Box position="relative" height={{ base: "320px", md: "420px" }} bg="gray.900" mb={10} overflow="hidden">
        {featuredList[featuredIndex]?.poster_url && (
          <Box
            position="absolute"
            top={0}
            right={0}
            bottom={0}
            left={0}
            backgroundImage={`url(${featuredList[featuredIndex].poster_url})`}
            backgroundSize="cover"
            backgroundPosition="center"
            backgroundRepeat="no-repeat"
            zIndex={0}
          />
        )}
        <Box position="absolute" top={0} right={0} bottom={0} left={0} bg="blackAlpha.600" zIndex={1} />

        <Container maxW="1200px" position="relative" zIndex={2} height="100%">
          <HStack height="100%" align="center" spacing={10}>
            {featuredList[featuredIndex]?.poster_url && (
              <Image
                src={featuredList[featuredIndex].poster_url}
                alt={featuredList[featuredIndex]?.title || "featured"}
                display={{ base: "none", md: "block" }}
                boxSize="260px"
                objectFit="cover"
                borderRadius="md"
              />
            )}
            <VStack align="start" spacing={4} color="white" maxW={{ base: "100%", md: "55%" }}>
              <Heading size={{ base: "lg", md: "2xl" }}>Trải nghiệm điện ảnh đỉnh cao</Heading>
              <Text color="gray.200">
                Thưởng thức những bộ phim bom tấn với chất lượng hình ảnh 4K và âm thanh Dolby Atmos
              </Text>
              <HStack spacing={4}>
                <Button bg="orange.400" _hover={{ bg: "orange.500" }} onClick={() => {
                  const id = featuredList[featuredIndex]?._id
                  if (id) navigate(`/movies/${id}`)
                }}>
                  Đặt vé ngay
                </Button>
                <Button variant="outline" borderColor="gray.300" color="white" _hover={{ bg: "whiteAlpha.200" }}>
                  Xem lịch chiếu
                </Button>
              </HStack>
            </VStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="1200px">
        <Heading as="h2" size="xl" textAlign="center" mb={4}>
          Phim đang chiếu
        </Heading>

        {/* Category filter (multi-select checkboxes) */}
        {!loading && !error && (
          (() => {
            const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre || [])))
            return (
              <HStack spacing={3} justify="center" mb={6}>
                <Box overflowX="auto" w="full" maxW="900px" px={2}>
                  <CheckboxGroup
                    colorScheme="orange"
                    value={selectedCategories}
                    onChange={(vals) => {
                      // Chakra CheckboxGroup returns array of values
                      setSelectedCategories(Array.isArray(vals) ? vals : [vals])
                      setSelectedCategory("")
                    }}
                  >
                    <HStack spacing={4} wrap="nowrap">
                      {allGenres.map((g) => (
                        <Checkbox key={g} value={g} flex="0 0 auto">
                          {g}
                        </Checkbox>
                      ))}
                    </HStack>
                  </CheckboxGroup>
                </Box>

                <Button size="sm" variant="ghost" colorScheme="red" onClick={() => setSelectedCategories([])}>
                  Xóa chọn
                </Button>
              </HStack>
            )
          })()
        )}

        {loading && (
          <Text textAlign="center">Đang tải danh sách phim...</Text>
        )}

        {!!error && !loading && (
          <Text textAlign="center" color="red.500">{error}</Text>
        )}

        {!loading && !error && (
          <>
          <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
            {filteredMovies
              .slice((currentPage - 1) * pageSize, currentPage * pageSize)
              .map((movie, idx) => (
              <Card key={movie._id || idx} bg="gray.900" color="white" borderRadius="md">
                <Box position="relative">
                  <Image
                    src={movie.poster_url}
                    alt={movie.title}
                    borderTopRadius="md"
                    height="260px"
                    width="100%"
                    objectFit="cover"
                    fallbackSrc="https://via.placeholder.com/300x450?text=No+Image"
                  />
                  {movie.rating && (
                    <Badge position="absolute" top={2} left={2} bg="orange.400" color="white" px={2} py={1} borderRadius="md" display="flex" alignItems="center" gap={1}>
                      <StarIcon />
                      {movie.rating}
                    </Badge>
                  )}
                </Box>

                <CardBody>
                  <VStack align="start" spacing={3}>
                    <Heading size="md">{movie.title}</Heading>
                    <Text fontSize="sm" color="gray.300">
                      {(movie.genre || []).join(", ")}
                    </Text>
                    <HStack spacing={2} color="gray.300">
                      <TimeIcon />
                      <Text fontSize="sm">{formatDuration(movie.duration)}</Text>
                    </HStack>

                    <Divider borderColor="gray.700" />

                    <VStack align="start" spacing={2} width="100%">
                      <HStack color="gray.300" spacing={2}>
                        <CalendarIcon />
                        <Text fontSize="sm">Suất chiếu hôm nay:</Text>
                      </HStack>
                      <HStack wrap="wrap" spacing={2}>
                        {getRandomShowtimes(idx).map((time) => (
                          <Box key={time} px={2} py={1} borderRadius="md" bg="gray.800" fontSize="sm">
                            {time}
                          </Box>
                        ))}
                      </HStack>
                    </VStack>

                    <Button bg="orange.400" _hover={{ bg: "orange.500" }} width="100%" onClick={() => navigate(`/movies/${movie._id}`)}>
                      Xem chi tiết
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </Grid>

          {/* Pagination */}
          <HStack justify="center" spacing={2} mt={8}>
            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              isDisabled={currentPage === 1}
            >
              Trước
            </Button>
            {Array.from({ length: Math.max(1, Math.ceil(filteredMovies.length / pageSize)) }).map((_, i) => (
              <Button
                key={i}
                size="sm"
                variant={currentPage === i + 1 ? "solid" : "outline"}
                colorScheme={currentPage === i + 1 ? "orange" : undefined}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(Math.ceil(filteredMovies.length / pageSize), p + 1))}
              isDisabled={currentPage === Math.ceil(filteredMovies.length / pageSize) || filteredMovies.length === 0}
            >
              Sau
            </Button>
          </HStack>
          </>
        )}
      </Container>
    </Box>
  )
}

export default Homepage