"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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

export default function OrdersPageView() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          if (mounted) setMessage(data?.error || "Unable to load orders");
          return;
        }
        if (mounted) setOrders(data?.orders || []);
      } catch {
        if (mounted) setMessage("Unable to load orders");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadOrders();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-8">
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4">My Orders</Typography>
            <Stack direction="row" spacing={1}>
              <Button component={Link} href="/" variant="outlined">Home</Button>
              <Button component={Link} href="/cart" variant="outlined">Cart</Button>
            </Stack>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : message ? (
            <Alert severity="error">{message}</Alert>
          ) : !orders.length ? (
            <Alert severity="info">No orders yet.</Alert>
          ) : (
            <Stack spacing={1.2}>
              {orders.map((order) => (
                <Card key={order.id}>
                  <CardContent>
                    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                      <Box>
                        <Typography variant="subtitle1">Order #{order.id}</Typography>
                        <Typography variant="body2" color="text.secondary">
                          {formatDateTime(order.createdAt)}
                        </Typography>
                        <Typography variant="body2">Items: {order.items?.length || 0}</Typography>
                        <Typography variant="body2">Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</Typography>
                      </Box>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Chip label={order.paymentStatus || "pending"} size="small" />
                        <Chip label={order.deliveryStatus || "processing"} size="small" color="secondary" />
                        <Button component={Link} href={`/orders/${order.id}`} variant="contained">
                          View
                        </Button>
                      </Stack>
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
