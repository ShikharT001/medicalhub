"use client";

import Link from "next/link";
import { useState } from "react";
import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { normalizeProduct } from "@/lib/product";

export default function ProductCard({ product }) {
  const item = normalizeProduct(product);
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAddToCart() {
    setAdding(true);
    setMessage("");
    try {
      const res = await fetch("/api/cart/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ productId: item.id, quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data?.error || "Unable to add item");
        return;
      }
      setMessage("Added to cart");
    } catch {
      setMessage("Unable to add item");
    } finally {
      setAdding(false);
    }
  }

  return (
    <Card
      className="h-full rounded-3xl bg-gradient-to-b from-white to-emerald-50/40"
      sx={{ display: "flex", flexDirection: "column", height: "100%" }}
    >
      <Box
        component="img"
        src={item.thumbImage || "https://placehold.co/300x200?text=MedicalHub"}
        alt={item.title || "Product image"}
        sx={{ width: "100%", height: 200, objectFit: "cover", borderBottom: "1px solid #d7ebe7" }}
      />
      <CardContent sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Stack spacing={1} sx={{ height: "100%" }}>
          <Typography
            variant="h6"
            sx={{
              minHeight: 56,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title || "Untitled Product"}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              minHeight: 60,
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.description || "No description available"}
          </Typography>
          <Typography variant="h6" color="primary.main">
            ₹{Number(item.price || 0).toFixed(2)}
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Chip size="small" label={item.category || "General"} />
            <Chip size="small" label={`Qty: ${item.totalQuantity || 0}`} color="secondary" />
          </Stack>
          <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
            <Button component={Link} href={`/products/${item.id}`} variant="contained" fullWidth>
              View Details
            </Button>
            <Button variant="outlined" onClick={handleAddToCart} disabled={adding}>
              {adding ? "..." : "Add"}
            </Button>
          </Stack>
          {message ? (
            <Typography variant="caption" color={message === "Added to cart" ? "primary.main" : "error.main"}>
              {message}
            </Typography>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}
