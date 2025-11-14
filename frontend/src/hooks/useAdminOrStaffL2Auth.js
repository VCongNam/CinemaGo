import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";

/**
 * Hook để bảo vệ các trang quản lý
 * Cho phép admin và staff L2 (lv2) truy cập
 */
export const useAdminOrStaffL2Auth = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("token") || localStorage.getItem("accessToken");
      
      if (!token) {
        toast({
          title: "Yêu cầu đăng nhập",
          description: "Vui lòng đăng nhập để truy cập trang này",
          status: "warning",
          duration: 3000,
          isClosable: true,
        });
        navigate("/admin/login");
        return false;
      }

      // Lấy role từ nhiều nguồn
      let role = "";
      
      // Thử lấy từ userRole
      role = (localStorage.getItem("userRole") || "").toLowerCase();
      
      // Nếu không có, thử lấy từ role object
      if (!role) {
        try {
          const roleData = JSON.parse(localStorage.getItem("role"));
          role = (roleData?.role || "").toLowerCase();
        } catch (e) {
          // Ignore
        }
      }
      
      // Nếu vẫn không có, thử lấy từ staff object
      if (!role) {
        try {
          const staffData = JSON.parse(localStorage.getItem("staff"));
          role = (staffData?.role || "").toLowerCase();
        } catch (e) {
          // Ignore
        }
      }

      // Chỉ cho phép admin hoặc staff L2 (lv2)
      if (role !== "admin" && role !== "lv2") {
        toast({
          title: "Không có quyền truy cập",
          description: "Chỉ admin và staff L2 mới có quyền truy cập trang này",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        
        // Nếu là staff L1, redirect về trang staff L1
        if (role === "lv1") {
          navigate("/staff/l1", { replace: true });
        } else {
          navigate("/admin/login", { replace: true });
        }
        return false;
      }

      setIsAuthorized(true);
      return true;
    };

    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return isAuthorized;
};

