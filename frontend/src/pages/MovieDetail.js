import { Box, Container, Image, Heading, Text, HStack, VStack, Button, Badge, Spinner, Card, CardBody } from "@chakra-ui/react"
import { useParams, useNavigate } from "react-router-dom"
import { useEffect, useState } from "react"
import apiService from "../services/apiService"

export default function MovieDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [showtimes, setShowtimes] = useState([])

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    apiService.getById('/api/movies/', id, (data, success) => {
      if (!isMounted) return
      if (success) {
        setMovie(data?.data)
        setError("")
      } else {
        setError(data?.message || 'Không thể tải thông tin phim')
      }
      setLoading(false)
    })

    // Lấy tất cả showtimes cho phim này
    apiService.getPublic('/api/showtimes', { movie_id: id }, (data, success) => {
      if (!isMounted) return
      if (success) {
        setShowtimes(Array.isArray(data?.data) ? data.data : [])
      } else {
        setShowtimes([])
      }
    })

    return () => { isMounted = false }
  }, [id])

  if (loading) return (
    <Box bg="gray.900" minH="calc(100vh - 140px)" py={16}>
      <Container maxW="1000px">
        <Box textAlign="center">
          <Spinner color="orange.400" size="xl" />
          <Text color="white" mt={4}>Đang tải thông tin phim...</Text>
        </Box>
      </Container>
    </Box>
  )

  if (error) return (
    <Box bg="gray.900" minH="calc(100vh - 140px)" py={16}>
      <Container maxW="1000px">
        <Card bg="gray.800" color="white">
          <CardBody p={8} textAlign="center">
            <Text color="red.400">{error}</Text>
          </CardBody>
        </Card>
      </Container>
    </Box>
  )

  if (!movie) return (
    <Box bg="gray.900" minH="calc(100vh - 140px)" py={16}>
      <Container maxW="1000px">
        <Card bg="gray.800" color="white">
          <CardBody p={8} textAlign="center">
            <Text color="white">Không tìm thấy phim</Text>
          </CardBody>
        </Card>
      </Container>
    </Box>
  )

  return (
    <Box bg="gray.900" minH="calc(100vh - 140px)" py={16}>
      <Container maxW="1000px">
        <Card bg="gray.800" color="white">
          <CardBody p={8}>
            <HStack spacing={6} align="start">
              <Image src={movie.poster_url} alt={movie.title} boxSize="260px" objectFit="cover" borderRadius="md" />
              <VStack align="start" spacing={4}>
                <Heading color="orange.400">{movie.title}</Heading>
                <HStack wrap="wrap">
                  {(movie.genre || []).slice(0,5).map(g => (
                    <Badge key={g} colorScheme="orange" bg="orange.400" color="white">
                      {g}
                    </Badge>
                  ))}
                </HStack>
                <Text color="gray.300">{movie.duration ? `${movie.duration} phút` : ''}</Text>
                <Text color="gray.200" maxW="650px">{movie.description || movie.overview || ''}</Text>

              </VStack>
            </HStack>
          </CardBody>
        </Card>

        <Card bg="gray.800" color="white" mt={8}>
          <CardBody p={8}>
            <Heading size="md" mb={6} color="orange.400">Suất chiếu</Heading>
            {(() => {
                // Lọc ra các suất chiếu active
                const activeShowtimes = showtimes.filter(s => s.status === 'active');

                // Nếu không có suất chiếu active, hiển thị thông báo
                if (activeShowtimes.length === 0) {
                  return <Text color="gray.400">Chưa có suất chiếu cho phim này</Text>;
                }

                // Nhóm showtimes theo ngày
                const showtimesByDate = activeShowtimes.reduce((acc, showtime) => {
                  const dateKey = showtime.start_time.vietnamFormatted.split(' ')[1] // Lấy phần ngày từ "09:30:00 14/10/2025"
                  if (!acc[dateKey]) {
                    acc[dateKey] = []
                  }
                  acc[dateKey].push(showtime)
                  return acc
                }, {})

                // Sắp xếp các ngày
                const sortedDates = Object.keys(showtimesByDate).sort((a, b) => {
                  const [dayA, monthA, yearA] = a.split('/')
                  const [dayB, monthB, yearB] = b.split('/')
                  return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
                })

                return sortedDates.map(date => (
                  <Box key={date} mb={6}>
                    <Heading size="sm" mb={4} color="gray.300">{date}</Heading>
                    <HStack wrap="wrap" spacing={3}>
                      {showtimesByDate[date]
                        .sort((a, b) => a.start_time.vietnamFormatted.localeCompare(b.start_time.vietnamFormatted))
                        .map((showtime) => {
                          // Lấy thời gian từ vietnamFormatted (e.g., "09:30:00 14/10/2025" -> "09:30")
                          const timeMatch = showtime.start_time.vietnamFormatted.match(/^(\d{2}:\d{2})/)
                          const time = timeMatch ? timeMatch[1] : showtime.start_time.vietnamFormatted.split(' ')[0]
                          
                          return (
                            <Button
                              key={showtime._id}
                              size="sm"
                              bg="gray.700"
                              color="white"
                              border="1px solid"
                              borderColor="gray.600"
                              _hover={{ 
                                bg: "orange.400", 
                                borderColor: "orange.400",
                                color: "white"
                              }}
                              onClick={() => navigate(`/bookings/seats/${showtime._id}`)}
                            >
                              {time}
                            </Button>
                          )
                        })
                      }
                    </HStack>
                  </Box>
                ))
              })()}
          </CardBody>
        </Card>
      </Container>
    </Box>
  )
}
