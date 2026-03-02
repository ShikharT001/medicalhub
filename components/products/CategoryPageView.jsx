"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";
import ProductCard from "@/components/products/ProductCard";
import { normalizeProduct } from "@/lib/product";

export default function CategoryPageView() {
  const params = useParams();
  const categoryParam = decodeURIComponent(params?.category || "");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        if (isMounted) setProducts((data?.products || []).map(normalizeProduct));
      } catch {
        if (isMounted) setError("Unable to load products");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  const categoryProducts = useMemo(
    () => products.filter((p) => String(p.category || "General").toLowerCase() === categoryParam.toLowerCase()),
    [products, categoryParam]
  );

  return (
    <ThemeProvider theme={theme}>
      <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)] py-8">
        <Container maxWidth="lg">
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4">{categoryParam || "Category"}</Typography>
              <Typography color="text.secondary">Category products</Typography>
            </Box>
            <Button component={Link} href="/" variant="outlined">
              Back to Home
            </Button>
          </Stack>

          {loading ? (
            <Stack alignItems="center" sx={{ py: 4 }}>
              <CircularProgress />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : categoryProducts.length ? (
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
              {categoryProducts.map((product) => (
                <Box key={product.id}>
                  <ProductCard product={product} />
                </Box>
              ))}
            </Box>
          ) : (
            <Typography color="text.secondary">No products found in this category.</Typography>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}
