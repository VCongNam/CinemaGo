import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  HStack,
  Link,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  VStack,
  useBreakpointValue,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from "@chakra-ui/react"
import { SearchIcon, HamburgerIcon, CloseIcon } from "@chakra-ui/icons"
import { FaUserCircle } from "react-icons/fa"
import { Link as RouterLink, useNavigate } from "react-router-dom"
import { useState, useEffect, useRef } from "react"
import authService from "../../services/authService"
import ProfileDropdown from "../../components/ProfileDropdown"

const Header = ({ isAdmin = false }) => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const navigate = useNavigate()
  const cancelRef = useRef()
  const [searchText, setSearchText] = useState("")

  const clearSearch = () => {
    setSearchText("")
    navigate('/')
  }

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated())
    }
    checkAuth()
    const handleStorageChange = () => {
      checkAuth()
    }
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])


  const handleLogout = () => {
    authService.clearAuthData()
    onClose()
    navigate(isAdmin ? "/admin/login" : "/login")
  }

  const NavLinks = () => (
    <>
      <Link as={RouterLink} to="/" color="white" _hover={{ color: "orange.400" }}>
        Phim đang chiếu
      </Link>
      <Link href="#" color="white" _hover={{ color: "orange.400" }}>
        Rạp chiếu
      </Link>
    </>
  )

  // Header cho admin
  if (isAdmin) {
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

  // Header cho user thường
  return (
    <Box bg="gray.900" px={4} py={3} position="sticky" top={0} zIndex={1000}>
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        <Link as={RouterLink} to="/">
          <Text fontSize="2xl" fontWeight="bold" color="orange.400" _hover={{ color: "orange.300" }} cursor="pointer">
            CINEMAGO
          </Text>
        </Link>
        {!isMobile && (
          <HStack spacing={8}>
            <NavLinks />
          </HStack>
        )}
        <HStack spacing={4}>
          {!isMobile && (
            <>
              <InputGroup maxW="300px">
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Tìm phim..."
                  bg="gray.800"
                  border="none"
                  color="white"
                  _placeholder={{ color: "gray.400" }}
                  _focus={{ bg: "gray.700" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const params = new URLSearchParams()
                      if (searchText) params.set('q', searchText)
                      navigate(`/?${params.toString()}`)
                    }
                  }}
                  type="search"
                  name="site-search"
                  autoComplete="off"
                />
                  <InputRightElement>
                    {searchText && (
                      <Button size="sm" variant="ghost" onClick={clearSearch} aria-label="Clear search">
                        <CloseIcon color="gray.400" />
                      </Button>
                    )}
                  </InputRightElement>
              </InputGroup>
              
            </>
          )}
          {isAuthenticated ? (
            <ProfileDropdown />
          ) : (
            <>
              <Button as={RouterLink} to="/login" variant="ghost" color="white" _hover={{ bg: "gray.700" }} size="sm">
                Đăng nhập
              </Button>
              <Button as={RouterLink} to="/register" bg="orange.400" color="white" _hover={{ bg: "orange.500" }} size="sm">
                Đăng ký
              </Button>
            </>
          )}
          {isMobile && (
            <IconButton icon={<HamburgerIcon />} variant="ghost" color="white" onClick={onOpen} aria-label="Menu" />
          )}
        </HStack>
      </Flex>
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.900">
          <DrawerCloseButton color="white" />
          <DrawerHeader color="orange.400">Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="start">
              <NavLinks />
              <InputGroup>
                <InputLeftElement pointerEvents="none">
                  <SearchIcon color="gray.400" />
                </InputLeftElement>
                <Input
                  placeholder="Tìm phim..."
                  bg="gray.800"
                  border="none"
                  color="white"
                  _placeholder={{ color: "gray.400" }}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const params = new URLSearchParams()
                      if (searchText) params.set('q', searchText)
                      navigate(`/?${params.toString()}`)
                    }
                  }}
                  type="search"
                  name="site-search"
                  autoComplete="off"
                />
                <InputRightElement>
                  {searchText && (
                    <Button size="sm" variant="ghost" onClick={clearSearch} aria-label="Clear search">
                      <CloseIcon color="gray.400" />
                    </Button>
                  )}
                </InputRightElement>
              </InputGroup>
              {isAuthenticated ? (
                <ProfileDropdown />
              ) : (
                <VStack spacing={2} align="start" w="full">
                  <Button as={RouterLink} to="/login" variant="ghost" color="white" _hover={{ bg: "gray.700" }} w="full" justifyContent="start">
                    Đăng nhập
                  </Button>
                  <Button as={RouterLink} to="/register" bg="orange.400" color="white" _hover={{ bg: "orange.500" }} w="full">
                    Đăng ký
                  </Button>
                </VStack>
              )}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  )
}

export default Header