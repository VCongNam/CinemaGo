import { useEffect, useState } from "react"
import { Box, Heading, Spinner, Text } from "@chakra-ui/react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"

export default function TopMoviesChart() {
  const [chartData, setChartData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      let bookings = []
      const token = localStorage.getItem("token")
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      try {
        // 1. Fetch Bookings
        const bookingRes = await fetch("http://localhost:5000/api/bookings", { headers })
        if (!bookingRes.ok) throw new Error("Không thể tải dữ liệu booking")
        const bookingData = await bookingRes.json()
        bookings = bookingData.bookings || []

        // Lọc chỉ lấy booking có payment_status = "success"
        const successBookings = bookings.filter((b) => b.payment_status === "success")

        // 2. Gom nhóm theo Tên Phim và đếm số lượng BOOKING thành công
        const movieBookingCount = {} // { "Tên Phim": Tổng số booking }

        successBookings.forEach((b) => {
          // Truy cập Tên Phim qua đường dẫn mới: showtime_id.movie_id.title
          const movieTitle = b.showtime_id?.movie_id?.title 
          
          if (movieTitle) {
              // Cộng dồn 1 cho mỗi booking thành công
              movieBookingCount[movieTitle] = (movieBookingCount[movieTitle] || 0) + 1
          }
        })

        // 3. Tạo dữ liệu biểu đồ
        let formatted = Object.entries(movieBookingCount).map(([title, count]) => ({
          title, 
          count, // Lúc này 'count' là số lượng booking
        }))

        // 4. Sắp xếp và lấy Top 10
        formatted = formatted
          .sort((a, b) => b.count - a.count)
          .slice(0, 10) 

        setChartData(formatted)
      } catch (err) {
        console.error("Lỗi tải dữ liệu phim đặt nhiều nhất:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <Box
        bg="#1a1e29"
        p={4}
        borderRadius="2xl"
        h="300px"
        display="flex"
        justifyContent="center"
        alignItems="center"
      >
        <Spinner size="lg" color="#ff8c00" />
      </Box>
    )
  }

  if (error || chartData.length === 0) {
     const message = error ? `Lỗi: ${error}` : "Chưa có dữ liệu booking thành công"
     return (
       <Box bg="#1a1e29" p={6} borderRadius="2xl" h="300px">
         <Heading as="h3" size="md" mb={4} color="white">
           Phim được đặt nhiều nhất (Top 10)
         </Heading>
         <Box
           display="flex"
           justifyContent="center"
           alignItems="center"
           h="200px"
         >
           <Text color={error ? "red.400" : "gray.400"}>{message}</Text>
         </Box>
       </Box>
     )
   }

  return (
    <Box bg="#1a1e29" p={6} borderRadius="2xl">
      <Heading as="h3" size="md" mb={4} color="white">
        Phim được đặt nhiều nhất (Top 10)
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c3240" />
          {/* XAxis hiển thị Tên Phim */}
          <XAxis 
            dataKey="title" 
            stroke="#ccc" 
            angle={-15} 
            textAnchor="end" 
            height={50}
            interval={0} // Hiển thị tất cả nhãn
          /> 
          {/* YAxis hiển thị Số Lượng Booking (Count) */}
          <YAxis 
            stroke="#ccc" 
            label={{ value: 'Số lượng booking', angle: -90, position: 'insideLeft', fill: '#ccc' }}
            tickFormatter={(value) => Math.floor(value)}
            allowDecimals={false}
          />
          <Tooltip
            // Hiển thị tooltip là Tên Phim và Số lượng booking
            formatter={(value) => [`${value} booking`, 'Số lượng']}
            labelStyle={{ color: "#fff", fontWeight: 'bold' }}
            contentStyle={{ backgroundColor: "#1a1e29", borderRadius: "8px", border: '1px solid #ff8c00' }}
          />
          {/* Bar dùng dataKey "count" */}
          <Bar dataKey="count" fill="#ff8c00" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}