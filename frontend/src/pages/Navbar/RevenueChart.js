import { useEffect, useState } from "react";
import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function RevenueChart() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/bookings", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!res.ok) throw new Error("Không thể tải dữ liệu doanh thu");

        const data = await res.json();
        const bookings = data.bookings || [];

        // Lọc chỉ lấy booking có payment_status = "success"
        const successBookings = bookings.filter(
          (b) => b.payment_status === "success"
        );

        const grouped = {};
        successBookings.forEach((b) => {
          // Sử dụng created_at.utc hoặc created_at.vietnamFormatted nếu có
          const dateStr = b.created_at?.utc || b.created_at;
          if (!dateStr) return;

          const date = new Date(dateStr).toISOString().split("T")[0];
          const amount = parseFloat(
            b.total_price?.$numberDecimal || b.total_price || 0
          );
          grouped[date] = (grouped[date] || 0) + amount;
        });

        const formatted = Object.entries(grouped).map(([date, total]) => ({
          date,
          total,
        }));

        setChartData(
          formatted.sort((a, b) => new Date(a.date) - new Date(b.date))
        );
      } catch (err) {
        console.error("Lỗi tải dữ liệu doanh thu:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRevenue();
  }, []);

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
    );
  }

  if (chartData.length === 0) {
    return (
      <Box bg="#1a1e29" p={6} borderRadius="2xl" h="300px">
        <Heading as="h3" size="md" mb={4} color="white">
          Doanh thu theo ngày
        </Heading>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          h="200px"
        >
          <Text color="gray.400">Chưa có dữ liệu doanh thu</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box bg="#1a1e29" p={6} borderRadius="2xl">
      <Heading as="h3" size="md" mb={4} color="white">
        Doanh thu theo ngày
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2c3240" />
          <XAxis dataKey="date" stroke="#ccc" />
          <YAxis stroke="#ccc" />
          <Tooltip
            formatter={(value) =>
              new Intl.NumberFormat("vi-VN", {
                style: "currency",
                currency: "VND",
              }).format(value)
            }
            labelStyle={{ color: "#fff" }}
            contentStyle={{ backgroundColor: "#1a1e29", borderRadius: "8px" }}
          />
          <Bar dataKey="total" fill="#ff8c00" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
}