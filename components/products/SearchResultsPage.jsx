"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  FormControlLabel,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";
import ProductCard from "@/components/products/ProductCard";
import { normalizeProduct } from "@/lib/product";

export default function SearchResultsPage() {
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim();

  const [products, setProducts] = useState([]);
  const [adsConfig, setAdsConfig] = useState({ offers: [], heroBanners: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoading(true);
        const res = await fetch("/api/products", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          if (isMounted) setError(data?.error || "Unable to load products");
          return;
        }
        if (isMounted) {
          setProducts((data?.products || []).map(normalizeProduct));
          setError("");
        }
      } catch {
        if (isMounted) setError("Unable to load products");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    async function loadAds() {
      try {
        const res = await fetch("/api/ads", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) return;
        if (isMounted) {
          setAdsConfig({
            offers: data?.ads?.offers || [],
            heroBanners: data?.ads?.heroBanners || [],
          });
        }
      } catch {}
    }

    loadProducts();
    loadAds();
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.category || "General")));
  }, [products]);

  const results = useMemo(() => {
    if (!q) return [];
    const needle = q.toLowerCase();
    return products
      .filter((product) => {
      const title = String(product.title || "").toLowerCase();
      const category = String(product.category || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();
      return title.includes(needle) || category.includes(needle) || description.includes(needle);
      })
      .filter((product) => (selectedCategory === "all" ? true : (product.category || "General") === selectedCategory))
      .filter((product) => (freeDeliveryOnly ? Number(product.price || 0) >= 499 || product.freeDelivery === true : true));
  }, [products, q, selectedCategory, freeDeliveryOnly]);
  const productById = useMemo(() => {
    return products.reduce((acc, product) => {
      acc[product.id] = product;
      return acc;
    }, {});
  }, [products]);

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-8">
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4">Search Results</Typography>
              <Typography color="text.secondary">
                Query: {q ? `"${q}"` : "No query entered"}
              </Typography>
            </Box>
            <Button component={Link} href="/" variant="outlined">
              Back to Home
            </Button>
          </Stack>

          {adsConfig.heroBanners?.[0] ? (
            <Card sx={{ mb: 2, border: "1px solid #d7ebe7" }}>
              <CardContent sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "220px 1fr" }, gap: 1.2 }}>
                <Box
                  component="img"
                  src={adsConfig.heroBanners[0].image || "https://placehold.co/220x120?text=Offer"}
                  alt={adsConfig.heroBanners[0].title || "Offer banner"}
                  sx={{ width: "100%", height: 120, objectFit: "cover", borderRadius: 2 }}
                />
                <Box>
                  <Typography variant="h6">{adsConfig.heroBanners[0].title || "Special Offer"}</Typography>
                  <Typography color="text.secondary">{adsConfig.heroBanners[0].subtitle || ""}</Typography>
                </Box>
              </CardContent>
            </Card>
          ) : null}

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
                <FormControl sx={{ minWidth: 220 }} size="small">
                  <InputLabel id="category-filter-label">Category</InputLabel>
                  <Select
                    labelId="category-filter-label"
                    label="Category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch checked={freeDeliveryOnly} onChange={(e) => setFreeDeliveryOnly(e.target.checked)} />
                  }
                  label="Free Delivery Eligible"
                />
                <Typography variant="caption" color="text.secondary">
                  Free delivery filter shows items priced above ₹499 or marked as free delivery.
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !q ? (
            <Alert severity="info">Please enter a search query.</Alert>
          ) : results.length ? (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {results.map((product) => (
                <Box key={product.id}>
                  <ProductCard product={product} />
                </Box>
              ))}
            </Box>
          ) : (
            <Alert severity="info">No products found for this query.</Alert>
          )}

          {adsConfig.offers?.length ? (
            <Card sx={{ mt: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>Current Offers</Typography>
                <Stack spacing={1}>
                  {adsConfig.offers.slice(0, 3).map((offer) => {
                    const linkedProducts = Array.isArray(offer.productIds)
                      ? offer.productIds.map((id) => productById[id]).filter(Boolean)
                      : [];
                    return (
                      <Box key={offer.id} sx={{ border: "1px solid #d7ebe7", borderRadius: 2, p: 1.2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.8 }}>
                          <Typography variant="subtitle2">{offer.title}</Typography>
                          {offer.link ? (
                            <Button component={Link} href={offer.link} size="small" variant="outlined">
                              Open Offer
                            </Button>
                          ) : null}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">{offer.description}</Typography>

                        {linkedProducts.length ? (
                          <Box
                            sx={{
                              mt: 1.1,
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                md: "repeat(3, minmax(0, 1fr))",
                              },
                              gap: 1.1,
                            }}
                          >
                            {linkedProducts.slice(0, 3).map((product) => (
                              <Box
                                key={product.id}
                                component={Link}
                                href={`/products/${product.id}`}
                                sx={{
                                  p: 1,
                                  border: "1px solid #d7ebe7",
                                  borderRadius: 1.5,
                                  display: "grid",
                                  gridTemplateColumns: "62px 1fr",
                                  gap: 1,
                                }}
                              >
                                <Box
                                  component="img"
                                  src={product.thumbImage || "https://placehold.co/62x62?text=Rx"}
                                  alt={product.title || "Product"}
                                  sx={{ width: 62, height: 62, borderRadius: 1, objectFit: "cover" }}
                                />
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="caption" sx={{ display: "block" }} noWrap>
                                    {product.title || "Untitled Product"}
                                  </Typography>
                                  <Typography variant="caption" color="primary.main" noWrap>
                                    ₹{Number(product.price || 0).toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        ) : null}
                      </Box>
                    );
                  })}
                </Stack>
              </CardContent>
            </Card>
          ) : null}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
