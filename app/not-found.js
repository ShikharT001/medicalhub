import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function NotFound() {
  return (
    <Box className="min-h-[70vh] flex items-center">
      <Container maxWidth="sm">
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="h3">404</Typography>
          <Typography variant="h6">Page not found</Typography>
          <Typography color="text.secondary">
            The page you are looking for does not exist or has been moved.
          </Typography>
          <Link href="/">
            <Button variant="contained">Go to Home</Button>
          </Link>
        </Stack>
      </Container>
    </Box>
  );
}
