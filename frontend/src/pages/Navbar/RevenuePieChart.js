import { Box, Heading } from "@chakra-ui/react";
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

// mock data - có thể truyền prop chartData
const data = [
  { date: "01/09", revenue: 1200000 },
  { date: "05/09", revenue: 2200000 },
  { date: "10/09", revenue: 1800000 },
  { date: "15/09", revenue: 3000000 },
  { date: "20/09", revenue: 2500000 },
];

const COLORS = ["#f97316", "#10b981", "#3b82f6", "#eab308", "#ef4444"];

export default function RevenuePieChart({ chartData = data }) {
  return (
    <Box bg="#1a1d29" p={6} borderRadius="lg" shadow="md" color="white">
      <Heading size="md" mb={4} color="orange.400">
        🥧 Tỷ trọng doanh thu
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="revenue"
            nameKey="date"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => entry.date}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(v) => `${v.toLocaleString("vi-VN")} ₫`}
            contentStyle={{
              backgroundColor: "#2d2f3a",
              border: "none",
              borderRadius: "8px",
              color: "white",
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}
