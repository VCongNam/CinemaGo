import { ChakraProvider, Box } from "@chakra-ui/react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPagetest from "./pages/LoginPagetest"

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage"
import StaffManagementPage from "./pages/admin/StaffManagementPage"
import CustomerManagementPage from "./pages/admin/CustomerManagementPage"
import ReportsPage from "./pages/admin/ReportsPage"
import UserDetailPage from "./pages/admin/UserDetailPage"


// Booking pages
import CartPage from "./pages/bookings/CartCheckoutPage"
import TicketHistoryPage from "./pages/bookings/TicketHistoryPage"
import TicketPage from "./pages/bookings/TicketInfo"
import ETicketPage from "./pages/bookings/ETicketPage"
import ShowtimeSelection from "./pages/bookings/ShowtimeSelection"
import SeatSelection from "./pages/bookings/SeatSelection"
import ComboSelection from "./pages/bookings/ComboSelection"

// Staff pages
import StaffL1Page from "./pages/staff/StaffL1Page"
import StaffL2Page from "./pages/staff/StaffL2Page"
import TicketSeatSelectPage from "./pages/staff/TicketSeatSelectPage"

// Homepage & Auth
import HomePage from "./pages/HomePage"
import MovieDetail from "./pages/MovieDetail"
import LoginPage from "./pages/Login"
import RegisterPage from "./pages/Register"
import ProfilePage from "./pages/ProfilePage"
import ChangePasswordPage from "./pages/ChangePasswordPage"

import Header from "./pages/Navbar/Header"
import AdminHeader from "./pages/Navbar/AdminHeader"
import Footer from "./pages/Navbar/Footer"
import SocialAuthSuccess from './pages/SocialAuthSuccess';
import AdminAndStaffLoginPage from "./pages/admin/AdminAndStaffLoginPage"

function App() {
  return (
    <ChakraProvider>
      <Router>
        <Box minHeight="100vh" display="flex" flexDirection="column">
          {/* Hiển thị AdminHeader cho các route admin dashboard, customers, reports, staffs, user/:id. Các route khác dùng Header */}
          {/^\/admin\/(dashboard|customers|reports|staffs|user)/.test(window.location.pathname) ? <AdminHeader /> : <Header />}
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
              <Route path="/bookings/payment" element={<CartPage />} />
              <Route path="/bookings/history" element={<TicketHistoryPage />} />
              <Route path="/bookings/ticket" element={<TicketPage />} />
              <Route path="/bookings/eticket" element={<ETicketPage />} />

              {/* Booking flow with params */}
              <Route path="/bookings/showtimes/:movieId" element={<ShowtimeSelection />} />
              <Route path="/bookings/seats/:showtimeId" element={<SeatSelection />} />
              <Route path="/bookings/combos/:showtimeId" element={<ComboSelection />} />
              <Route path="/bookings/payment/:showtimeId" element={<CartPage />} />
              <Route path="/bookings/ticket/:bookingId" element={<TicketPage />} />

              {/* Staff */}
              <Route path="/staff/l1" element={<StaffL1Page />} />
              <Route path="/staff/l2" element={<StaffL2Page />} />
              <Route path="/staff/ticket" element={<TicketSeatSelectPage />} />

              {/* Admin */}
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/customers" element={<CustomerManagementPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/user/:id" element={<UserDetailPage />} />
              <Route path="/admin/staffs" element={<StaffManagementPage />} />

              {/* Movie detail */}
              <Route path="/movies/:id" element={<MovieDetail />} />

              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/change-password" element={<ChangePasswordPage />} />

              {/* Redirect */}
              <Route path="/" element={<Navigate to="/bookings/cart" replace />} />

              {/* Not found */}
              <Route path="*" element={<h1>404 - Not Found</h1>} />


            </Routes>
          </Box>
          <Footer />
        </Box>
      </Router>
    </ChakraProvider>
  )
}

export default App