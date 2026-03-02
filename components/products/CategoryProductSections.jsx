"use client";

import { Box, Container, Typography } from "@mui/material";
import ProductCard from "@/components/products/ProductCard";

export default function CategoryProductSections({ groupedProducts }) {
  const categories = Object.keys(groupedProducts || {});

  if (!categories.length) {
    return (
      <Container maxWidth="lg">
        <Typography color="text.secondary">No products available yet.</Typography>
      </Container>
    );
  }

  return (
    <>
      {categories.map((category) => (
        <Box key={category} sx={{ py: 3 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" sx={{ mb: 0.6 }}>
              {category}
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              Curated products in {category}.
            </Typography>
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
              {groupedProducts[category].map((product) => (
                <Box key={product.id}>
                  <ProductCard product={product} />
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      ))}
    </>
  );
}
