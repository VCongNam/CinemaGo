import { useEffect, useState } from "react";
import { Box, Heading, Spinner } from "@chakra-ui/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function RevenuePieChart() {
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch("http://localhost:5000/api/bookings", {
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        });

        if (!res.ok) throw new Error("Không thể tải dữ liệu biểu đồ");

        const data = await res.json();
        const bookings = data.bookings || [];

        const grouped = {};
        bookings.forEach((b) => {
          const status = b.status || "unknown";
          grouped[status] = (grouped[status] || 0) + 1;
        });

        const formatted = Object.entries(grouped).map(([name, value]) => ({
          name,
          value,
        }));
        setPieData(formatted);
      } catch (err) {
        console.error("Lỗi tải dữ liệu biểu đồ:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
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

  return (
    <Box bg="#1a1e29" p={6} borderRadius="2xl">
      <Heading as="h3" size="md" mb={4}>
        Tỷ lệ trạng thái thanh toán
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [`${value} giao dịch`, `Trạng thái: ${name}`]}
            contentStyle={{ backgroundColor: "#ffffffff", borderRadius: "8px" }}
            labelStyle={{ color: "#fff" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}