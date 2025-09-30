import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  InputGroup,
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
} from "@chakra-ui/react"
import { SearchIcon, HamburgerIcon } from "@chakra-ui/icons"
import { Link as RouterLink } from "react-router-dom"
import { useState, useEffect } from "react"
import authService from "../../services/authService"
import ProfileDropdown from "../../components/ProfileDropdown"

const Header = () => {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const isMobile = useBreakpointValue({ base: true, md: false })
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Kiểm tra trạng thái đăng nhập
    const checkAuth = () => {
      setIsAuthenticated(authService.isAuthenticated())
    }
    
    checkAuth()
    
    // Lắng nghe sự kiện storage change để cập nhật trạng thái
    const handleStorageChange = () => {
      checkAuth()
    }
    
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  const NavLinks = () => (
    <>
      <Link as={RouterLink} to="/" color="white" _hover={{ color: "orange.400" }}>
        Phim đang chiếu
      </Link>
      <Link href="#" color="white" _hover={{ color: "orange.400" }}>
        Phim sắp chiếu
      </Link>
      <Link href="#" color="white" _hover={{ color: "orange.400" }}>
        Rạp chiếu
      </Link>
      <Link href="#" color="white" _hover={{ color: "orange.400" }}>
        Khuyến mãi
      </Link>
    </>
  )

  return (
    <Box bg="gray.900" px={4} py={3} position="sticky" top={0} zIndex={1000}>
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        {/* Logo */}
        <Link as={RouterLink} to="/">
          <Text fontSize="2xl" fontWeight="bold" color="orange.400" _hover={{ color: "orange.300" }} cursor="pointer">
            CINEMAGO
          </Text>
        </Link>

        {/* Desktop Navigation */}
        {!isMobile && (
          <HStack spacing={8}>
            <NavLinks />
          </HStack>
        )}

        {/* Search and Auth */}
        <HStack spacing={4}>
          {!isMobile && (
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
              />
            </InputGroup>
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

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton icon={<HamburgerIcon />} variant="ghost" color="white" onClick={onOpen} aria-label="Menu" />
          )}
        </HStack>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent bg="gray.900">
          <DrawerCloseButton color="white" />
          <DrawerHeader color="orange.400">Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="start">
              <NavLinks />
              <Input
                placeholder="Tìm phim..."
                bg="gray.800"
                border="none"
                color="white"
                _placeholder={{ color: "gray.400" }}
              />
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