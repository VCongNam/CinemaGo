import { useEffect, useState } from "react"
import { Container, Box, Heading, Text, VStack, HStack, Button, Input, FormControl, FormLabel, Spinner, Avatar, useToast } from "@chakra-ui/react"
import { format, parseISO } from "date-fns"
import apiService from "../services/apiService"
import { useNavigate } from "react-router-dom"
import authService from "../services/authService"

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showChangePwd, setShowChangePwd] = useState(false)
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const toast = useToast()
  const navigate = useNavigate()
  

  useEffect(() => {
    let isMounted = true
    setLoading(true)
    
    // Lấy userId từ localStorage
    const localUser = authService.getUser()
    const userId = localUser?.id || localUser?._id || localUser?.userId
    
    if (!userId) {
      // Nếu không có userId, fallback về profile-detail
      apiService.get('/auth/profile-detail', {}, (data, success) => {
        if (!isMounted) return
        setLoading(false)
        if (success) {
          setProfile(data?.data || null)
          setForm(data?.data || {})
        } else {
          setProfile(localUser)
          setForm(localUser || {})
        }
      })
      return () => { isMounted = false }
    }
    
    // Sử dụng endpoint /users/{userId} để lấy đầy đủ thông tin
    apiService.getById('/users/', userId, (data, success) => {
      if (!isMounted) return
      setLoading(false)
      if (success) {
        const userData = data?.data || data
        setProfile(userData)
        setForm(userData)
      } else {
        // Fallback nếu API lỗi
        apiService.get('/auth/profile-detail', {}, (fallbackData, fallbackSuccess) => {
          if (!isMounted) return
          if (fallbackSuccess) {
            setProfile(fallbackData?.data || null)
            setForm(fallbackData?.data || {})
          } else {
            setProfile(localUser)
            setForm(localUser || {})
          }
        })
      }
    })

    return () => { isMounted = false }
  }, [])

  const handleUpdate = () => {
    const updatePayload = {
      fullName: form.fullName,
      phone: form.phone,
      dateOfBirth: form.dateOfBirth,
    }
    apiService.put('/update-profile', updatePayload, (res, success) => {
      if (success) {
        toast({ title: res?.message || 'Cập nhật thành công', status: 'success' })
        // Reload profile để cập nhật dữ liệu
        const localUser = authService.getUser()
        const userId = localUser?.id || localUser?._id || localUser?.userId
        if (userId) {
          apiService.getById('/users/', userId, (data, success) => {
            if (success) {
              const userData = data?.data || data
              setProfile(userData)
              setForm(userData)
            }
          })
        }
        setEditing(false)
      } else {
        toast({ title: res?.message || 'Lỗi', status: 'error' })
      }
    })
  }

  if (loading) return <Container py={10}><Spinner /></Container>

  if (!profile) return <Container py={10}><Text>Không tìm thấy thông tin</Text></Container>

  return (
    <Box bg="#0f1720" pb={10} pt={6} minH="80vh" color="white">
      <Container maxW="800px">
        <Box bg="#0b1014" p={6} borderRadius="md" boxShadow="sm">
          <HStack spacing={6} align="start">
            <Avatar size="xl" name={profile.fullName || profile.username} bg="orange.400" />
            <VStack align="start">
              <Heading color="orange.400">{profile.fullName || profile.username}</Heading>
              <Text color="white">{profile.email}</Text>
              <Text color="white">Role: {profile.role}</Text>
            </VStack>
          </HStack>

          <Box mt={6}>
            <Heading size="md" mb={4} color="orange.400">Chi tiết cá nhân</Heading>
            {!editing ? (
              <VStack align="start" spacing={2} color="white">
                <Text><strong>Username:</strong> {profile.username || '-'}</Text>
                <Text><strong>Email:</strong> {profile.email || '-'}</Text>
                <Text><strong>Họ và tên:</strong> {profile.fullName || profile.full_name || '-'}</Text>
                <Text><strong>Số điện thoại:</strong> {profile.phone || profile.phone_number || '-'}</Text>
                <Text><strong>Ngày sinh:</strong> {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString('vi-VN') : '-'}</Text>
                <Text><strong>Ngày tạo:</strong> {(profile.createdAt || profile.created_at) ? new Date(profile.createdAt || profile.created_at).toLocaleString('vi-VN') : '-'}</Text>
                <HStack>
                  <Button mt={4} bgColor="#d97a2c" color="white" _hover={{ bg: '#c45f13' }} onClick={() => setEditing(true)}>Chỉnh sửa</Button>
                  <Button mt={4} variant="outline" borderColor="#d97a2c" color="#d97a2c" onClick={() => navigate('/change-password')}>Đổi mật khẩu</Button>
                </HStack>
              </VStack>
            ) : (
              <VStack spacing={3} align="start">
                <FormControl>
                  <FormLabel color="white">Họ và tên</FormLabel>
                  <Input bg="#0f1720" color="#ffffff" value={form.fullName || ''} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel color="white">Số điện thoại</FormLabel>
                  <Input bg="#0f1720" color="#ffffff" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </FormControl>
                <FormControl>
                  <FormLabel color="white">Ngày sinh</FormLabel>
                  <Input 
                    type="date"
                    bg="#0f1720" 
                    color="#ffffff" 
                    value={form.dateOfBirth ? (typeof form.dateOfBirth === 'string' ? form.dateOfBirth.split('T')[0] : format(parseISO(form.dateOfBirth), 'yyyy-MM-dd')) : ''} 
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value ? new Date(e.target.value).toISOString() : '' })} 
                  />
                </FormControl>
                <HStack>
                  <Button bgColor="#d97a2c" color="white" _hover={{ bg: '#c45f13' }} onClick={handleUpdate}>Lưu</Button>
                  <Button variant="ghost" color="gray.200" onClick={() => { setEditing(false); setForm(profile) }}>Hủy</Button>
                </HStack>
              </VStack>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  )
}
