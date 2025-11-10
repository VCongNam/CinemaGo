import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import authService from '../../services/authService';

export default function PayOSReturnHandler() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const handlePayment = async () => {
      try {
        // Lấy bookingId và kiểm tra quyền
        const bookingId = searchParams.get('bookingId');
        const token = authService.getToken();
        const user = authService.getUser();
        const role = user?.role;

        // Kiểm tra điều kiện
        if (!bookingId) {
          toast({ title: 'Lỗi', description: 'Không tìm thấy mã đặt vé', status: 'error' });
          navigate('/staff/l1');
          return;
        }

        if (!token || !role || (role !== 'lv1' && role !== 'lv2' && role !== 'admin')) {
          toast({ title: 'Unauthorized', description: 'Staff access required', status: 'error' });
          navigate('/admin/login');
          return;
        }

        // Kiểm tra trạng thái thanh toán từ PayOS
        const paymentRes = await fetch(`http://localhost:5000/api/payments/booking/${bookingId}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!paymentRes.ok) {
          throw new Error('Không thể kiểm tra trạng thái thanh toán');
        }

        const paymentData = await paymentRes.json();
        const paymentInfo = paymentData.paymentInfo;
        const isPaid = paymentInfo?.status === 'PAID';

        // Cập nhật trạng thái booking
        const updateRes = await fetch(`http://localhost:5000/api/bookings/${bookingId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            status: isPaid ? 'confirmed' : 'cancelled',
            payment_status: isPaid ? 'success' : 'failed',
            paid_amount: isPaid ? paymentInfo.amount : 0
          })
        });

        if (!updateRes.ok) {
          throw new Error('Không thể cập nhật trạng thái đặt vé');
        }

        // Nếu thanh toán thành công, lấy thông tin vé và in
        if (isPaid) {
          const bookingRes = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          if (!bookingRes.ok) {
            throw new Error('Không thể lấy thông tin vé');
          }

          const details = await bookingRes.json();
          const booking = details.booking;
          const seats = details.seats || [];

          // Mở cửa sổ in vé
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <html>
                <head>
                  <title>Vé xem phim</title>
                  <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .ticket { border: 2px solid #000; padding: 20px; max-width: 500px; margin: 0 auto; }
                    .header { text-align: center; margin-bottom: 20px; }
                    .details { margin-bottom: 20px; }
                    .seat { display: inline-block; margin-right: 10px; }
                  </style>
                </head>
                <body>
                  <div class="ticket">
                    <div class="header">
                      <h1>Vé xem phim</h1>
                      <p><strong>Mã đặt vé:</strong> ${booking._id}</p>
                    </div>
                    <div class="details">
                      <p><strong>Phim:</strong> ${booking.showtime?.movie?.title}</p>
                      <p><strong>Rạp:</strong> ${booking.showtime?.room?.theater?.name}</p>
                      <p><strong>Phòng:</strong> ${booking.showtime?.room?.name}</p>
                      <p><strong>Suất chiếu:</strong> ${new Date(booking.showtime?.startTime).toLocaleString()}</p>
                      <p><strong>Ghế:</strong> ${seats.map(seat => seat.name).join(', ')}</p>
                      <p><strong>Tổng tiền:</strong> ${booking.paid_amount} VNĐ</p>
                      <p><strong>Trạng thái:</strong> Đã thanh toán</p>
                    </div>
                  </div>
                  <script>
                    window.print();
                    window.onafterprint = function() {
                      window.close();
                    }
                  </script>
                </body>
              </html>
            `);
          }

          toast({ 
            title: 'Thanh toán thành công', 
            description: 'Vé đã được in',
            status: 'success' 
          });
        } else {
          toast({ 
            title: 'Thanh toán thất bại', 
            description: 'Đơn hàng đã bị hủy',
            status: 'error' 
          });
        }

        // Redirect về trang staff
        navigate('/staff/l1');

      } catch (error) {
        console.error('Error:', error);
        const isAuthError = error.message.includes('Unauthorized') || 
                          error.message.includes('Token') || 
                          error.message.includes('Staff access required');

        toast({
          title: isAuthError ? 'Unauthorized' : 'Lỗi hệ thống',
          description: error.message,
          status: 'error'
        });

        navigate(isAuthError ? '/admin/login' : '/staff/l1');
      }
    };

    // Chạy xử lý thanh toán
    handlePayment();
  }, [searchParams, navigate, toast]);

  return null;
}