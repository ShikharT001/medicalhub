"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";
import { getProductImages, normalizeProduct } from "@/lib/product";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

export default function ProductDetailView() {
  const params = useParams();
  const productId = params?.id;
  const [product, setProduct] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState("");
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${productId}`, {
          method: "GET",
          credentials: "include",
        });
        const data = await res.json();
        if (!res.ok) {
          if (isMounted) setError(data?.error || "Unable to load product");
          return;
        }
        const normalized = normalizeProduct(data?.product || {});
        if (isMounted) {
          setProduct(normalized);
          setActiveImage(getProductImages(normalized)[0] || "");
          setError("");
        }
      } catch {
        if (isMounted) setError("Unable to load product");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    if (productId) loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const images = useMemo(() => (product ? getProductImages(product) : []), [product]);
  const fragments = useMemo(() => safeArray(product?.medicineFragments), [product]);

  function handleMove(e) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  }

  async function addToCart() {
    if (!product?.id) return;
    setAdding(true);
    setAddMessage("");
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAddMessage(data?.error || "Unable to add to cart");
        return;
      }
      setAddMessage("Added to cart");
    } catch {
      setAddMessage("Unable to add to cart");
    } finally {
      setAdding(false);
    }
  }

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-8">
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h4">Product Details</Typography>
            <Button component={Link} href="/" variant="outlined">
              Back to Home
            </Button>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 6 }}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card className="rounded-3xl">
                  <CardContent>
                    <Box
                      sx={{
                        width: "100%",
                        height: { xs: 240, md: 420 },
                        borderRadius: 3,
                        border: "1px solid #d7ebe7",
                        overflow: "hidden",
                        bgcolor: "#f8fbfb",
                        mb: 1.5,
                      }}
                      onMouseEnter={() => setZoomed(true)}
                      onMouseLeave={() => setZoomed(false)}
                      onMouseMove={handleMove}
                    >
                      <Box
                        component="img"
                        src={activeImage || "https://placehold.co/600x400?text=MedicalHub"}
                        alt={product?.title || "Product image"}
                        sx={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          transform: zoomed ? "scale(2)" : "scale(1)",
                          transformOrigin: origin,
                          transition: "transform 0.2s ease",
                        }}
                      />
                    </Box>

                    <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
                      {images.map((image, index) => (
                        <Box
                          key={`${image}-${index}`}
                          component="img"
                          src={image}
                          alt={`Preview ${index + 1}`}
                          onClick={() => setActiveImage(image)}
                          sx={{
                            width: 96,
                            height: 64,
                            borderRadius: 1.5,
                            border: activeImage === image ? "2px solid #00856f" : "1px solid #d7ebe7",
                            objectFit: "cover",
                            cursor: "pointer",
                          }}
                        />
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card className="rounded-3xl">
                  <CardContent>
                    <Stack spacing={1.1}>
                      <Typography variant="h4">{product?.title || "Untitled Product"}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip label={product?.category || "General"} />
                        <Chip label={`Qty: ${product?.totalQuantity || 0}`} color="secondary" />
                      </Stack>
                      <Typography variant="h5" color="primary.main">
                        ₹{Number(product?.price || 0).toFixed(2)}
                      </Typography>
                      <Typography color="text.secondary">{product?.description || "No description available."}</Typography>
                      <Stack direction="row" spacing={1}>
                        <Button variant="contained" onClick={addToCart} disabled={adding}>
                          {adding ? "Adding..." : "Add to Cart"}
                        </Button>
                        <Button component={Link} href="/cart" variant="outlined">
                          Go to Cart
                        </Button>
                      </Stack>
                      {addMessage ? (
                        <Typography variant="caption" color={addMessage === "Added to cart" ? "primary.main" : "error.main"}>
                          {addMessage}
                        </Typography>
                      ) : null}

                      <Box sx={{ pt: 0.8 }}>
                        <Typography variant="subtitle1" sx={{ mb: 1 }}>
                          Medicine Fragments
                        </Typography>
                        {fragments.length ? (
                          <Stack spacing={0.8}>
                            {fragments.map((frag, idx) => (
                              <Box
                                key={idx}
                                sx={{ border: "1px solid #d7ebe7", borderRadius: 2, p: 1.1, bgcolor: "#f6fbfa" }}
                              >
                                <Typography variant="body2">
                                  {frag.medicineName || "Medicine"} {frag.strength ? `- ${frag.strength}` : ""}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  Form: {frag.dosageForm || "-"} | Quantity: {frag.quantity ?? 0}
                                </Typography>
                              </Box>
                            ))}
                          </Stack>
                        ) : (
                          <Typography color="text.secondary">No fragment data available.</Typography>
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
