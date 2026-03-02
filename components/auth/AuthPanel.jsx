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
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";

export default function AuthPanel() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
  });

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
        if (res.ok && isMounted) {
          router.replace("/");
          router.refresh();
          return;
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  function onChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const payload =
      mode === "login"
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password, role: form.role };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Authentication failed");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("Unable to complete request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-10">
        <Container maxWidth="sm">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5">MedicalHub Access</Typography>
            <Button component={Link} href="/" variant="text" color="secondary">
              Back to Home
            </Button>
          </Stack>

          <Card className="rounded-3xl">
            <CardContent sx={{ p: 3 }}>
              <Stack spacing={2.2}>
                <ToggleButtonGroup
                  exclusive
                  color="primary"
                  value={mode}
                  onChange={(_, value) => value && setMode(value)}
                  fullWidth
                >
                  <ToggleButton value="login">Login</ToggleButton>
                  <ToggleButton value="register">Register</ToggleButton>
                </ToggleButtonGroup>

                {loading ? (
                  <Stack alignItems="center" sx={{ py: 5 }}>
                    <CircularProgress size={30} />
                  </Stack>
                ) : (
                  <Box component="form" onSubmit={onSubmit}>
                    <Stack spacing={1.5}>
                      {mode === "register" && (
                        <>
                          <TextField
                            label="Full Name"
                            value={form.name}
                            onChange={(e) => onChange("name", e.target.value)}
                            required
                            fullWidth
                          />
                          <TextField
                            select
                            label="Role"
                            value={form.role}
                            onChange={(e) => onChange("role", e.target.value)}
                            fullWidth
                          >
                            <MenuItem value="user">User</MenuItem>
                            <MenuItem value="admin">Admin</MenuItem>
                          </TextField>
                        </>
                      )}

                      <TextField
                        label="Email"
                        type="email"
                        value={form.email}
                        onChange={(e) => onChange("email", e.target.value)}
                        required
                        fullWidth
                      />
                      <TextField
                        label="Password"
                        type="password"
                        value={form.password}
                        onChange={(e) => onChange("password", e.target.value)}
                        required
                        fullWidth
                      />

                      {error ? <Alert severity="error">{error}</Alert> : null}

                      <Button type="submit" variant="contained" disabled={submitting}>
                        {submitting
                          ? mode === "login"
                            ? "Signing in..."
                            : "Creating account..."
                          : mode === "login"
                            ? "Login"
                            : "Register"}
                      </Button>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
