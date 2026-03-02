"use client";

import Link from "next/link";
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
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ProductCard from "@/components/products/ProductCard";
import { normalizeProduct } from "@/lib/product";

const CONTAINER_SX = {
  width: "min(1600px, 97vw)",
  mx: "auto",
};

function UtilityBar({ locationState, onDetectLocation }) {
  return (
    <Box sx={{ bgcolor: "#0a4b44", color: "#e9fffa", py: 0.75, borderBottom: "1px solid rgba(255,255,255,0.14)" }}>
      <Container maxWidth={false} sx={CONTAINER_SX}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1} justifyContent="space-between" alignItems={{ md: "center" }}>
          <Typography variant="body2">
            24/7 support | Prescription assistance | Trusted pharmacy marketplace
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption">{locationState.message}</Typography>
            <Button
              size="small"
              variant="contained"
              onClick={onDetectLocation}
              disabled={locationState.loading}
              sx={{ bgcolor: "#11a590", "&:hover": { bgcolor: "#0f8f7d" } }}
            >
              {locationState.loading ? "Detecting..." : "Detect Location"}
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

function HeroBanner({ banners, bannerIndex, categories }) {
  const banner = banners[bannerIndex] || {};
  const bgImage = banner.image || "https://placehold.co/1500x460?text=MedicalHub";

  return (
    <Box sx={{ py: 2.2 }}>
      <Container maxWidth={false} sx={CONTAINER_SX}>
        <Paper
          sx={{
            minHeight: { xs: 320, md: 380 },
            borderRadius: 4,
            overflow: "hidden",
            position: "relative",
            backgroundImage: `linear-gradient(100deg, rgba(7,40,37,0.84), rgba(7,40,37,0.38)), url(${bgImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            p: { xs: 2.3, md: 4.2 },
            color: "#f4fffd",
          }}
        >
          <Stack spacing={1.2} sx={{ maxWidth: 680 }}>
            <Chip label="Verified Medicines & Wellness" sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", alignSelf: "start" }} />
            <Typography variant="h2" sx={{ fontSize: { xs: "1.8rem", md: "2.8rem" }, fontWeight: 800, lineHeight: 1.1 }}>
              {banner.title || "Smart Medical Commerce Experience"}
            </Typography>
            <Typography sx={{ color: "rgba(231,253,248,0.9)", maxWidth: 620 }}>
              {banner.subtitle || "Order trusted medicines with easy checkout, transparent tracking, and rapid doorstep delivery."}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.1} sx={{ pt: 0.5 }}>
              <Button component={Link} href={banner.ctaLink || "/search?q=offer"} variant="contained" color="primary">
                {banner.ctaText || "Shop Offers"}
              </Button>
              <Button component={Link} href="/cart" variant="outlined" sx={{ borderColor: "rgba(255,255,255,0.35)", color: "#fff" }}>
                Go to Cart
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={0.6} sx={{ position: "absolute", bottom: 14, right: 14 }}>
            {banners.map((b, idx) => (
              <Box key={b.id || idx} sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: idx === bannerIndex ? "#fff" : "rgba(255,255,255,0.4)" }} />
            ))}
          </Stack>

          <Stack direction="row" spacing={0.8} sx={{ position: "absolute", top: 14, right: 14, display: { xs: "none", md: "flex" } }}>
            {categories.slice(0, 4).map((category) => (
              <Chip
                key={category}
                component={Link}
                href={`/categories/${encodeURIComponent(category)}`}
                clickable
                label={category}
                sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff" }}
              />
            ))}
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}

function OffersSection({ offers }) {
  return (
    <Box sx={{ py: 1.2 }}>
      <Container maxWidth={false} sx={CONTAINER_SX}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
            gap: 1.3,
          }}
        >
          {offers.map((offer) => (
            <Card key={offer.id} variant="outlined">
              <CardContent>
                <Chip label={offer.badge || "Offer"} size="small" sx={{ mb: 1 }} />
                <Typography variant="h6" sx={{ mb: 0.5 }}>{offer.title}</Typography>
                <Typography color="text.secondary">{offer.description}</Typography>
                {offer.link ? (
                  <Button component={Link} href={offer.link} size="small" variant="outlined" sx={{ mt: 1 }}>
                    Open Offer
                  </Button>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function CategorySection({ groupedProducts }) {
  const categories = Object.keys(groupedProducts);
  return (
    <Box id="categories" sx={{ py: 5 }}>
      <Container maxWidth={false} sx={CONTAINER_SX}>
        <SectionHeader title="Browse Categories" subtitle="Explore all medicines and health segments." />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
            gap: 1.4,
          }}
        >
          {categories.map((category) => (
            <Card key={category} className="h-full rounded-3xl">
              <CardContent>
                <Typography variant="h6">{category}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.2 }}>
                  {groupedProducts[category].length} products
                </Typography>
                <Button component={Link} href={`/categories/${encodeURIComponent(category)}`} variant="outlined" size="small">
                  Open Category
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function ProductSection({ latestProducts, loadingProducts, productsError }) {
  return (
    <Box id="products" sx={{ py: 5 }}>
      <Container maxWidth={false} sx={CONTAINER_SX}>
        <SectionHeader title="Latest Products" subtitle="Freshly added products curated for quick checkout." />
        {loadingProducts ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={32} />
          </Stack>
        ) : productsError ? (
          <Alert severity="error">{productsError}</Alert>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "repeat(3, minmax(0, 1fr))" },
              gap: 2,
            }}
          >
            {latestProducts.map((product) => (
              <Box key={product.id}>
                <ProductCard product={product} />
              </Box>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
}

function CarouselSection({ items }) {
  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth={false} sx={CONTAINER_SX}>
        <SectionHeader title="Trending Campaigns" subtitle="Editable promotional highlights from admin panel." />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 1.4,
          }}
        >
          {items.map((item) => (
            <Paper
              key={item.id}
              component={Link}
              href={item.link || "/search?q=offer"}
              sx={{
                p: 1,
                borderRadius: 3,
                border: "1px solid #d7ebe7",
                overflow: "hidden",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "180px 1fr" },
                gap: 1,
              }}
            >
              <Box
                component="img"
                src={item.image || "https://placehold.co/400x200?text=Campaign"}
                alt={item.title || "Campaign"}
                sx={{ width: "100%", height: 140, borderRadius: 2, objectFit: "cover" }}
              />
              <Stack spacing={0.6} sx={{ p: 0.5 }}>
                <Typography variant="h6">{item.title || "Campaign"}</Typography>
                <Typography variant="body2" color="text.secondary">{item.description || "Explore now"}</Typography>
                <Button variant="outlined" sx={{ alignSelf: "start" }}>View Offer</Button>
              </Stack>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

function Footer() {
  const links = {
    Shop: ["All Products", "Categories", "Offers", "New Arrivals"],
    Support: ["Help Center", "Shipping", "Returns", "Contact"],
    Company: ["About", "Careers", "Privacy", "Terms"],
  };

  return (
    <Box sx={{ mt: 4, borderTop: "1px solid #d7ebe7", bgcolor: "#f4fbfa", py: 4 }}>
      <Container maxWidth={false} sx={CONTAINER_SX}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", md: "1.2fr repeat(3, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          <Box>
            <Typography variant="h6">MedicalHub</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.6 }}>
              User-friendly medical commerce platform with transparent pricing, verified products, and dependable delivery.
            </Typography>
          </Box>
          {Object.entries(links).map(([section, items]) => (
            <Box key={section}>
              <Typography variant="subtitle2" sx={{ mb: 0.8 }}>{section}</Typography>
              <Stack spacing={0.4}>
                {items.map((item) => (
                  <Typography key={item} variant="body2" color="text.secondary">
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          Copyright {new Date().getFullYear()} MedicalHub. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}

function SectionHeader({ title, subtitle }) {
  return (
    <Box sx={{ mb: 2.3 }}>
      <Typography variant="h4" sx={{ fontSize: { xs: "1.45rem", md: "2rem" }, fontWeight: 700 }}>
        {title}
      </Typography>
      <Typography color="text.secondary">{subtitle}</Typography>
    </Box>
  );
}

export default function MedicalHubLanding() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState("");
  const [bannerIndex, setBannerIndex] = useState(0);
  const [adsConfig, setAdsConfig] = useState({ heroBanners: [], offers: [], carousel: [] });
  const [locationState, setLocationState] = useState({
    loading: false,
    message: "Set your location to check availability",
    label: "",
    serviceAvailable: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadProducts() {
      try {
        setLoadingProducts(true);
        const res = await fetch("/api/products", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) {
          if (isMounted) setProductsError(data?.error || "Unable to load products");
          return;
        }
        if (isMounted) {
          setProducts((data?.products || []).map(normalizeProduct));
          setProductsError("");
        }
      } catch {
        if (isMounted) setProductsError("Unable to load products");
      } finally {
        if (isMounted) setLoadingProducts(false);
      }
    }

    async function loadAds() {
      try {
        const res = await fetch("/api/ads", { method: "GET", credentials: "include" });
        const data = await res.json();
        if (!res.ok) return;
        if (isMounted) {
          setAdsConfig({
            heroBanners: data?.ads?.heroBanners || [],
            offers: data?.ads?.offers || [],
            carousel: data?.ads?.carousel || [],
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

  useEffect(() => {
    if (!adsConfig.heroBanners?.length) return;
    const timer = setInterval(() => {
      setBannerIndex((prev) => (prev + 1) % adsConfig.heroBanners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [adsConfig.heroBanners]);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setLocationState({
        loading: false,
        message: "Geolocation not supported in this browser",
        label: "",
        serviceAvailable: false,
      });
      return;
    }

    setLocationState((prev) => ({ ...prev, loading: true, message: "Detecting location..." }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          const addr = data?.address || {};
          const city = addr.city || addr.town || addr.village || "";
          const district = addr.state_district || "";
          const state = addr.state || "";
          const label = [city, district, state].filter(Boolean).join(", ");
          const checkString = `${city} ${district} ${state}`.toLowerCase();
          const inPalghar = checkString.includes("palghar");

          setLocationState({
            loading: false,
            label,
            serviceAvailable: inPalghar,
            message: inPalghar
              ? `Service available in your area: ${label || "Palghar"}`
              : `Not available in your area${label ? ` (${label})` : ""}`,
          });
        } catch {
          setLocationState({
            loading: false,
            message: "Unable to fetch area details",
            label: "",
            serviceAvailable: false,
          });
        }
      },
      () => {
        setLocationState({
          loading: false,
          message: "Location permission denied",
          label: "",
          serviceAvailable: false,
        });
      }
    );
  }

  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const category = product.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

  const categoryNames = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);
  const latestProducts = products.slice(0, 9);

  return (
    <Box className="min-h-screen bg-[radial-gradient(circle_at_8%_10%,rgba(110,231,183,0.24),transparent_40%),radial-gradient(circle_at_92%_2%,rgba(125,211,252,0.25),transparent_35%),linear-gradient(180deg,#f8fffd_0%,#eef8f7_100%)]">
      <UtilityBar locationState={locationState} onDetectLocation={detectLocation} />
      <HeroBanner banners={adsConfig.heroBanners || []} bannerIndex={bannerIndex} categories={categoryNames} />
      <OffersSection offers={adsConfig.offers || []} />
      <ProductSection latestProducts={latestProducts} loadingProducts={loadingProducts} productsError={productsError} />
      <CategorySection groupedProducts={groupedProducts} />
      <CarouselSection items={adsConfig.carousel || []} />
      <Footer />
    </Box>
  );
}

