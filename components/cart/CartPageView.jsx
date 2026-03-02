"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";

function ItemRow({ item, onQuantityChange, onRemove, busy }) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={1.2} alignItems="center">
            <Box
              component="img"
              src={item.thumbImage || "https://placehold.co/110x80?text=Rx"}
              alt={item.title || "Item"}
              sx={{ width: 110, height: 80, objectFit: "cover", borderRadius: 1.5, border: "1px solid #d7ebe7" }}
            />
            <Box>
              <Typography variant="subtitle1">{item.title || "Product"}</Typography>
              <Typography variant="body2" color="text.secondary">
                {item.category || "General"}
              </Typography>
              <Typography variant="body2" color="primary.main">
                ₹{Number(item.unitPrice || 0).toFixed(2)}
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              size="small"
              type="number"
              label="Qty"
              value={item.quantity}
              inputProps={{ min: 1 }}
              onChange={(e) => onQuantityChange(item.productId, Number(e.target.value || 1))}
              sx={{ width: 90 }}
            />
            <IconButton color="error" onClick={() => onRemove(item.productId)} disabled={busy}>
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function CartPageView() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState("");

  async function loadCart() {
    setLoading(true);
    try {
      const res = await fetch("/api/cart", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Unable to load cart");
        return;
      }
      setCart(data?.cart || null);
      setMessage("");
    } catch {
      setMessage("Unable to load cart");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCart();
  }, []);

  async function updateQty(productId, quantity) {
    if (!quantity || quantity < 1) return;
    setBusyId(productId);
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Unable to update item");
        return;
      }
      setCart(data?.cart || null);
      setMessage("");
    } catch {
      setMessage("Unable to update item");
    } finally {
      setBusyId("");
    }
  }

  async function removeItem(productId) {
    setBusyId(productId);
    try {
      const res = await fetch(`/api/cart/items/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Unable to remove item");
        return;
      }
      setCart(data?.cart || null);
      setMessage("");
    } catch {
      setMessage("Unable to remove item");
    } finally {
      setBusyId("");
    }
  }

  const items = useMemo(() => cart?.items || [], [cart]);

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-8">
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4">My Cart</Typography>
            <Stack direction="row" spacing={1}>
              <Button component={Link} href="/" variant="outlined">
                Home
              </Button>
              <Button component={Link} href="/orders" variant="outlined">
                Orders
              </Button>
            </Stack>
          </Stack>

          {message ? <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert> : null}

          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : !items.length ? (
            <Alert severity="info">Your cart is empty.</Alert>
          ) : (
            <Stack spacing={1.2}>
              {items.map((item) => (
                <ItemRow
                  key={item.productId}
                  item={item}
                  onQuantityChange={updateQty}
                  onRemove={removeItem}
                  busy={busyId === item.productId}
                />
              ))}
              <Divider />
              <Card>
                <CardContent>
                  <Stack spacing={0.6}>
                    <Typography variant="body2">Subtotal: ₹{Number(cart?.subtotal || 0).toFixed(2)}</Typography>
                    <Typography variant="body2">Delivery Fee: ₹{Number(cart?.deliveryFee || 0).toFixed(2)}</Typography>
                    <Typography variant="h6">Total: ₹{Number(cart?.totalAmount || 0).toFixed(2)}</Typography>
                    <Button component={Link} href="/checkout" variant="contained" sx={{ mt: 1, alignSelf: "start" }}>
                      Proceed to Checkout
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
