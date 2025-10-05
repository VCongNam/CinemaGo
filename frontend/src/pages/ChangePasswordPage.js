import { useState } from "react"
import { Container, Box, Heading, FormControl, FormLabel, Input, Button, VStack, useToast, Text, InputGroup, InputRightElement, IconButton } from "@chakra-ui/react"
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons'
import apiService from "../services/apiService"
import { useNavigate } from 'react-router-dom'

export default function ChangePasswordPage() {
  const [currentPwd, setCurrentPwd] = useState("")
  const [newPwd, setNewPwd] = useState("")
  const [confirmPwd, setConfirmPwd] = useState("")
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handleSubmit = () => {
    if (!currentPwd || !newPwd || !confirmPwd) return toast({ title: 'Nhập đầy đủ thông tin', status: 'warning' })
    if (newPwd !== confirmPwd) return toast({ title: 'Mật khẩu xác nhận không khớp', status: 'warning' })
    if (newPwd.length < 6) return toast({ title: 'Mật khẩu mới phải ít nhất 6 ký tự', status: 'warning' })

    setLoading(true)
    apiService.put('/change-password', { currentPassword: currentPwd, newPassword: newPwd }, (res, success) => {
      setLoading(false)
      if (success) {
        toast({ title: res?.message || 'Đổi mật khẩu thành công', status: 'success' })
        setCurrentPwd('')
        setNewPwd('')
        setConfirmPwd('')
        // Wait a bit so user sees toast, then navigate back to profile and reload the page
        setTimeout(() => {
          navigate('/profile')
          // Full reload to refresh profile data from server
          window.location.reload()
        }, 700)
      } else {
        toast({ title: res?.message || 'Lỗi', status: 'error' })
      }
    })
  }

  return (
    <Box bg="#0f1720" pb={10} pt={6} minH="80vh">
      <Container maxW="480px">
        <Box bg="#0b1014" p={6} borderRadius="md" boxShadow="sm" color="white">
          <Heading size="lg" mb={4} color="orange.400">Đổi mật khẩu</Heading>
          <Text mb={4} color="white">Nhập mật khẩu hiện tại và mật khẩu mới của bạn.</Text>
          <VStack spacing={3} align="stretch">
            <FormControl>
              <FormLabel color="white">Mật khẩu hiện tại</FormLabel>
              <InputGroup>
                <Input type={showCurrent ? 'text' : 'password'} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)} autoComplete="current-password" bg="#0f1720" color="#ffffff" />
                <InputRightElement>
                  <IconButton variant="ghost" aria-label={showCurrent ? 'Hide' : 'Show'} icon={showCurrent ? <ViewOffIcon /> : <ViewIcon />} onClick={() => setShowCurrent(s => !s)} />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel color="white">Mật khẩu mới</FormLabel>
              <InputGroup>
                <Input type={showNew ? 'text' : 'password'} value={newPwd} onChange={(e) => setNewPwd(e.target.value)} autoComplete="new-password" bg="#0f1720" color="#ffffff" />
                <InputRightElement>
                  <IconButton variant="ghost" aria-label={showNew ? 'Hide' : 'Show'} icon={showNew ? <ViewOffIcon /> : <ViewIcon />} onClick={() => setShowNew(s => !s)} />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel color="white">Xác nhận mật khẩu mới</FormLabel>
              <InputGroup>
                <Input type={showConfirm ? 'text' : 'password'} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} autoComplete="new-password" bg="#0f1720" color="#ffffff" />
                <InputRightElement>
                  <IconButton variant="ghost" aria-label={showConfirm ? 'Hide' : 'Show'} icon={showConfirm ? <ViewOffIcon /> : <ViewIcon />} onClick={() => setShowConfirm(s => !s)} />
                </InputRightElement>
              </InputGroup>
            </FormControl>
            <Button bgColor="#d97a2c" color="white" _hover={{ bg: '#c45f13' }} onClick={handleSubmit} isLoading={loading}>Lưu mật khẩu</Button>
          </VStack>
        </Box>
      </Container>
    </Box>
  )
}
