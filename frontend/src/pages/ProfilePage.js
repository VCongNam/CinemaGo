import { useEffect, useState } from "react"
import { Container, Box, Heading, Text, VStack, HStack, Button, Input, FormControl, FormLabel, Spinner, Avatar, useToast } from "@chakra-ui/react"
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
    // Prefer protected endpoint to get full profile
    apiService.get('/auth/profile-detail', {}, (data, success) => {
      if (!isMounted) return
      setLoading(false)
      if (success) {
        setProfile(data?.data || null)
        setForm(data?.data || {})
      } else {
        // fallback to local storage user
        const localUser = authService.getUser()
        setProfile(localUser)
        setForm(localUser || {})
      }
    })

    return () => { isMounted = false }
  }, [])

  const handleUpdate = () => {
    const updatePayload = {
      fullName: form.fullName,
      phone: form.phone,
      address: form.address,
    }
    apiService.put('/auth/update-profile', updatePayload, (res, success) => {
      if (success) {
        toast({ title: res?.message || 'Cập nhật thành công', status: 'success' })
        // update local copy
        authService.updateUser(updatePayload)
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
                <Text><strong>Họ và tên:</strong> {profile.fullName || profile.full_name || profile.username || '-'}</Text>
                <Text><strong>Số điện thoại:</strong> {profile.phone || profile.phone_number || '-'}</Text>
                <Text><strong>Địa chỉ:</strong> {profile.address || profile.addr || '-'}</Text>
                <Text><strong>Ngày tạo:</strong> {(profile.createdAt || profile.created_at) ? new Date(profile.createdAt || profile.created_at).toLocaleString() : '-'}</Text>
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
                  <FormLabel color="white">Địa chỉ</FormLabel>
                  <Input bg="#0f1720" color="#ffffff" value={form.address || ''} onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
