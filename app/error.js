"use client";

import Link from "next/link";
import { Box, Button, Container, Stack, Typography } from "@mui/material";

export default function GlobalError({ reset }) {
  return (
    <Box className="min-h-[70vh] flex items-center">
      <Container maxWidth="sm">
        <Stack spacing={2} alignItems="center" textAlign="center">
          <Typography variant="h5">Something went wrong</Typography>
          <Typography color="text.secondary">
            We hit an unexpected error. Please try again.
          </Typography>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={() => reset()}>
              Retry
            </Button>
            <Button component={Link} href="/" variant="outlined">
              Home
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
