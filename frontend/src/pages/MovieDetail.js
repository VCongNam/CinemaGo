import { Box, Container, Image, Heading, Text, HStack, VStack, Button, Badge, Spinner } from "@chakra-ui/react"
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

    // Try fetching showtimes for this movie (if API exists)
    apiService.getPublic('/api/showtimes', { movieId: id }, (data, success) => {
      if (!isMounted) return
      if (success) {
        setShowtimes(Array.isArray(data?.data) ? data.data : [])
      } else {
        // fallback: use mock times
        setShowtimes([])
      }
    })

    return () => { isMounted = false }
  }, [id])

  if (loading) return <Container py={10}><Spinner /></Container>

  if (error) return <Container py={10}><Text color="red.500">{error}</Text></Container>

  if (!movie) return <Container py={10}><Text>Không tìm thấy phim</Text></Container>

  return (
    <Box bg="gray.50" pb={10} pt={6}>
      <Container maxW="1000px">
        <HStack spacing={6} align="start">
          <Image src={movie.poster_url} alt={movie.title} boxSize="260px" objectFit="cover" borderRadius="md" />
          <VStack align="start">
            <Heading>{movie.title}</Heading>
            <HStack>
              {(movie.genre || []).slice(0,5).map(g => <Badge key={g} colorScheme="orange">{g}</Badge>)}
            </HStack>
            <Text color="gray.600">{movie.duration ? `${movie.duration} phút` : ''}</Text>
            <Text color="gray.700" maxW="650px">{movie.description || movie.overview || ''}</Text>
            <HStack spacing={3} pt={4}>
              <Button colorScheme="orange" onClick={() => navigate(`/bookings/showtimes/${id}`)}>Đặt vé</Button>
            </HStack>
          </VStack>
        </HStack>

        <Box mt={10}>
          <Heading size="md" mb={4}>Suất chiếu</Heading>
          {showtimes.length ? (
            showtimes.map((s) => (
              <HStack key={s._id} spacing={4} mb={2}>
                <Text>{new Date(s.start_time).toLocaleString()}</Text>
                <Button size="sm" onClick={() => navigate(`/bookings/seats/${s._id}`)}>Đặt vé</Button>
              </HStack>
            ))
          ) : (
            <Text>Chưa có suất chiếu (hiện hiển thị nút Đặt vé dẫn tới lựa chọn suất)</Text>
          )}
        </Box>
      </Container>
    </Box>
  )
}
