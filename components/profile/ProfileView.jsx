"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";

function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function Detail({ label, value }) {
  return (
    <Stack spacing={0.4}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value || "-"}</Typography>
    </Stack>
  );
}

export default function ProfileView() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
        if (!res.ok) {
          router.replace("/auth");
          return;
        }
        const data = await res.json();
        if (isMounted) setUser(data?.user || null);
      } catch {
        if (isMounted) setError("Unable to load profile");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-10">
        <Container maxWidth="sm">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">My Profile</Typography>
            <Button component={Link} href="/" variant="text" color="secondary">
              Back to Home
            </Button>
          </Stack>

          <Card className="rounded-3xl">
            <CardContent sx={{ p: 3 }}>
              {loading ? (
                <Stack alignItems="center" sx={{ py: 4 }}>
                  <CircularProgress size={30} />
                </Stack>
              ) : error ? (
                <Alert severity="error">{error}</Alert>
              ) : (
                <Stack spacing={2}>
                  <Detail label="Name" value={user?.name} />
                  <Detail label="Email" value={user?.email} />
                  <Detail label="Role" value={user?.role} />
                  <Detail
                    label="Created At"
                    value={formatDateTime(user?.createdAt)}
                  />
                </Stack>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
