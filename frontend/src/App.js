import { ChakraProvider, Box } from "@chakra-ui/react"
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom"
import { useState, useEffect } from "react"
import LoginPagetest from "./pages/LoginPagetest"

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage"
import StaffManagementPage from "./pages/admin/StaffManagementPage"
import CustomerManagementPage from "./pages/admin/CustomerManagementPage"
import UserDetailPage from "./pages/admin/UserDetailPage"
import ShowTimeManagementPage from "./pages/admin/ShowTimeManagementPage"
import BookingManagementPage from "./pages/admin/BookingManagementPage"
import BookingDetailPage from "./pages/admin/BookingDetailPage"
import MovieManagementPage from "./pages/admin/MovieManagementPage"
import TheatersManagement from "./pages/admin/TheatersManagement"
import RoomManagement from "./pages/admin/RoomManagementPage"
import CombosManagement from "./pages/admin/CombosManagement"

// Booking pages
import CartPage from "./pages/bookings/CartCheckoutPage"
import TicketHistoryPage from "./pages/bookings/TicketHistoryPage"
import ETicketPage from "./pages/bookings/ETicketPage"
import ShowtimeSelection from "./pages/bookings/ShowtimeSelection"
import SeatSelection from "./pages/bookings/SeatSelection"
import BookingCancelledPage from "./pages/bookings/BookingCancelledPage"
import PaymentFailedPage from "./pages/bookings/PaymentFailedPage"
import PaymentSuccessPage from "./pages/bookings/PaymentSuccessPage"
import TicketDetailPage from "./pages/bookings/TicketDetailPage";

// Staff pages
import StaffL1Page from "./pages/staff/StaffL1Page"
import StaffL2Page from "./pages/staff/StaffL2Page"
import TicketSeatSelectPage from "./pages/staff/TicketSeatSelectPage"
import PayOSReturnHandler from "./pages/staff/PayOSReturnHandler"

// Homepage & Auth
import HomePage from "./pages/HomePage"
import MovieDetail from "./pages/MovieDetail"
import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"
import ProfilePage from "./pages/ProfilePage"
import ChangePasswordPage from "./pages/ChangePasswordPage"

// Theater pages
import TheaterListPage from "./pages/theaters/TheaterListPage"
import TheaterDetailPage from "./pages/theaters/TheaterDetailPage"

import Header from "./pages/Navbar/Header"
import Footer from "./pages/Navbar/Footer"
import SocialAuthSuccess from './pages/SocialAuthSuccess';
import AdminAndStaffLoginPage from "./pages/admin/AdminAndStaffLoginPage"
import StaffPaymentSuccessPage from "./pages/staff/StaffPaymentSuccessPage"
import StaffPaymentFailedPage from "./pages/staff/StaffPaymentFailedPage"

