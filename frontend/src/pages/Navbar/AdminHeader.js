import {
  Box,
  Flex,
  Text,
} from "@chakra-ui/react"

const AdminHeader = () => {
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
