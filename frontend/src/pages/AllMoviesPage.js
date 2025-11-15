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
  Select,
  Input,
  InputGroup,
  InputLeftElement,
} from "@chakra-ui/react"
import { StarIcon, TimeIcon, CalendarIcon, SearchIcon } from "@chakra-ui/icons"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import apiService from "../services/apiService"

const AllMoviesPage = () => {
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 12 // 12 phim mỗi trang
  const [selectedCategories, setSelectedCategories] = useState([])
  const [statusFilter, setStatusFilter] = useState("all") // all, active, upcoming
  const [sortBy, setSortBy] = useState("newest") // newest, oldest, title_asc, title_desc
  const navigate = useNavigate()
  const location = useLocation()
  const [searchQuery, setSearchQuery] = useState("")

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
    return () => {
      isMounted = false
    }
  }, [])

  // Read query params for search
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('q') || ""
    setSearchQuery(q)
  }, [location.search])

  // Reset trang khi thay đổi filter
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedCategories, statusFilter, sortBy, searchQuery])

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return ""
    return `${minutes} phút`
  }

  const formatDate = (dateObj) => {
    if (!dateObj) return ""
    // Nếu là object có property utc
    if (typeof dateObj === 'object' && dateObj.utc) {
      const date = new Date(dateObj.utc)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleDateString("vi-VN")
    }
    // Nếu là string hoặc number
    if (typeof dateObj === 'string' || typeof dateObj === 'number') {
      const date = new Date(dateObj)
      if (isNaN(date.getTime())) return ""
      return date.toLocaleDateString("vi-VN")
    }
    return ""
  }

  const filteredMovies = movies.filter((m) => {
    // Filter by status
    if (statusFilter === "active" && m.status !== "active") return false
    if (statusFilter === "upcoming" && m.status !== "upcoming") return false

    // Filter by categories
    if (selectedCategories && selectedCategories.length > 0) {
      const has = (m.genre || []).some((g) => selectedCategories.includes(g))
      if (!has) return false
    }

    // Filter by search query
    if (searchQuery) {
      return (m.title || "").toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  // Helper function to get date value for sorting
  const getDateValue = (dateObj) => {
    if (!dateObj) return 0
    if (typeof dateObj === 'object' && dateObj.utc) {
      return new Date(dateObj.utc).getTime()
    }
    if (typeof dateObj === 'string' || typeof dateObj === 'number') {
      return new Date(dateObj).getTime()
    }
    return 0
  }

  // Sort movies
  const sortedMovies = [...filteredMovies].sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return getDateValue(b.release_date) - getDateValue(a.release_date)
      case "oldest":
        return getDateValue(a.release_date) - getDateValue(b.release_date)
      case "title_asc":
        return (a.title || "").localeCompare(b.title || "")
      case "title_desc":
        return (b.title || "").localeCompare(a.title || "")
      default:
        return 0
    }
  })

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  const handleSearch = (e) => {
    if (e.key === 'Enter') {
      const params = new URLSearchParams()
      if (searchQuery) params.set('q', searchQuery)
      navigate(`/all-movies?${params.toString()}`)
    }
  }

  // Get all unique genres
  const allGenres = Array.from(new Set(movies.flatMap((m) => m.genre || [])))

  return (
    <Box bg="gray.900" minH="calc(100vh - 140px)" py={8}>
      <Container maxW="1400px">
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
                  <Heading size="md" color="orange.400">Bộ lọc</Heading>

                  {/* Search */}
                  <Box>
                    <Text fontSize="md" color="gray.200" fontWeight="medium" mb={3}>
                      Tìm kiếm
                    </Text>
                    <InputGroup>
                      <InputLeftElement pointerEvents="none">
                        <SearchIcon color="gray.400" />
                      </InputLeftElement>
                      <Input
                        placeholder="Tìm phim..."
                        bg="gray.700"
                        border="none"
                        color="white"
                        _placeholder={{ color: "gray.400" }}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={handleSearch}
                      />
                    </InputGroup>
                  </Box>

                  {/* Status Filter */}
                  <Box>
                    <Text fontSize="md" color="gray.200" fontWeight="medium" mb={3}>
                      Trạng thái
                    </Text>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      bg="gray.700"
                      border="none"
                      color="white"
                    >
                      <option value="all" style={{ background: "#1a202c", color: "#fff" }}>Tất cả</option>
                      <option value="active" style={{ background: "#1a202c", color: "#fff" }}>Đang chiếu</option>
                      <option value="upcoming" style={{ background: "#1a202c", color: "#fff" }}>Sắp chiếu</option>
                    </Select>
                  </Box>

                  {/* Sort */}
                  <Box>
                    <Text fontSize="md" color="gray.200" fontWeight="medium" mb={3}>
                      Sắp xếp
                    </Text>
                    <Select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      bg="gray.700"
                      border="none"
                      color="white"
                    >
                      <option value="newest" style={{ background: "#1a202c", color: "#fff" }}>Mới nhất</option>
                      <option value="oldest" style={{ background: "#1a202c", color: "#fff" }}>Cũ nhất</option>
                      <option value="title_asc" style={{ background: "#1a202c", color: "#fff" }}>Tên A-Z</option>
                      <option value="title_desc" style={{ background: "#1a202c", color: "#fff" }}>Tên Z-A</option>
                    </Select>
                  </Box>

                  {/* Categories */}
                  <Box>
                    <Text fontSize="md" color="gray.200" fontWeight="medium" mb={3}>
                      Thể loại
                    </Text>
                    <Button
                      size="xs"
                      variant="outline"
                      borderColor="gray.600"
                      color="gray.300"
                      _hover={{ borderColor: "orange.400", color: "orange.400" }}
                      onClick={() => setSelectedCategories([])}
                      isDisabled={selectedCategories.length === 0}
                      mb={3}
                      w="100%"
                    >
                      Xóa tất cả
                    </Button>
                    {!loading && !error && (
                      <VStack align="stretch" spacing={3}>
                        <CheckboxGroup
                          colorScheme="orange"
                          value={selectedCategories}
                          onChange={(vals) => {
                            setSelectedCategories(Array.isArray(vals) ? vals : [vals])
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
                    )}
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </Box>

          {/* Main Content */}
          <Box flex="1">
            <Flex justify="space-between" align="center" mb={6}>
              <Heading as="h2" size="xl" color="orange.400">
                Tất cả phim
              </Heading>
              <Text color="gray.300">
                Tìm thấy {sortedMovies.length} phim
              </Text>
            </Flex>

            {loading && (
              <Box textAlign="center" py={10}>
                <Spinner color="orange.400" size="xl" />
                <Text color="gray.300" mt={4}>Đang tải danh sách phim...</Text>
              </Box>
            )}

            {!!error && !loading && (
              <Text textAlign="center" color="red.400" py={10}>{error}</Text>
            )}

            {!loading && !error && sortedMovies.length === 0 && (
              <Box textAlign="center" py={10}>
                <Text color="gray.400" fontSize="lg">Không tìm thấy phim nào</Text>
              </Box>
            )}

            {!loading && !error && sortedMovies.length > 0 && (
              <>
                <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)", xl: "repeat(4, 1fr)" }} gap={6}>
                  {sortedMovies
                    .slice((currentPage - 1) * pageSize, currentPage * pageSize)
                    .map((movie, idx) => (
                      <Card key={movie._id || idx} bg="gray.800" color="white" borderRadius="md" border="1px solid" borderColor="gray.700" _hover={{ borderColor: "orange.400" }}>
                        <Box position="relative">
                          <Image
                            src={movie.poster_url}
                            alt={movie.title}
                            borderTopRadius="md"
                            height="400px"
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
                          {movie.status && (
                            <Badge 
                              position="absolute" 
                              top={2} 
                              right={2} 
                              bg={movie.status === "active" ? "green.500" : "blue.500"} 
                              color="white" 
                              px={2} 
                              py={1} 
                              borderRadius="md"
                            >
                              {movie.status === "active" ? "Đang chiếu" : "Sắp chiếu"}
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
                            {movie.release_date && formatDate(movie.release_date) && (
                              <HStack spacing={2} color="gray.300">
                                <CalendarIcon />
                                <Text fontSize="sm">
                                  {formatDate(movie.release_date)}
                                </Text>
                              </HStack>
                            )}

                            <Divider borderColor="gray.600" />

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
                {Math.ceil(sortedMovies.length / pageSize) > 1 && (
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
                    {Array.from({ length: Math.ceil(sortedMovies.length / pageSize) }).map((_, i) => (
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
                      isDisabled={currentPage === Math.ceil(sortedMovies.length / pageSize)}
                    >
                      Sau
                    </Button>
                  </HStack>
                )}
              </>
            )}
          </Box>
        </Flex>
      </Container>
    </Box>
  )
}

export default AllMoviesPage

