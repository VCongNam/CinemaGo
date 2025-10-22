import { Box, Heading } from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// mock data - sau có thể truyền prop
const data = [
  { date: "01/09", revenue: 1200000 },
  { date: "05/09", revenue: 2200000 },
  { date: "10/09", revenue: 1800000 },
  { date: "15/09", revenue: 3000000 },
  { date: "20/09", revenue: 2500000 },
];

export default function RevenueChart({ chartData = data }) {
  return (
    <Box bg="#1a1d29" p={4} borderRadius="lg" shadow="md" color="white">
      <Heading size="md" mb={4} color="orange.400">
        📊 Doanh thu
      </Heading>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
          <XAxis dataKey="date" stroke="white" />
          <YAxis
            stroke="white"
            tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
          />
          <Tooltip
            formatter={(v) => `${v.toLocaleString("vi-VN")} ₫`}
            contentStyle={{
              backgroundColor: "#2d2f3a",
              border: "none",
              borderRadius: "8px",
              color: "white",
            }}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#f97316" // cam
            strokeWidth={3}
            dot={{ r: 5, fill: "#f97316" }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
}
