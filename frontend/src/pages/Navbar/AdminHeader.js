"use client"
import {
  Box,
  Flex,
  Text,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  Button,
} from "@chakra-ui/react"
import { FaUserCircle } from "react-icons/fa"
import { useNavigate } from "react-router-dom"
import { useRef } from "react"

const AdminHeader = () => {
  const navigate = useNavigate()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const cancelRef = useRef()

  const handleLogout = () => {
    localStorage.removeItem("token")
    onClose()
    navigate("/login")
    window.location.reload()
  }

  return (
    <Box bg="gray.900" px={6} py={3} position="sticky" top={0} zIndex={1000}>
      <Flex justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold" color="orange.400">
          CINEMAGO - Admin
        </Text>
      </Flex>
    </Box>
  )
}

export default AdminHeader
