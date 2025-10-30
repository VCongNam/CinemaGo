import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Button,
  Avatar,
  Text,
  VStack,
  HStack,
  useToast,
} from "@chakra-ui/react"
import { ChevronDownIcon } from "@chakra-ui/icons"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import authService from "../services/authService"

const ProfileDropdown = () => {
  const [user, setUser] = useState(null)
  const navigate = useNavigate()
  const toast = useToast()

  useEffect(() => {
    // Lấy thông tin user từ localStorage
    const userData = authService.getUser()
    setUser(userData)
  }, [])

  const handleLogout = () => {
    authService.logout()
    toast({
      title: "Đăng xuất thành công",
      status: "success",
      duration: 2000,
      isClosable: true,
    })
  }

  const handleProfile = () => {
    navigate("/profile")
  }

  if (!user) return null

  return (
    <Menu>
      <MenuButton
        as={Button}
        rightIcon={<ChevronDownIcon />}
        variant="ghost"
        color="white"
        _hover={{ bg: "gray.700" }}
        _active={{ bg: "gray.600" }}
        size="sm"
      >
        <HStack spacing={2}>
          <Avatar size="sm" name={user.username} bg="orange.400" />
          <Text display={{ base: "none", md: "block" }}>{user.username}</Text>
        </HStack>
      </MenuButton>
      <MenuList bg="gray.800" borderColor="gray.600">
        <VStack spacing={2} p={3} align="start">
          <Text fontSize="sm" color="gray.300">
            Xin chào,
          </Text>
          <Text fontWeight="bold" color="white">
            {user.username}
          </Text>
          <Text fontSize="xs" color="gray.400">
            {user.email}
          </Text>
        </VStack>
        <MenuDivider borderColor="gray.600" />
        <MenuItem
          bg="gray.800"
          color="white"
          _hover={{ bg: "gray.700" }}
          onClick={handleProfile}
        >
          Thông tin cá nhân
        </MenuItem>
        <MenuItem
          bg="gray.800"
          color="white"
          _hover={{ bg: "gray.700" }}
          onClick={() => navigate("/ticket-history")}
        >
          Lịch sử đặt vé
        </MenuItem>
        <MenuItem
          bg="gray.800"
          color="white"
          _hover={{ bg: "gray.700" }}
          onClick={handleLogout}
        >
          Đăng xuất
        </MenuItem>
      </MenuList>
    </Menu>
  )
}

export default ProfileDropdown
