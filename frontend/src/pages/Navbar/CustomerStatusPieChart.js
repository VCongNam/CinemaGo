import { useEffect, useState } from "react";
import { Box, Heading, Spinner, Text } from "@chakra-ui/react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

// Định nghĩa màu sắc cho biểu đồ tương ứng với trạng thái
const COLORS = {
  active: "#00C49F",    // Xanh lá (Hoạt động)
  suspended: "#FFBB28", // Vàng (Tạm ngưng)
  locked: "#FF8042",    // Cam (Khóa)
  unknown: "#8884D8",   // Tím (Không rõ)
};

// Hàm dịch trạng thái sang tiếng Việt
const statusLabels = {
  active: "Hoạt động",
  suspended: "Tạm ngưng",
  locked: "Khóa",
  unknown: "Không rõ",
};

/**
 * Hàm xác định trạng thái chính xác dựa trên logic từ CustomerManagementPage
 */
const determineStatus = (user) => {
  if (user.status === "locked") {
    return "locked";
  }
  if (user.status === "suspended" || user.suspendedAt) {
    return "suspended";
  }
  return "active";
};

/**
 * Biểu đồ tròn thống kê số lượng người dùng Khách hàng (role: 'customer') theo trạng thái hoạt động (status).
 */
export default function CustomerStatusPieChart() {
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCustomersByStatus = async () => {
      try {
        const token = localStorage.getItem("token");

        // Gửi request POST với body đầy đủ để đảm bảo gọi API thành công
        const requestBody = {
            page: 1,
            pageSize: 100,
            orderDir: "DESC", 
            orderBy: "createdAt", 
            filterCriteria: [],
        };
        
        const res = await fetch("http://localhost:5000/users", {
          method: "POST", 
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
          },
          body: JSON.stringify(requestBody),
        });

        if (!res.ok) {
          const text = await res.text();
          const errorDetail = `Lỗi ${res.status}: ${res.statusText}. Chi tiết: ${text.slice(0, 100)}`;
          throw new Error(errorDetail);
        }

        const data = await res.json();
        const users = data.list || []; 

        // 1. Lọc: Chỉ lấy người dùng có role là 'customer'
        const customerUsers = users.filter(user => user.role === 'customer');

        // 2. Nhóm và Đếm số lượng theo trạng thái đã được xác định
        const statusCounts = {};
        
        customerUsers.forEach((user) => {
          const statusKey = determineStatus(user); // Dùng hàm xác định trạng thái
          const displayName = statusLabels[statusKey] || statusKey; 

          statusCounts[displayName] = (statusCounts[displayName] || 0) + 1;
        });

        // 3. Định dạng lại dữ liệu cho Recharts
        const formattedData = Object.entries(statusCounts).map(([name, value]) => ({
          name, 
          value, 
          // Tìm lại statusKey gốc để lấy màu sắc chính xác
          statusKey: Object.keys(statusLabels).find(key => statusLabels[key] === name) || 'unknown'
        }));
        
        setPieData(formattedData);
      } catch (err) {
        console.error("Lỗi tải dữ liệu người dùng:", err);
        setError("Đã xảy ra lỗi khi tải dữ liệu: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomersByStatus();
  }, []);

  // Thiết lập kiểu chung cho Box chứa biểu đồ
  const chartBoxStyle = {
    bg: "#1a1e29",
    p: 6,
    borderRadius: "2xl",
    color: "#ffffff", 
    h: "350px", 
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  };

  if (loading) {
    return (
      <Box {...chartBoxStyle}>
        <Spinner size="lg" color="#ff8c00" thickness="4px" />
        <Text mt={4}>Đang tải dữ liệu...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box {...chartBoxStyle}>
        <Heading as="h3" size="md" color="red.400">🚨 Lỗi Tải Dữ Liệu</Heading>
        <Text mt={2} color="red.300" textAlign="center" fontSize="sm">
            Chi tiết: {error}
        </Text>
      </Box>
    );
  }

  if (pieData.length === 0) {
    return (
        <Box {...chartBoxStyle}>
            <Heading as="h3" size="md" >Thống kê trạng thái Khách hàng</Heading>
            <Text mt={2} color="gray.400">Không tìm thấy khách hàng hoặc dữ liệu trống.</Text>
        </Box>
    );
  }

  return (
    <Box bg="#1a1e29" p={6} borderRadius="2xl" color="#ffffff">
      <Heading as="h3" size="lg" mb={4} fontWeight="bold">
        📝 Tỷ Lệ Trạng Thái Tài Khoản Khách Hàng
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
            labelLine={false} 
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} 
            innerRadius={40} 
            paddingAngle={3} 
          >
            {pieData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                // Lấy màu sắc dựa trên statusKey
                fill={COLORS[entry.statusKey] || COLORS.unknown}
                stroke={COLORS[entry.statusKey] || COLORS.unknown} 
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} Khách hàng`,
              `Trạng thái: ${name}`,
            ]}
            contentStyle={{
              backgroundColor: "#2d3748", 
              border: "1px solid #ff8c00",
              borderRadius: "8px",
              padding: "10px",
            }}
            labelStyle={{ color: "#ff8c00", fontWeight: "bold" }}
            itemStyle={{ color: "#ffffff" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
}