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
    // TODO: clear token / session
    onClose()
    navigate("/login")
  }

  return (
    <Box bg="gray.900" px={6} py={3} position="sticky" top={0} zIndex={1000}>
      <Flex justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="bold" color="orange.400">
          CINEMAGO - Admin
        </Text>

        <Menu>
          <MenuButton
            as={IconButton}
            icon={<FaUserCircle />}
            variant="ghost"
            fontSize="2xl"
            color="orange.400"
            _hover={{ color: "orange.500", bg: "transparent" }}
            _active={{ bg: "transparent" }}
          />
          <MenuList bg="gray.900" borderColor="gray.700">
            <MenuItem
              bg="gray.900"
              color="white"
              _hover={{ bg: "orange.400", color: "white" }}
              onClick={() => navigate("/change-password")}
            >
              Đổi mật khẩu
            </MenuItem>
            <MenuItem
              bg="gray.900"
              color="white"
              _hover={{ bg: "orange.400", color: "white" }}
              onClick={onOpen}
            >
              Đăng xuất
            </MenuItem>
          </MenuList>
        </Menu>
      </Flex>

      {/* Confirm Logout */}
      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="gray.800" color="white">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Xác nhận đăng xuất
            </AlertDialogHeader>

            <AlertDialogBody>
              Bạn có chắc chắn muốn đăng xuất không?
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Hủy
              </Button>
              <Button colorScheme="orange" onClick={handleLogout} ml={3}>
                Đăng xuất
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

export default AdminHeader
