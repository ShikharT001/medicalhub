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
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPageView() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [cart, setCart] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
  });

  useEffect(() => {
    let mounted = true;
    async function loadCart() {
      try {
        const res = await fetch("/api/cart", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          if (mounted) {
            setMessage(data?.error || "Unable to load checkout");
            setLoading(false);
          }
          return;
        }
        if (mounted) {
          setCart(data?.cart || null);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setMessage("Unable to load checkout");
          setLoading(false);
        }
      }
    }
    loadCart();
    return () => {
      mounted = false;
    };
  }, []);

  function updateAddress(field, value) {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  async function onPlaceOrder(e) {
    e.preventDefault();
    setPlacing(true);
    setMessage("");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ paymentMethod, shippingAddress: address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Checkout failed");
        return;
      }

      if (paymentMethod === "cod") {
        router.push(`/orders/${data?.order?.id}`);
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setMessage("Razorpay SDK failed to load");
        return;
      }

      const options = {
        key: data?.razorpayKeyId,
        amount: data?.razorpayOrder?.amount,
        currency: data?.razorpayOrder?.currency,
        name: "MedicalHub",
        description: "Order Payment",
        order_id: data?.razorpayOrder?.id,
        prefill: {
          name: address.fullName,
          email: "",
          contact: address.phone,
        },
        handler: async function (response) {
          const verifyRes = await fetch("/api/payments/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              orderId: data?.order?.id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyRes.json();
          if (!verifyRes.ok) {
            setMessage(verifyData?.error || "Payment verification failed");
            return;
          }

          router.push(`/orders/${verifyData?.order?.id || data?.order?.id}`);
        },
        theme: { color: "#00856f" },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch {
      setMessage("Checkout failed");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <Box className="min-h-screen flex items-center justify-center">
          <CircularProgress />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-8">
        <Container maxWidth="md">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4">Checkout</Typography>
            <Button component={Link} href="/cart" variant="outlined">
              Back to Cart
            </Button>
          </Stack>

          {message ? <Alert severity="error" sx={{ mb: 2 }}>{message}</Alert> : null}

          {!cart?.items?.length ? (
            <Alert severity="info">Cart is empty.</Alert>
          ) : (
            <Stack component="form" spacing={2} onSubmit={onPlaceOrder}>
              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Shipping Details</Typography>
                  <Stack spacing={1.2}>
                    <TextField label="Full Name" value={address.fullName} onChange={(e) => updateAddress("fullName", e.target.value)} required />
                    <TextField label="Phone" value={address.phone} onChange={(e) => updateAddress("phone", e.target.value)} required />
                    <TextField label="Address Line 1" value={address.addressLine1} onChange={(e) => updateAddress("addressLine1", e.target.value)} required />
                    <TextField label="Address Line 2" value={address.addressLine2} onChange={(e) => updateAddress("addressLine2", e.target.value)} />
                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1.2}>
                      <TextField label="City" value={address.city} onChange={(e) => updateAddress("city", e.target.value)} required fullWidth />
                      <TextField label="State" value={address.state} onChange={(e) => updateAddress("state", e.target.value)} required fullWidth />
                    </Stack>
                    <TextField label="Postal Code" value={address.postalCode} onChange={(e) => updateAddress("postalCode", e.target.value)} required />
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>Payment Method</Typography>
                  <FormControl>
                    <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                      <FormControlLabel value="cod" control={<Radio />} label="Cash on Delivery" />
                      <FormControlLabel value="online" control={<Radio />} label="Online Payment (Razorpay)" />
                    </RadioGroup>
                  </FormControl>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="body2">Subtotal: ₹{Number(cart?.subtotal || 0).toFixed(2)}</Typography>
                  <Typography variant="body2">Delivery: ₹{Number(cart?.deliveryFee || 0).toFixed(2)}</Typography>
                  <Typography variant="h6">Total: ₹{Number(cart?.totalAmount || 0).toFixed(2)}</Typography>
                  <Button type="submit" variant="contained" disabled={placing} sx={{ mt: 1 }}>
                    {placing ? "Processing..." : paymentMethod === "cod" ? "Place COD Order" : "Pay with Razorpay"}
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
