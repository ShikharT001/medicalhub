"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
  Divider,
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

export default function OrderDetailsPageView() {
  const params = useParams();
  const orderId = params?.id;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${orderId}`, { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          setMessage(data?.error || "Unable to load order");
          return;
        }
        setOrder(data?.order || null);
        setMessage("");
      } catch {
        setMessage("Unable to load order");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) loadOrder();
  }, [orderId]);

  async function cancelOrder() {
    setCancelling(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Unable to cancel order");
        return;
      }
      setOrder(data?.order || null);
      setMessage("");
    } catch {
      setMessage("Unable to cancel order");
    } finally {
      setCancelling(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-8">
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4">Order Details</Typography>
            <Stack direction="row" spacing={1}>
              <Button component={Link} href="/orders" variant="outlined">All Orders</Button>
              <Button component={Link} href="/" variant="outlined">Home</Button>
            </Stack>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : message ? (
            <Alert severity="error">{message}</Alert>
          ) : !order ? (
            <Alert severity="info">Order not found.</Alert>
          ) : (
            <Stack spacing={1.5}>
              <Card>
                <CardContent>
                  <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1}>
                    <Box>
                      <Typography variant="h6">#{order.id}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(order.createdAt)}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={order.paymentMethod} size="small" />
                      <Chip label={order.paymentStatus} size="small" />
                      <Chip label={order.deliveryStatus} size="small" color="secondary" />
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Items</Typography>
                  <Stack spacing={1}>
                    {(order.items || []).map((item) => (
                      <Box key={item.productId} sx={{ border: "1px solid #d7ebe7", borderRadius: 1.5, p: 1 }}>
                        <Typography variant="body2">{item.title}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          Qty: {item.quantity} | Price: ₹{Number(item.unitPrice || 0).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                  <Divider sx={{ my: 1.2 }} />
                  <Typography variant="body2">Subtotal: ₹{Number(order.subtotal || 0).toFixed(2)}</Typography>
                  <Typography variant="body2">Delivery: ₹{Number(order.deliveryFee || 0).toFixed(2)}</Typography>
                  <Typography variant="h6">Total: ₹{Number(order.totalAmount || 0).toFixed(2)}</Typography>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Delivery Tracking</Typography>
                  <Stack spacing={1}>
                    {(order.tracking || []).map((event) => (
                      <Box key={event.id || `${event.status}-${event.at}`} sx={{ borderLeft: "3px solid #00856f", pl: 1 }}>
                        <Typography variant="body2">{event.message}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {event.status} - {formatDateTime(event.at)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </CardContent>
              </Card>

              <Button
                variant="outlined"
                color="error"
                onClick={cancelOrder}
                disabled={cancelling || ["delivered", "shipped", "cancelled"].includes(order.deliveryStatus)}
                sx={{ alignSelf: "start" }}
              >
                {cancelling ? "Cancelling..." : "Cancel Order"}
              </Button>
            </Stack>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