// Component để kiểm tra và ẩn Header/Footer cho staff và admin
function AppContent() {
  const location = useLocation();
  const [shouldHideHeaderFooter, setShouldHideHeaderFooter] = useState(false);

  useEffect(() => {
    // Kiểm tra role từ localStorage
    let roleData = null;
    try {
      roleData = JSON.parse(localStorage.getItem("role"));
    } catch (e) {
      const directRole = localStorage.getItem("role") || localStorage.getItem("userRole");
      if (directRole) {
        roleData = { role: directRole };
      }
    }
    
    const role = roleData?.role || "";
    const isAdmin = role.toLowerCase() === "admin";
    const isStaff = role.toLowerCase() === "lv2" || role.toLowerCase() === "lv1";
    
    // Ẩn Header/Footer nếu:
    // 1. Path bắt đầu với /staff/ hoặc /admin/
    // 2. Hoặc user là admin/staff VÀ đang ở trang quản lý (/movies, /showtimes, /bookings - nhưng không phải /movies/:id)
    const pathStartsWithStaff = location.pathname.startsWith('/staff/');
    const pathStartsWithAdmin = /^\/admin\//.test(location.pathname);
    const isStaffOrAdminRoute = pathStartsWithStaff || pathStartsWithAdmin;
    
    // Kiểm tra nếu đang ở trang quản lý (không phải detail page)
    const isManagementPage = 
      location.pathname === '/movies' || 
      location.pathname === '/showtimes' || 
      location.pathname === '/bookings' ||
      location.pathname === '/combos' ||
      (location.pathname.startsWith('/bookings/') && !location.pathname.startsWith('/bookings/cart') && 
       !location.pathname.startsWith('/bookings/showtimes') && 
       !location.pathname.startsWith('/bookings/seats') && 
       !location.pathname.startsWith('/bookings/checkout') &&
       !location.pathname.startsWith('/bookings/cancelled') &&
       !location.pathname.startsWith('/bookings/eticket'));
    
    const shouldHide = isStaffOrAdminRoute || (isManagementPage && (isAdmin || isStaff));
    
    setShouldHideHeaderFooter(shouldHide);
  }, [location.pathname]);

  return (
    <Box minHeight="100vh" display="flex" flexDirection="column">
      {/* Chỉ hiển thị Header cho các route không phải staff và không phải admin */}
      {!shouldHideHeaderFooter && <Header />}
      <Box flex="1">
        <Routes>
          {/* Root */}
          <Route index element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/admin/login" element={<AdminAndStaffLoginPage />} />
          <Route path="/logintest" element={<LoginPagetest />} />
          <Route path="/social-auth-success" element={<SocialAuthSuccess />} />


          {/* Booking */}
          <Route path="/bookings/cart" element={<CartPage />} />
          <Route path="/ticket-history" element={<TicketHistoryPage />} />
          <Route path="/bookings/eticket" element={<ETicketPage />} />
          <Route path="/ticket-detail/:id" element={<TicketDetailPage />} />

          {/* Booking flow with params */}
          <Route path="/bookings/showtimes/:movieId" element={<ShowtimeSelection />} />
          <Route path="/bookings/seats/:showtimeId" element={<SeatSelection />} />
          <Route path="/bookings/checkout/:bookingId" element={<CartPage />} />
          <Route path="/bookings/cancelled" element={<BookingCancelledPage />} />
          <Route path="/payment-failed" element={<PaymentFailedPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          {/* Staff */}
          <Route path="/staff/l1" element={<StaffL1Page />} />
          <Route path="/staff/l2" element={<StaffL2Page />} />
          <Route path="/staff/ticket" element={<TicketSeatSelectPage />} />
          <Route path="/staff/payos-return" element={<PayOSReturnHandler />} />
          <Route path="/staff/payment-success" element={<StaffPaymentSuccessPage />} />
          <Route path="/staff/payment-failed" element={<StaffPaymentFailedPage />} />

          {/* Admin */}
          <Route path="/admin/dashboard" element={<DashboardPage />} />
          <Route path="/admin/customers" element={<CustomerManagementPage />} />
          <Route path="/admin/user/:id" element={<UserDetailPage />} />
          <Route path="/admin/staffs" element={<StaffManagementPage />} />
          <Route path="/admin/theaters" element={<TheatersManagement />} />
          <Route path="/admin/rooms" element={<RoomManagement />} />
          <Route path="/showtimes" element={<ShowTimeManagementPage />} />
          <Route path="/bookings" element={<BookingManagementPage />} />
          <Route path="/bookings/:id" element={<BookingDetailPage />} />
          <Route path="/movies" element={<MovieManagementPage />} />
          <Route path="/combos" element={<CombosManagement />} />

          {/* Movie detail */}
          <Route path="/movies/:id" element={<MovieDetail />} />

          {/* Theaters */}
          <Route path="/theaters" element={<TheaterListPage />} />
          <Route path="/theaters/:id" element={<TheaterDetailPage />} />

          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />

          {/* Redirect */}
          <Route path="/" element={<Navigate to="/bookings/cart" replace />} />

          {/* Not found */}
          <Route path="*" element={<h1>404 - Not Found</h1>} />


        </Routes>
      </Box>
      {/* Chỉ hiển thị Footer cho các route không phải staff và không phải admin */}
      {!shouldHideHeaderFooter && <Footer />}
    </Box>
  );
}

function App() {
  return (
    <ChakraProvider>
      <Router>
        <AppContent />
      </Router>
    </ChakraProvider>
  )
}

export default App