import { Box, Container, Image, Heading, Text, HStack, VStack, Button, Badge, Spinner, Card, CardBody, Tabs, TabList, Tab, TabPanels, TabPanel, Textarea, Flex, Divider, Icon, FormControl, FormLabel, useToast } from "@chakra-ui/react"
import { StarIcon } from "@chakra-ui/icons"
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
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [userReview, setUserReview] = useState(null)
  const [showtimeSeatsInfo, setShowtimeSeatsInfo] = useState({}) // { showtimeId: { booked: 0, total: 0 } }
  const toast = useToast()

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
        const showtimesList = Array.isArray(data?.data) ? data.data : []
        setShowtimes(showtimesList)
        
        // Load thông tin ghế cho mỗi showtime
        loadShowtimeSeatsInfo(showtimesList)
      } else {
        setShowtimes([])
      }
    })

    // Lấy reviews cho phim này
    loadReviews(id)

    return () => { isMounted = false }
  }, [id])

  const loadReviews = (movieId) => {
    setReviewsLoading(true)
    apiService.getPublic(`/api/reviews/movie/${movieId}`, { page: 1, limit: 20 }, (data, success) => {
      if (success) {
        setReviews(Array.isArray(data?.data) ? data.data : [])
      } else {
        setReviews([])
      }
      setReviewsLoading(false)
    })
  }

  const loadShowtimeSeatsInfo = (showtimesList) => {
    const seatsInfoMap = {}
    let completed = 0
    const total = showtimesList.length

    if (total === 0) {
      setShowtimeSeatsInfo({})
      return
    }

    showtimesList.forEach((showtime) => {
      const showtimeId = showtime._id
      const roomId = showtime.room_id?._id || showtime.room_id
      
      if (!roomId) {
        seatsInfoMap[showtimeId] = { booked: 0, total: 0 }
        completed++
        if (completed === total) {
          setShowtimeSeatsInfo(seatsInfoMap)
        }
        return
      }

      // Wrap apiService calls in Promises
      const bookedSeatsPromise = new Promise((resolve) => {
        apiService.getPublic(`/api/showtimes/${showtimeId}/booked-seats`, {}, (data, success) => {
          resolve(success ? (data?.booked_seats?.length || 0) : 0)
        })
      })

      const roomSeatsPromise = new Promise((resolve) => {
        apiService.getPublic(`/api/public/rooms/${roomId}/seats`, {}, (data, success) => {
          if (success) {
            const totalSeats = data?.list?.length || data?.seats?.length || 0
            resolve(totalSeats)
          } else {
            resolve(0)
          }
        })
      })

      Promise.all([bookedSeatsPromise, roomSeatsPromise])
        .then(([bookedCount, totalSeats]) => {
          seatsInfoMap[showtimeId] = {
            booked: bookedCount,
            total: totalSeats
          }
          completed++
          if (completed === total) {
            setShowtimeSeatsInfo(seatsInfoMap)
          }
        })
        .catch((error) => {
          console.error(`Error loading seats info for showtime ${showtimeId}:`, error)
          seatsInfoMap[showtimeId] = { booked: 0, total: 0 }
          completed++
          if (completed === total) {
            setShowtimeSeatsInfo(seatsInfoMap)
          }
        })
    })
  }

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({
        title: "Vui lòng chọn đánh giá",
        description: "Bạn cần chọn số sao để đánh giá phim.",
        status: "warning",
        duration: 3000,
      })
      return
    }

    if (!comment.trim()) {
      toast({
        title: "Vui lòng nhập bình luận",
        description: "Bạn cần nhập bình luận để đánh giá phim.",
        status: "warning",
        duration: 3000,
      })
      return
    }

    setSubmitting(true)
    apiService.post("/api/reviews", {
      movie_id: id,
      rating,
      comment: comment.trim()
    }, (data, success) => {
      setSubmitting(false)
      if (success) {
        toast({
          title: "Thành công",
          description: data?.message || "Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn!",
          status: "success",
          duration: 3000,
        })
        setRating(0)
        setComment("")
        setUserReview(data?.data || null)
        loadReviews(id) // Reload reviews
      } else {
        toast({
          title: "Lỗi",
          description: data?.message || "Không thể gửi đánh giá. Vui lòng thử lại.",
          status: "error",
          duration: 5000,
        })
      }
    })
  }

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
            <Tabs variant="enclosed" colorScheme="orange">
              <TabList>
                <Tab color="orange.400" _selected={{ color: "orange.400", borderColor: "orange.400" }}>Showtime</Tab>
                <Tab color="orange.400" _selected={{ color: "orange.400", borderColor: "orange.400" }}>Review</Tab>
              </TabList>
              <TabPanels>
                <TabPanel>
            {(() => {
                // Lọc ra các suất chiếu active
                const activeShowtimes = showtimes.filter(s => s.status === 'active');

                // Nếu không có suất chiếu active, hiển thị thông báo
                if (activeShowtimes.length === 0) {
                  return <Text color="gray.400">Chưa có suất chiếu cho phim này</Text>;
                }

                // Nhóm showtimes theo ngày, sau đó theo phòng
                const showtimesByDateAndRoom = activeShowtimes.reduce((acc, showtime) => {
                  const dateKey = showtime.start_time.vietnamFormatted.split(' ')[1] // Lấy phần ngày
                  const roomId = showtime.room_id?._id || showtime.room_id
                  const roomName = showtime.room_id?.name || 'Phòng không xác định'
                  
                  if (!acc[dateKey]) {
                    acc[dateKey] = {}
                  }
                  
                  if (!acc[dateKey][roomId]) {
                    acc[dateKey][roomId] = {
                      roomName,
                      showtimes: []
                    }
                  }
                  
                  acc[dateKey][roomId].showtimes.push(showtime)
                  return acc
                }, {})

                // Sắp xếp các ngày
                const sortedDates = Object.keys(showtimesByDateAndRoom).sort((a, b) => {
                  const [dayA, monthA, yearA] = a.split('/')
                  const [dayB, monthB, yearB] = b.split('/')
                  return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
                })

                return sortedDates.map(date => (
                  <Box key={date} mb={8}>
                    <Heading size="md" mb={4} color="orange.400">{date}</Heading>
                    {Object.keys(showtimesByDateAndRoom[date]).map(roomId => {
                      const roomData = showtimesByDateAndRoom[date][roomId]
                      return (
                        <Box key={roomId} mb={6}>
                          <Heading size="sm" mb={4} color="gray.300">{roomData.roomName}</Heading>
                          <HStack wrap="wrap" spacing={4}>
                            {roomData.showtimes
                              .sort((a, b) => a.start_time.vietnamFormatted.localeCompare(b.start_time.vietnamFormatted))
                              .map((showtime) => {
                                // Lấy thời gian từ vietnamFormatted (e.g., "09:30:00 14/10/2025" -> "09:30")
                                const timeMatch = showtime.start_time.vietnamFormatted.match(/^(\d{2}:\d{2})/)
                                const time = timeMatch ? timeMatch[1] : showtime.start_time.vietnamFormatted.split(' ')[0]
                                
                                // Lấy thông tin ghế
                                const seatsInfo = showtimeSeatsInfo[showtime._id] || { booked: 0, total: 0 }
                                const availableSeats = seatsInfo.total - seatsInfo.booked
                                
                                return (
                                  <Button
                                    key={showtime._id}
                                    size="md"
                                    minW="100px"
                                    h="70px"
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
                                    <VStack spacing={1} align="center">
                                      <Text fontSize="md" fontWeight="bold">{time}</Text>
                                      {seatsInfo.total > 0 && (
                                        <Text fontSize="sm" color="gray.400">
                                          {availableSeats}/{seatsInfo.total} ghế
                                        </Text>
                                      )}
                                    </VStack>
                                  </Button>
                                )
                              })
                            }
                          </HStack>
                        </Box>
                      )
                    })}
                  </Box>
                ))
              })()}
                </TabPanel>

                <TabPanel>
                  <VStack spacing={6} align="stretch">
                    {/* Form đánh giá */}
                    <Box>
                      <Heading size="md" mb={4} color="orange.400">Đánh giá phim</Heading>
                      <Card bg="gray.700" p={4}>
                        <VStack spacing={4} align="stretch">
                          <FormControl>
                            <FormLabel color="gray.300">Đánh giá của bạn</FormLabel>
                            <HStack spacing={1}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Icon
                                  key={star}
                                  as={StarIcon}
                                  w={6}
                                  h={6}
                                  color={star <= rating ? "yellow.400" : "gray.500"}
                                  cursor="pointer"
                                  onClick={() => setRating(star)}
                                  _hover={{ color: "yellow.400" }}
                                />
                              ))}
                              {rating > 0 && (
                                <Text color="gray.300" ml={2}>
                                  {rating} / 5 sao
                                </Text>
                              )}
                            </HStack>
                          </FormControl>

                          <FormControl>
                            <FormLabel color="gray.300">Bình luận</FormLabel>
                            <Textarea
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              placeholder="Chia sẻ suy nghĩ của bạn về bộ phim..."
                              bg="gray.800"
                              color="white"
                              borderColor="gray.600"
                              _focus={{ borderColor: "orange.400" }}
                              rows={4}
                            />
                          </FormControl>

                          <Button
                            colorScheme="orange"
                            onClick={handleSubmitReview}
                            isLoading={submitting}
                            isDisabled={rating === 0 || !comment.trim()}
                          >
                            Gửi đánh giá
                          </Button>
                        </VStack>
                      </Card>
                    </Box>

                    <Divider borderColor="gray.600" />

                    {/* Danh sách reviews */}
                    <Box>
                      <Heading size="md" mb={4} color="orange.400">
                        Đánh giá từ người xem ({reviews.length})
                      </Heading>
                      {reviewsLoading ? (
                        <Box textAlign="center" py={8}>
                          <Spinner color="orange.400" />
                        </Box>
                      ) : reviews.length === 0 ? (
                        <Text color="gray.400" textAlign="center" py={8}>
                          Chưa có đánh giá nào cho phim này
                        </Text>
                      ) : (
                        <VStack spacing={4} align="stretch">
                          {reviews.map((review) => (
                            <Card key={review._id} bg="gray.700" p={4}>
                              <VStack align="stretch" spacing={2}>
                                <Flex justify="space-between" align="center">
                                  <Text fontWeight="bold" color="white">
                                    {review.user_id?.full_name || review.user_id?.username || "Người dùng"}
                                  </Text>
                                  <HStack spacing={1}>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <Icon
                                        key={star}
                                        as={StarIcon}
                                        w={4}
                                        h={4}
                                        color={star <= review.rating ? "yellow.400" : "gray.500"}
                                      />
                                    ))}
                                  </HStack>
                                </Flex>
                                {review.comment && (
                                  <Text color="gray.300" fontSize="sm">
                                    {review.comment}
                                  </Text>
                                )}
                                <Text color="gray.500" fontSize="xs">
                                  {new Date(review.created_at).toLocaleDateString('vi-VN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </Text>
                              </VStack>
                            </Card>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  </VStack>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </Container>
    </Box>
  )
}
