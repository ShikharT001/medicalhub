"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  AppBar,
  Badge,
  Box,
  Button,
  Container,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";

const CONTAINER_SX = {
  width: "min(1600px, 97vw)",
  mx: "auto",
};

export default function SiteNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryAnchorEl, setCategoryAnchorEl] = useState(null);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [liveSearchOpen, setLiveSearchOpen] = useState(false);
  const categoryOpen = Boolean(categoryAnchorEl);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const meRes = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
        if (meRes.ok) {
          const meData = await meRes.json();
          if (isMounted) setUser(meData?.user || null);
        } else if (isMounted) {
          setUser(null);
        }

        const productRes = await fetch("/api/products", { method: "GET", credentials: "include" });
        if (productRes.ok) {
          const productData = await productRes.json();
          const items = productData?.products || [];
          const allCategories = Array.from(
            new Set(items.map((p) => p.category || "General"))
          );
          if (isMounted) {
            setCategories(allCategories);
            setAllProducts(items);
          }
        }

        const cartRes = await fetch("/api/cart", { method: "GET", credentials: "include" });
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          const count = (cartData?.cart?.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0);
          if (isMounted) setCartCount(count);
        } else if (isMounted) {
          setCartCount(0);
        }

        const ordersRes = await fetch("/api/orders", { method: "GET", credentials: "include" });
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (isMounted) setOrdersCount((ordersData?.orders || []).length);
        } else if (isMounted) {
          setOrdersCount(0);
        }
      } catch {}
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [pathname]);

  useEffect(() => {
    setLiveSearchOpen(false);
  }, [pathname]);

  const topCategories = useMemo(() => categories.slice(0, 15), [categories]);
  const liveResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return allProducts.filter((product) => {
      const title = String(product.title || "").toLowerCase();
      const category = String(product.category || "").toLowerCase();
      const description = String(product.description || "").toLowerCase();
      return title.includes(q) || category.includes(q) || description.includes(q);
    });
  }, [allProducts, searchTerm]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    const q = searchTerm.trim();
    if (!q) return;
    setLiveSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  async function handleLogout() {
    setLogoutLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "GET", credentials: "include" });
      router.push("/auth");
      router.refresh();
    } finally {
      setLogoutLoading(false);
    }
  }

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{ bgcolor: "rgba(248,254,253,0.9)", borderBottom: "1px solid #d7ebe7", backdropFilter: "blur(10px)" }}
      >
        <Container maxWidth={false} sx={CONTAINER_SX}>
          <Toolbar disableGutters sx={{ py: 1.1, gap: 1.2 }}>
          <Stack direction="row" spacing={1.1} alignItems="center">
            <Box className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-600 to-cyan-500" />
            <Box>
              <Typography variant="h6" color="text.primary" sx={{ lineHeight: 1 }}>
                MedicalHub
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Medical Marketplace
              </Typography>
            </Box>
          </Stack>

          <Stack
            component="form"
            direction="row"
            spacing={1}
            alignItems="center"
            onSubmit={handleSearchSubmit}
            sx={{ mx: 1, flex: 1, maxWidth: 560, display: { xs: "none", md: "flex" } }}
          >
            <TextField
              size="small"
              placeholder="Search medicines..."
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                setLiveSearchOpen(Boolean(value.trim()));
              }}
              fullWidth
            />
            <Button type="submit" variant="contained">Search</Button>
          </Stack>

          <Stack direction="row" spacing={0.8} alignItems="center" sx={{ display: { xs: "none", lg: "flex" } }}>
            <Button
              size="small"
              variant="outlined"
              onClick={(e) => setCategoryAnchorEl(e.currentTarget)}
              aria-haspopup="true"
              aria-expanded={categoryOpen ? "true" : undefined}
            >
              Categories
            </Button>
          </Stack>
          <Menu anchorEl={categoryAnchorEl} open={categoryOpen} onClose={() => setCategoryAnchorEl(null)}>
            {topCategories.map((category) => (
              <MenuItem
                key={category}
                component={Link}
                href={`/categories/${encodeURIComponent(category)}`}
                onClick={() => setCategoryAnchorEl(null)}
              >
                {category}
              </MenuItem>
            ))}
          </Menu>

          {user ? (
            <Stack direction="row" spacing={0.4} alignItems="center">
              <Tooltip title="Cart">
                <Button component={Link} href="/cart" size="small" variant="outlined" sx={{ minWidth: 40, px: 1.1 }}>
                  <Badge badgeContent={cartCount} color="error">
                    <ShoppingCartOutlinedIcon fontSize="small" />
                  </Badge>
                </Button>
              </Tooltip>
              <Tooltip title="Orders">
                <Button component={Link} href="/orders" size="small" variant="outlined" sx={{ minWidth: 40, px: 1.1 }}>
                  <Badge badgeContent={ordersCount} color="error">
                    <LocalShippingOutlinedIcon fontSize="small" />
                  </Badge>
                </Button>
              </Tooltip>
              {user.role === "admin" ? (
                <Tooltip title="Admin Dashboard">
                  <Button component={Link} href="/admin" size="small" variant="outlined" sx={{ minWidth: 40, px: 1.1 }}>
                    <AdminPanelSettingsOutlinedIcon fontSize="small" />
                  </Button>
                </Tooltip>
              ) : null}
              <Tooltip title="Profile">
                <Button component={Link} href="/profile" size="small" variant="outlined" sx={{ minWidth: 40, px: 1.1 }}>
                  <AccountCircleOutlinedIcon fontSize="small" />
                </Button>
              </Tooltip>
              <Button size="small" variant="contained" onClick={handleLogout} disabled={logoutLoading}>
                {logoutLoading ? "..." : "Logout"}
              </Button>
            </Stack>
          ) : (
            <Button component={Link} href="/auth" variant="contained">Login</Button>
          )}
          </Toolbar>
        </Container>
      </AppBar>

      {liveSearchOpen ? (
        <Box
          onClick={() => setLiveSearchOpen(false)}
          sx={{
            position: "fixed",
            top: 88,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            bgcolor: "rgba(7, 23, 28, 0.2)",
            backdropFilter: "blur(2px)",
            pt: 1.2,
          }}
        >
          <Container maxWidth={false} sx={CONTAINER_SX}>
            <Paper onClick={(e) => e.stopPropagation()} sx={{ p: 2, borderRadius: 2.5, border: "1px solid #cde6e1" }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.2 }}>
                <Typography variant="h6">Search: &quot;{searchTerm}&quot;</Typography>
                <Button size="small" variant="outlined" onClick={() => setLiveSearchOpen(false)}>Close</Button>
              </Stack>

              {liveResults.length ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
                    gap: 1.2,
                  }}
                >
                  {liveResults.slice(0, 8).map((product) => (
                    <Paper
                      key={product.id}
                      component={Link}
                      href={`/products/${product.id}`}
                      sx={{ p: 1, borderRadius: 1.5, border: "1px solid #d9ece9", display: "flex", gap: 1 }}
                    >
                      <Box
                        component="img"
                        src={product.thumbImage || "https://placehold.co/80x70?text=Rx"}
                        alt={product.title || "Product"}
                        sx={{ width: 80, height: 70, borderRadius: 1, objectFit: "cover", border: "1px solid #d7ebe7" }}
                      />
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle2" noWrap>{product.title || "Untitled Product"}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>{product.category || "General"}</Typography>
                        <Typography variant="body2" color="primary.main">INR {Number(product.price || 0).toFixed(2)}</Typography>
                      </Box>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">No products matched.</Alert>
              )}
            </Paper>
          </Container>
        </Box>
      ) : null}
    </>
  );
}
