import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@chakra-ui/react";

/**
 * Hook để bảo vệ các trang admin
 * Chỉ cho phép admin truy cập
 */
export const useAdminAuth = () => {
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

      // Chỉ cho phép admin
      if (role !== "admin") {
        toast({
          title: "Không có quyền truy cập",
          description: "Chỉ admin mới có quyền truy cập trang này",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        
        // Nếu là staff, redirect về trang staff tương ứng
        if (role === "lv1") {
          navigate("/staff/l1", { replace: true });
        } else if (role === "lv2") {
          navigate("/staff/l2", { replace: true });
        } else {
          navigate("/admin/login", { replace: true });
        }
        return false;
      }

      setIsAuthorized(true);
      return true;
    };

    checkAuth();
  }, [navigate, toast]);

  return isAuthorized;
};

