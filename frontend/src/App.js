import { ChakraProvider, Box } from "@chakra-ui/react"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginPagetest from "./pages/LoginPagetest"

// Admin pages
import DashboardPage from "./pages/admin/DashboardPage"
import StaffManagementPage from "./pages/admin/StaffManagementPage"
import CustomerManagementPage from "./pages/admin/CustomerManagementPage"
import ReportsPage from "./pages/admin/ReportsPage"
import UserDetailPage from "./pages/admin/UserDetailPage"
import ShowTimeManagementPage from "./pages/admin/ShowTimeManagementPage"
import BookingManagementPage from "./pages/admin/BookingManagementPage"
import BookingDetailPage from "./pages/admin/BookingDetailPage"
import MovieManagementPage from "./pages/admin/MovieManagementPage"
import TheatersManagement from "./pages/admin/TheatersManagement"

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
import StaffPaymentPage from "./pages/bookings/StaffPaymentPage"

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
              <Route path="/bookings/history" element={<TicketHistoryPage />} />
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
              <Route path="/staff/payment" element={<StaffPaymentPage />} />

              {/* Admin */}
              <Route path="/admin/dashboard" element={<DashboardPage />} />
              <Route path="/admin/customers" element={<CustomerManagementPage />} />
              <Route path="/admin/reports" element={<ReportsPage />} />
              <Route path="/admin/user/:id" element={<UserDetailPage />} />
              <Route path="/admin/staffs" element={<StaffManagementPage />} />
              <Route path="/admin/theaters" element={<TheatersManagement />} />
              <Route path="/showtimes" element={<ShowTimeManagementPage />} />
              <Route path="/bookings" element={<BookingManagementPage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/movies" element={<MovieManagementPage />} />

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