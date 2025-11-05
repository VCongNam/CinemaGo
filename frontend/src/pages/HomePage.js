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
  Spinner,
  Flex,
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
  const pageSize = 9 // 9 phim mỗi trang (3 hàng x 3 phim)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedShowtimes, setSelectedShowtimes] = useState([])
  const [allShowtimes, setAllShowtimes] = useState([])
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

  // Lấy tất cả showtimes từ database
  useEffect(() => {
    let isMounted = true
    apiService.getPublic("/api/showtimes", {}, (data, success) => {
      if (!isMounted) return
      if (success) {
        setAllShowtimes(Array.isArray(data?.data) ? data.data : [])
      }
    })
    return () => { isMounted = false }
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

  // Lấy tất cả showtimes duy nhất của hôm nay
  const getAllUniqueShowtimes = () => {
    const allTimes = allShowtimes
      .filter(st => st.status === 'active' && isToday(st.start_time.vietnamFormatted))
      .map(st => {
        const timeMatch = st.start_time.vietnamFormatted.match(/^(\d{2}:\d{2})/)
        return timeMatch ? timeMatch[1] : st.start_time.vietnamFormatted.split(' ')[0]
      })

    return [...new Set(allTimes)].sort()
  }

  // Kiểm tra xem một ngày có phải hôm nay không (theo múi giờ Việt Nam)
  const isToday = (dateString) => {
    const today = new Date()
    const vietnamToday = new Date(today.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))

    // Parse date từ vietnamFormatted string (format: "09:30:00 14/10/2025")
    const dateMatch = dateString.match(/(\d{2}\/\d{2}\/\d{4})/)
    if (!dateMatch) return false

    const [day, month, year] = dateMatch[1].split('/')
    const showtimeDate = new Date(year, month - 1, day)

    return showtimeDate.toDateString() === vietnamToday.toDateString()
  }

  // Lấy showtimes cho một phim cụ thể trong ngày hôm nay (loại bỏ trùng lặp)
  const getMovieShowtimes = (movieId) => {
    const movieShowtimes = allShowtimes.filter((st) => {
      if (!st || st.status !== 'active') return false
      // movie_id can be an ObjectId (string) or a populated object; also may be null
      const movieIdMatches = (() => {
        const movieField = st.movie_id
        if (!movieField) return false
        if (typeof movieField === 'string') return movieField === movieId
        if (typeof movieField === 'object' && movieField._id) return movieField._id === movieId
        return false
      })()

      const vietnamFormatted = st?.start_time?.vietnamFormatted
      return movieIdMatches && typeof vietnamFormatted === 'string' && isToday(vietnamFormatted)
    })

    // Extract time từ vietnamFormatted string và loại bỏ trùng lặp
    const allTimes = movieShowtimes.map((st) => {
      const vf = st?.start_time?.vietnamFormatted || ''
      const timeMatch = vf.match(/^(\d{2}:\d{2})/)
      return timeMatch ? timeMatch[1] : (vf.split(' ')[0] || '')
    }).filter(Boolean)

    // Loại bỏ trùng lặp và sắp xếp
    const uniqueTimes = [...new Set(allTimes)].sort()
    return uniqueTimes
  }

  // Reset trang khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategory, selectedCategories, selectedShowtimes, movies])

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

    // filter by showtimes (if any)
    if (selectedShowtimes && selectedShowtimes.length > 0) {
      const movieShowtimes = getMovieShowtimes(m._id)
      const hasShowtime = selectedShowtimes.some((time) => movieShowtimes.includes(time))
      if (!hasShowtime) return false
    }

    // filter by search query in title
    if (searchQuery) {
      return (m.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({
      top: 0, // Cuộn về vị trí top của viewport
      behavior: 'smooth' // Cuộn mượt mà
    })
  }

  return (
    <Box bg="gray.900" minH="calc(100vh - 140px)">
      <Box position="relative" height={{ base: "320px", md: "420px" }} bg="gray.800" mb={10} overflow="hidden">
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
                boxSize="350px"
                objectFit="contain"
                borderRadius="md"
              />
            )}
            <VStack align="start" spacing={4} color="white" maxW={{ base: "100%", md: "55%" }}>
              <Heading size={{ base: "lg", md: "2xl" }} color="orange.400">Trải nghiệm điện ảnh đỉnh cao</Heading>
              <Text color="gray.200">
                Thưởng thức những bộ phim bom tấn với chất lượng hình ảnh 4K và âm thanh Dolby Atmos
              </Text>
              <HStack spacing={4}>
                <Button
                  bg="orange.400"
                  color="white"
                  _hover={{ bg: "orange.500" }}
                  onClick={() => {
                    const id = featuredList[featuredIndex]?._id
                    if (id) navigate(`/movies/${id}`)
                  }}
                >
                  Đặt vé ngay
                </Button>
              </HStack>
            </VStack>
          </HStack>
        </Container>
      </Box>

      <Container maxW="1400px" pb={10}>
        <Flex gap={6}>
          {/* Sidebar Filter */}
          <Box
            w="280px"
            flexShrink={0}
            position="sticky"
            top="20px"
            alignSelf="flex-start"
          >
            <Card bg="gray.800" color="white" border="1px solid" borderColor="gray.700">
              <CardBody p={6}>
                <VStack align="stretch" spacing={6}>
                  <HStack justify="space-between" align="center">
                    <Heading size="md" color="orange.400">Bộ lọc</Heading>
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="gray.600"
                      color="gray.300"
                      _hover={{ borderColor: "orange.400", color: "orange.400" }}
                      onClick={() => {
                        setSelectedCategories([])
                        setSelectedShowtimes([])
                      }}
                      isDisabled={selectedCategories.length === 0 && selectedShowtimes.length === 0}
                    >
                      Xóa tất cả
                    </Button>
                  </HStack>

                  {/* Thể loại phim - Luôn hiển thị */}
                  <Box>
                    <Text fontSize="md" color="gray.200" fontWeight="medium" mb={3}>
                      Thể loại phim
                    </Text>

                    {!loading && !error && (
                      (() => {
                        const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre || [])))
                        return (
                          <VStack align="stretch" spacing={3}>
                            <CheckboxGroup
                              colorScheme="orange"
                              value={selectedCategories}
                              onChange={(vals) => {
                                setSelectedCategories(Array.isArray(vals) ? vals : [vals])
                                setSelectedCategory("")
                              }}
                            >
                              <VStack align="stretch" spacing={2}>
                                {allGenres.map((genre) => (
                                  <Checkbox key={genre} value={genre} color="gray.300">
                                    <Text fontSize="sm">{genre}</Text>
                                  </Checkbox>
                                ))}
                              </VStack>
                            </CheckboxGroup>
                          </VStack>
                        )
                      })()
                    )}
                  </Box>

                  {/* Showtime - Luôn hiển thị */}
                  <Box>
                    <Text fontSize="md" color="gray.200" fontWeight="medium" mb={3}>
                      Showtime
                    </Text>

                    <VStack align="stretch" spacing={3}>
                      <Text fontSize="sm" color="gray.300" fontWeight="medium">
                        Chọn suất chiếu
                      </Text>
                      <CheckboxGroup
                        colorScheme="orange"
                        value={selectedShowtimes}
                        onChange={(vals) => {
                          setSelectedShowtimes(Array.isArray(vals) ? vals : [vals])
                          setSelectedCategory("")
                        }}
                      >
                        <VStack align="stretch" spacing={2}>
                          {getAllUniqueShowtimes().map((showtime) => (
                            <Checkbox key={showtime} value={showtime} color="gray.300">
                              <Text fontSize="sm">{showtime}</Text>
                            </Checkbox>
                          ))}
                        </VStack>
                      </CheckboxGroup>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* Main Content */}
          <Box flex="1">
            <Heading as="h2" size="xl" textAlign="center" mb={6} color="orange.400">
              Phim đang chiếu
            </Heading>

            {loading && (
              <Box textAlign="center" py={10}>
                <Spinner color="orange.400" size="xl" />
                <Text color="gray.300" mt={4}>Đang tải danh sách phim...</Text>
              </Box>
            )}

            {!!error && !loading && (
              <Text textAlign="center" color="red.400" py={10}>{error}</Text>
            )}

            {!loading && !error && (
              <>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap={6}>
                  {filteredMovies
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((movie, idx) => (
                      <Card key={movie._id || idx} bg="gray.800" color="white" borderRadius="md" border="1px solid" borderColor="gray.700">
                        <Box position="relative">
                          <Image
                            src={movie.poster_url}
                            alt={movie.title}
                            borderTopRadius="md"
                            height="350px"
                            width="100%"
                            objectFit="contain"
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
                            <Heading size="md" color="orange.400">{movie.title}</Heading>
                            <Text fontSize="sm" color="gray.300">
                              {(movie.genre || []).join(", ")}
                            </Text>
                            <HStack spacing={2} color="gray.300">
                              <TimeIcon />
                              <Text fontSize="sm">{formatDuration(movie.duration)}</Text>
                            </HStack>

                            <Divider borderColor="gray.600" />

                            <VStack align="start" spacing={2} width="100%">
                              <HStack color="gray.300" spacing={2}>
                                <CalendarIcon />
                                <Text fontSize="sm">Suất chiếu hôm nay:</Text>
                              </HStack>
                              <HStack wrap="wrap" spacing={2}>
                                {getMovieShowtimes(movie._id).length > 0 ? (
                                  getMovieShowtimes(movie._id).map((time) => (
                                    <Box key={time} px={2} py={1} borderRadius="md" bg="gray.700" fontSize="sm" color="white">
                                      {time}
                                    </Box>
                                  ))
                                ) : (
                                  <Text fontSize="sm" color="gray.400">Không có suất chiếu hôm nay</Text>
                                )}
                              </HStack>
                            </VStack>

                            <Button
                              bg="orange.400"
                              color="white"
                              _hover={{ bg: "orange.500" }}
                              width="100%"
                              onClick={() => navigate(`/movies/${movie._id}`)}
                            >
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
                    bg="gray.700"
                    color="gray.300"
                    border="1px solid"
                    borderColor="gray.600"
                    _hover={{ bg: "orange.400", borderColor: "orange.400", color: "white" }}
                    _disabled={{ bg: "gray.800", color: "gray.500", borderColor: "gray.700" }}
                    onClick={() => handlePageChange(currentPage - 1)}
                    isDisabled={currentPage === 1}
                  >
                    Trước
                  </Button>
                  {Array.from({ length: Math.max(1, Math.ceil(filteredMovies.length / pageSize)) }).map((_, i) => (
                    <Button
                      key={i}
                      size="sm"
                      bg={currentPage === i + 1 ? "orange.400" : "gray.700"}
                      color={currentPage === i + 1 ? "white" : "gray.300"}
                      border="1px solid"
                      borderColor={currentPage === i + 1 ? "orange.400" : "gray.600"}
                      _hover={{
                        bg: currentPage === i + 1 ? "orange.500" : "orange.400",
                        borderColor: "orange.400",
                        color: "white"
                      }}
                      onClick={() => handlePageChange(i + 1)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    size="sm"
                    bg="gray.700"
                    color="gray.300"
                    border="1px solid"
                    borderColor="gray.600"
                    _hover={{ bg: "orange.400", borderColor: "orange.400", color: "white" }}
                    _disabled={{ bg: "gray.800", color: "gray.500", borderColor: "gray.700" }}
                    onClick={() => handlePageChange(currentPage + 1)} 
                    isDisabled={currentPage === Math.ceil(filteredMovies.length / pageSize) || filteredMovies.length === 0}
                  >
                    Sau
                  </Button>
                </HStack>
              </>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default Homepage