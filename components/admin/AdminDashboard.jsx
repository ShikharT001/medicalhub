"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@/components/landing/theme";
import { normalizeProduct } from "@/lib/product";

function createEmptyFragment() {
  return { medicineName: "", strength: "", dosageForm: "", quantity: "" };
}

function createInitialForm() {
  return {
    title: "",
    description: "",
    category: "",
    price: "",
    totalQuantity: "",
    thumbImage: "",
    sideImages: [""],
    medicineFragments: [createEmptyFragment()],
  };
}

function createEmptyBanner() {
  return { id: `banner-${Date.now()}-${Math.random()}`, title: "", subtitle: "", image: "", ctaText: "", ctaLink: "" };
}

function createEmptyOffer() {
  return { id: `offer-${Date.now()}-${Math.random()}`, title: "", description: "", badge: "", link: "", productIds: [] };
}

function createEmptyCarouselItem() {
  return { id: `carousel-${Date.now()}-${Math.random()}`, title: "", description: "", image: "", link: "" };
}

function normalizeForm(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category.trim(),
    price: Number(form.price),
    totalQuantity: Number(form.totalQuantity),
    thumbImage: form.thumbImage.trim(),
    sideImages: form.sideImages.map((url) => url.trim()).filter(Boolean),
    medicineFragments: form.medicineFragments
      .map((frag) => ({
        medicineName: frag.medicineName.trim(),
        strength: frag.strength.trim(),
        dosageForm: frag.dosageForm.trim(),
        quantity: Number(frag.quantity),
      }))
      .filter((frag) => frag.medicineName),
  };
}

function ProductForm({
  form,
  onFieldChange,
  onSideImageChange,
  onAddSideImage,
  onRemoveSideImage,
  onFragmentFieldChange,
  onAddFragment,
  onRemoveFragment,
  submitLabel,
  onSubmit,
  submitting,
}) {
  return (
    <Stack component="form" spacing={1.5} onSubmit={onSubmit}>
      <TextField
        label="Product Title"
        value={form.title}
        onChange={(e) => onFieldChange("title", e.target.value)}
        required
        fullWidth
      />
      <TextField
        label="Description"
        value={form.description}
        onChange={(e) => onFieldChange("description", e.target.value)}
        multiline
        minRows={2}
        fullWidth
      />
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
        <TextField
          label="Category"
          value={form.category}
          onChange={(e) => onFieldChange("category", e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Price"
          type="number"
          value={form.price}
          onChange={(e) => onFieldChange("price", e.target.value)}
          required
          fullWidth
        />
        <TextField
          label="Total Quantity"
          type="number"
          value={form.totalQuantity}
          onChange={(e) => onFieldChange("totalQuantity", e.target.value)}
          required
          fullWidth
        />
      </Stack>

      <Divider />
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Product Images (Cloudinary links)
        </Typography>
        <TextField
          label="Main Thumbnail Image URL"
          placeholder="https://res.cloudinary.com/... (recommended 300x200)"
          value={form.thumbImage}
          onChange={(e) => onFieldChange("thumbImage", e.target.value)}
          required
          fullWidth
        />
        {form.thumbImage ? (
          <Box
            component="img"
            src={form.thumbImage}
            alt="Main thumbnail preview"
            sx={{
              width: 300,
              height: 200,
              borderRadius: 2,
              border: "1px solid #d7ebe7",
              objectFit: "cover",
              maxWidth: "100%",
            }}
          />
        ) : null}

        <Typography variant="caption" color="text.secondary">
          Side Images (multiple)
        </Typography>
        {form.sideImages.map((url, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 1 }}>
            <Stack spacing={1}>
              <TextField
                label={`Side Image URL ${index + 1}`}
                placeholder="https://res.cloudinary.com/..."
                value={url}
                onChange={(e) => onSideImageChange(index, e.target.value)}
                fullWidth
              />
              {url ? (
                <Box
                  component="img"
                  src={url}
                  alt={`Side preview ${index + 1}`}
                  sx={{
                    width: 300,
                    height: 200,
                    borderRadius: 2,
                    border: "1px solid #d7ebe7",
                    objectFit: "cover",
                    maxWidth: "100%",
                  }}
                />
              ) : null}
              {form.sideImages.length > 1 ? (
                <Button color="error" onClick={() => onRemoveSideImage(index)}>
                  Remove Side Image
                </Button>
              ) : null}
            </Stack>
          </Paper>
        ))}
        <Button variant="outlined" onClick={onAddSideImage}>
          Add Side Image
        </Button>
      </Stack>

      <Divider />
      <Stack spacing={1}>
        <Typography variant="subtitle2" color="text.secondary">
          Medicine Fragments (quantity based)
        </Typography>
        {form.medicineFragments.map((frag, index) => (
          <Fragment key={index}>
            <Paper variant="outlined" sx={{ p: 1.25 }}>
              <Stack spacing={1}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  <TextField
                    label="Medicine Name"
                    value={frag.medicineName}
                    onChange={(e) => onFragmentFieldChange(index, "medicineName", e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Strength"
                    value={frag.strength}
                    onChange={(e) => onFragmentFieldChange(index, "strength", e.target.value)}
                    fullWidth
                  />
                </Stack>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
                  <TextField
                    label="Dosage Form"
                    value={frag.dosageForm}
                    onChange={(e) => onFragmentFieldChange(index, "dosageForm", e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Fragment Quantity"
                    type="number"
                    value={frag.quantity}
                    onChange={(e) => onFragmentFieldChange(index, "quantity", e.target.value)}
                    fullWidth
                  />
                </Stack>
                {form.medicineFragments.length > 1 ? (
                  <Button color="error" onClick={() => onRemoveFragment(index)}>
                    Remove Fragment
                  </Button>
                ) : null}
              </Stack>
            </Paper>
          </Fragment>
        ))}
        <Button variant="outlined" onClick={onAddFragment}>
          Add Medicine Fragment
        </Button>
      </Stack>

      <Button type="submit" variant="contained" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </Stack>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [activeView, setActiveView] = useState("home");
  const [activeCategoryTab, setActiveCategoryTab] = useState("");
  const [adsConfig, setAdsConfig] = useState({ heroBanners: [], offers: [], carousel: [] });
  const [loadingAds, setLoadingAds] = useState(true);
  const [savingAds, setSavingAds] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [createForm, setCreateForm] = useState(createInitialForm());
  const [creating, setCreating] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState(createInitialForm());
  const [updating, setUpdating] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");

  async function loadProducts() {
    setLoadingProducts(true);
    try {
      const res = await fetch("/api/products", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to load products");
        return;
      }
      setProducts((data?.products || []).map(normalizeProduct));
    } catch {
      setError("Unable to load products");
    } finally {
      setLoadingProducts(false);
    }
  }

  async function loadOrders() {
    setLoadingOrders(true);
    try {
      const res = await fetch("/api/orders", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to load orders");
        return;
      }
      setOrders(data?.orders || []);
    } catch {
      setError("Unable to load orders");
    } finally {
      setLoadingOrders(false);
    }
  }

  async function loadAds() {
    setLoadingAds(true);
    try {
      const res = await fetch("/api/ads", { method: "GET", credentials: "include" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to load ads");
        return;
      }
      setAdsConfig({
        heroBanners: data?.ads?.heroBanners || [],
        offers: data?.ads?.offers || [],
        carousel: data?.ads?.carousel || [],
      });
    } catch {
      setError("Unable to load ads");
    } finally {
      setLoadingAds(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    async function checkAdmin() {
      try {
        const res = await fetch("/api/auth/me", { method: "GET", credentials: "include" });
        if (!res.ok) {
          router.replace("/auth");
          return;
        }
        const data = await res.json();
        const me = data?.user;
        if (!me || me.role !== "admin") {
          router.replace("/");
          return;
        }
        if (isMounted) setUser(me);
        await Promise.all([loadProducts(), loadOrders(), loadAds()]);
      } catch {
        if (isMounted) setError("Unable to validate admin access");
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }

    checkAdmin();
    return () => {
      isMounted = false;
    };
  }, [router]);

  function updateCreateField(field, value) {
    setCreateForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateCreateSideImage(index, value) {
    setCreateForm((prev) => ({
      ...prev,
      sideImages: prev.sideImages.map((url, i) => (i === index ? value : url)),
    }));
  }

  function addCreateSideImage() {
    setCreateForm((prev) => ({ ...prev, sideImages: [...prev.sideImages, ""] }));
  }

  function removeCreateSideImage(index) {
    setCreateForm((prev) => ({
      ...prev,
      sideImages: prev.sideImages.filter((_, i) => i !== index),
    }));
  }

  function updateCreateFragment(index, field, value) {
    setCreateForm((prev) => ({
      ...prev,
      medicineFragments: prev.medicineFragments.map((frag, i) => (i === index ? { ...frag, [field]: value } : frag)),
    }));
  }

  function addCreateFragment() {
    setCreateForm((prev) => ({ ...prev, medicineFragments: [...prev.medicineFragments, createEmptyFragment()] }));
  }

  function removeCreateFragment(index) {
    setCreateForm((prev) => ({
      ...prev,
      medicineFragments: prev.medicineFragments.filter((_, i) => i !== index),
    }));
  }

  function updateEditField(field, value) {
    setEditForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateEditSideImage(index, value) {
    setEditForm((prev) => ({
      ...prev,
      sideImages: prev.sideImages.map((url, i) => (i === index ? value : url)),
    }));
  }

  function addEditSideImage() {
    setEditForm((prev) => ({ ...prev, sideImages: [...prev.sideImages, ""] }));
  }

  function removeEditSideImage(index) {
    setEditForm((prev) => ({
      ...prev,
      sideImages: prev.sideImages.filter((_, i) => i !== index),
    }));
  }

  function updateEditFragment(index, field, value) {
    setEditForm((prev) => ({
      ...prev,
      medicineFragments: prev.medicineFragments.map((frag, i) => (i === index ? { ...frag, [field]: value } : frag)),
    }));
  }

  function addEditFragment() {
    setEditForm((prev) => ({ ...prev, medicineFragments: [...prev.medicineFragments, createEmptyFragment()] }));
  }

  function removeEditFragment(index) {
    setEditForm((prev) => ({
      ...prev,
      medicineFragments: prev.medicineFragments.filter((_, i) => i !== index),
    }));
  }

  async function onCreateProduct(e) {
    e.preventDefault();
    setCreating(true);
    setError("");
    setSuccess("");
    try {
      const payload = normalizeForm(createForm);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to create product");
        return;
      }
      setSuccess("Product created successfully.");
      setCreateForm(createInitialForm());
      setCreateModalOpen(false);
      await loadProducts();
    } catch {
      setError("Unable to create product");
    } finally {
      setCreating(false);
    }
  }

  function onStartEdit(product) {
    const normalized = normalizeProduct(product);
    setEditingId(normalized.id);
    setEditModalOpen(true);
    setEditForm({
      title: normalized.title || "",
      description: normalized.description || "",
      category: normalized.category || "",
      price: normalized.price ?? "",
      totalQuantity: normalized.totalQuantity ?? "",
      thumbImage: normalized.thumbImage || "",
      sideImages: normalized.sideImages && normalized.sideImages.length ? normalized.sideImages : [""],
      medicineFragments:
        normalized.medicineFragments && normalized.medicineFragments.length
          ? normalized.medicineFragments.map((frag) => ({
              medicineName: frag.medicineName || "",
              strength: frag.strength || "",
              dosageForm: frag.dosageForm || "",
              quantity: frag.quantity ?? "",
            }))
          : [createEmptyFragment()],
    });
  }

  function onCancelEdit() {
    setEditingId("");
    setEditForm(createInitialForm());
    setEditModalOpen(false);
  }

  async function onUpdateProduct(e) {
    e.preventDefault();
    if (!editingId) return;
    setUpdating(true);
    setError("");
    setSuccess("");
    try {
      const payload = normalizeForm(editForm);
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to update product");
        return;
      }
      setSuccess("Product updated successfully.");
      onCancelEdit();
      await loadProducts();
    } catch {
      setError("Unable to update product");
    } finally {
      setUpdating(false);
    }
  }

  async function onDeleteProduct(productId) {
    setDeletingId(productId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to delete product");
        return;
      }
      setSuccess("Product deleted successfully.");
      if (editingId === productId) onCancelEdit();
      await loadProducts();
    } catch {
      setError("Unable to delete product");
    } finally {
      setDeletingId("");
    }
  }

  async function onAdminUpdateOrder(orderId, payload) {
    setUpdatingOrderId(orderId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to update order");
        return;
      }
      setSuccess("Order updated successfully.");
      await loadOrders();
    } catch {
      setError("Unable to update order");
    } finally {
      setUpdatingOrderId("");
    }
  }

  function updateAdsItem(section, index, field, value) {
    setAdsConfig((prev) => ({
      ...prev,
      [section]: prev[section].map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    }));
  }

  function addAdsItem(section) {
    setAdsConfig((prev) => ({
      ...prev,
      [section]: [
        ...prev[section],
        section === "heroBanners" ? createEmptyBanner() : section === "offers" ? createEmptyOffer() : createEmptyCarouselItem(),
      ],
    }));
  }

  function removeAdsItem(section, index) {
    setAdsConfig((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  }

  async function onSaveAds() {
    setSavingAds(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        heroBanners: adsConfig.heroBanners,
        offers: adsConfig.offers,
        carousel: adsConfig.carousel,
      };
      const res = await fetch("/api/ads", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Unable to save ads");
        return;
      }
      setAdsConfig({
        heroBanners: data?.ads?.heroBanners || [],
        offers: data?.ads?.offers || [],
        carousel: data?.ads?.carousel || [],
      });
      setSuccess("Advertisement content updated.");
    } catch {
      setError("Unable to save ads");
    } finally {
      setSavingAds(false);
    }
  }

  const groupedProducts = useMemo(() => {
    return products.reduce((acc, product) => {
      const category = product.category || "General";
      if (!acc[category]) acc[category] = [];
      acc[category].push(product);
      return acc;
    }, {});
  }, [products]);

  const categoryTabs = useMemo(() => Object.keys(groupedProducts), [groupedProducts]);
  const offerProductOptions = useMemo(
    () =>
      products.map((product) => ({
        id: product.id,
        label: `${product.title || "Untitled"} (${product.category || "General"})`,
      })),
    [products]
  );

  useEffect(() => {
    if (!categoryTabs.length) {
      setActiveCategoryTab("");
      return;
    }
    if (!activeCategoryTab || !categoryTabs.includes(activeCategoryTab)) {
      setActiveCategoryTab(categoryTabs[0]);
    }
  }, [categoryTabs, activeCategoryTab]);

  const orderSummary = useMemo(() => {
    return {
      total: orders.length,
      pending: orders.filter((o) => ["processing", "payment_pending", "confirmed"].includes(o.deliveryStatus)).length,
      delivered: orders.filter((o) => o.deliveryStatus === "delivered").length,
      cancelled: orders.filter((o) => o.deliveryStatus === "cancelled").length,
    };
  }, [orders]);

  if (authLoading) {
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
        <Container maxWidth={false} sx={{ width: "min(1650px, 97vw)", mx: "auto" }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Box>
              <Typography variant="h4">Admin Dashboard</Typography>
              <Typography color="text.secondary">Manage products and incoming orders</Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button component={Link} href="/" variant="outlined">
                Home
              </Button>
              <Button component={Link} href="/profile" variant="contained">
                Profile
              </Button>
            </Stack>
          </Stack>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Logged in as: {user?.name} ({user?.role})
            </Typography>
          </Paper>

          {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
          {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}

          <Stack direction={{ xs: "column", lg: "row" }} spacing={2.2} alignItems="flex-start">
            <Box sx={{ width: { xs: "100%", lg: 270 }, position: { lg: "sticky" }, top: { lg: 88 } }}>
              <Card className="rounded-3xl">
                <CardContent>
                  <Typography variant="subtitle1" sx={{ mb: 1.2 }}>
                    Menu
                  </Typography>
                  <Stack spacing={1}>
                    <Button
                      variant={activeView === "home" ? "contained" : "outlined"}
                      onClick={() => setActiveView("home")}
                      fullWidth
                    >
                      Home
                    </Button>
                    <Button
                      variant={activeView === "orders" ? "contained" : "outlined"}
                      onClick={() => setActiveView("orders")}
                      fullWidth
                    >
                      Orders
                    </Button>
                    <Button
                      variant={activeView === "ads" ? "contained" : "outlined"}
                      onClick={() => setActiveView("ads")}
                      fullWidth
                    >
                      Ads
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ flex: 1, width: "100%" }}>
              {activeView === "home" ? (
                <Stack spacing={2}>
                  <Card className="rounded-3xl">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="h6">Products List</Typography>
                        <Button variant="contained" onClick={() => setCreateModalOpen(true)}>
                          Create Product
                        </Button>
                      </Stack>
                      {loadingProducts ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                          <CircularProgress size={30} />
                        </Stack>
                      ) : products.length === 0 ? (
                        <Typography color="text.secondary">No products yet.</Typography>
                      ) : (
                        <Stack spacing={1.5}>
                          <Tabs
                            value={activeCategoryTab}
                            onChange={(_, value) => setActiveCategoryTab(value)}
                            variant="scrollable"
                            scrollButtons="auto"
                          >
                            {categoryTabs.map((category) => (
                              <Tab
                                key={category}
                                value={category}
                                label={`${category} (${groupedProducts[category]?.length || 0})`}
                              />
                            ))}
                          </Tabs>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                xl: "repeat(3, minmax(0, 1fr))",
                              },
                              gap: 1.5,
                            }}
                          >
                            {(groupedProducts[activeCategoryTab] || []).map((product) => (
                              <Box key={product.id}>
                                <Card variant="outlined" sx={{ height: "100%" }}>
                                  <CardContent>
                                    <Stack spacing={0.8}>
                                      {product.thumbImage ? (
                                        <Box
                                          component="img"
                                          src={product.thumbImage}
                                          alt={product.title || "Product thumbnail"}
                                          sx={{
                                            width: "100%",
                                            height: 150,
                                            borderRadius: 1.5,
                                            border: "1px solid #d7ebe7",
                                            objectFit: "cover",
                                          }}
                                        />
                                      ) : null}
                                      <Typography variant="subtitle1">{product.title || "Untitled Product"}</Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        Price: {product.price ?? "-"} | Qty: {product.totalQuantity ?? "-"}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Fragments: {product.medicineFragments?.length || 0} | Side Images:{" "}
                                        {product.sideImages?.length || 0}
                                      </Typography>
                                      <Stack direction="row" spacing={1}>
                                        <Button size="small" variant="outlined" onClick={() => onStartEdit(product)}>
                                          Edit
                                        </Button>
                                        <Button
                                          size="small"
                                          color="error"
                                          variant="contained"
                                          onClick={() => onDeleteProduct(product.id)}
                                          disabled={deletingId === product.id}
                                        >
                                          {deletingId === product.id ? "Deleting..." : "Delete"}
                                        </Button>
                                      </Stack>
                                    </Stack>
                                  </CardContent>
                                </Card>
                              </Box>
                            ))}
                          </Box>
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                </Stack>
              ) : activeView === "orders" ? (
                <Stack spacing={2}>
                  <Grid container spacing={1.5}>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Total</Typography><Typography variant="h6">{orderSummary.total}</Typography></CardContent></Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Pending</Typography><Typography variant="h6">{orderSummary.pending}</Typography></CardContent></Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Delivered</Typography><Typography variant="h6">{orderSummary.delivered}</Typography></CardContent></Card>
                    </Grid>
                    <Grid item xs={6} md={3}>
                      <Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">Cancelled</Typography><Typography variant="h6">{orderSummary.cancelled}</Typography></CardContent></Card>
                    </Grid>
                  </Grid>

                  <Card className="rounded-3xl">
                    <CardContent>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                        <Typography variant="h6">All Orders</Typography>
                        <Button variant="outlined" onClick={loadOrders}>
                          Refresh
                        </Button>
                      </Stack>
                      {loadingOrders ? (
                        <Stack alignItems="center" sx={{ py: 4 }}>
                          <CircularProgress size={30} />
                        </Stack>
                      ) : orders.length === 0 ? (
                        <Typography color="text.secondary">No orders yet.</Typography>
                      ) : (
                        <Grid container spacing={1.5}>
                          {orders.map((order) => (
                            <Grid item xs={12} md={6} xl={4} key={order.id}>
                              <Card variant="outlined" sx={{ height: "100%" }}>
                                <CardContent>
                                  <Stack spacing={1}>
                                    <Typography variant="subtitle2">Order #{order.id}</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Client: {order?.userSnapshot?.name || "Unknown"}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      {order?.userSnapshot?.email || "N/A"}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Items: {order?.items?.length || 0} | Total: ₹{Number(order?.totalAmount || 0).toFixed(2)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Payment: {order?.paymentStatus || "-"} | Delivery: {order?.deliveryStatus || "-"}
                                    </Typography>
                                    <Stack direction="row" spacing={0.8} flexWrap="wrap">
                                      <Button component={Link} href={`/orders/${order.id}`} size="small" variant="outlined">
                                        View
                                      </Button>
                                      <Button
                                        size="small"
                                        color="error"
                                        variant="outlined"
                                        disabled={
                                          updatingOrderId === order.id ||
                                          ["cancelled", "delivered"].includes(order?.deliveryStatus)
                                        }
                                        onClick={() =>
                                          onAdminUpdateOrder(order.id, {
                                            orderStatus: "cancelled",
                                            deliveryStatus: "cancelled",
                                            message: "Order cancelled by admin",
                                          })
                                        }
                                      >
                                        {updatingOrderId === order.id ? "Updating..." : "Cancel"}
                                      </Button>
                                      <Button
                                        size="small"
                                        color="success"
                                        variant="contained"
                                        disabled={
                                          updatingOrderId === order.id ||
                                          ["cancelled", "delivered"].includes(order?.deliveryStatus)
                                        }
                                        onClick={() =>
                                          onAdminUpdateOrder(order.id, {
                                            orderStatus: "completed",
                                            deliveryStatus: "delivered",
                                            paymentStatus: "paid",
                                            message: "Order completed and delivered",
                                          })
                                        }
                                      >
                                        {updatingOrderId === order.id ? "Updating..." : "Complete"}
                                      </Button>
                                    </Stack>
                                  </Stack>
                                </CardContent>
                              </Card>
                            </Grid>
                          ))}
                        </Grid>
                      )}
                    </CardContent>
                  </Card>
                </Stack>
              ) : (
                <Card className="rounded-3xl">
                  <CardContent>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                      <Typography variant="h6">Landing Ads & Offers</Typography>
                      <Button variant="contained" onClick={onSaveAds} disabled={savingAds || loadingAds}>
                        {savingAds ? "Saving..." : "Save Ads"}
                      </Button>
                    </Stack>

                    {loadingAds ? (
                      <Stack alignItems="center" sx={{ py: 4 }}>
                        <CircularProgress size={30} />
                      </Stack>
                    ) : (
                      <Stack spacing={2}>
                        <Card variant="outlined">
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle1">Hero Banners</Typography>
                              <Button size="small" variant="outlined" onClick={() => addAdsItem("heroBanners")}>
                                Add Banner
                              </Button>
                            </Stack>
                            <Stack spacing={1.2}>
                              {adsConfig.heroBanners.map((item, index) => (
                                <Paper key={item.id || index} variant="outlined" sx={{ p: 1.2 }}>
                                  <Stack spacing={1}>
                                    <TextField
                                      label="Title"
                                      value={item.title || ""}
                                      onChange={(e) => updateAdsItem("heroBanners", index, "title", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Subtitle"
                                      value={item.subtitle || ""}
                                      onChange={(e) => updateAdsItem("heroBanners", index, "subtitle", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Image URL"
                                      value={item.image || ""}
                                      onChange={(e) => updateAdsItem("heroBanners", index, "image", e.target.value)}
                                      fullWidth
                                    />
                                    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                                      <TextField
                                        label="CTA Text"
                                        value={item.ctaText || ""}
                                        onChange={(e) => updateAdsItem("heroBanners", index, "ctaText", e.target.value)}
                                        fullWidth
                                      />
                                      <TextField
                                        label="CTA Link"
                                        value={item.ctaLink || ""}
                                        onChange={(e) => updateAdsItem("heroBanners", index, "ctaLink", e.target.value)}
                                        fullWidth
                                      />
                                    </Stack>
                                    <Button color="error" onClick={() => removeAdsItem("heroBanners", index)}>
                                      Remove
                                    </Button>
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>

                        <Card variant="outlined">
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle1">Offer Cards</Typography>
                              <Button size="small" variant="outlined" onClick={() => addAdsItem("offers")}>
                                Add Offer
                              </Button>
                            </Stack>
                            <Stack spacing={1.2}>
                              {adsConfig.offers.map((item, index) => (
                                <Paper key={item.id || index} variant="outlined" sx={{ p: 1.2 }}>
                                  <Stack spacing={1}>
                                    <TextField
                                      label="Title"
                                      value={item.title || ""}
                                      onChange={(e) => updateAdsItem("offers", index, "title", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Description"
                                      value={item.description || ""}
                                      onChange={(e) => updateAdsItem("offers", index, "description", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Badge"
                                      value={item.badge || ""}
                                      onChange={(e) => updateAdsItem("offers", index, "badge", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Offer Link"
                                      value={item.link || ""}
                                      onChange={(e) => updateAdsItem("offers", index, "link", e.target.value)}
                                      placeholder="/search?q=immunity"
                                      fullWidth
                                    />
                                    <Autocomplete
                                      multiple
                                      options={offerProductOptions}
                                      value={offerProductOptions.filter((option) =>
                                        Array.isArray(item.productIds) ? item.productIds.includes(option.id) : false
                                      )}
                                      isOptionEqualToValue={(option, value) => option.id === value.id}
                                      onChange={(_, nextValue) =>
                                        updateAdsItem(
                                          "offers",
                                          index,
                                          "productIds",
                                          nextValue.map((entry) => entry.id)
                                        )
                                      }
                                      renderInput={(params) => (
                                        <TextField
                                          {...params}
                                          label="Add Offer Products"
                                          placeholder="Search product title"
                                        />
                                      )}
                                    />
                                    <Button color="error" onClick={() => removeAdsItem("offers", index)}>
                                      Remove
                                    </Button>
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>

                        <Card variant="outlined">
                          <CardContent>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                              <Typography variant="subtitle1">Carousel Items</Typography>
                              <Button size="small" variant="outlined" onClick={() => addAdsItem("carousel")}>
                                Add Slide
                              </Button>
                            </Stack>
                            <Stack spacing={1.2}>
                              {adsConfig.carousel.map((item, index) => (
                                <Paper key={item.id || index} variant="outlined" sx={{ p: 1.2 }}>
                                  <Stack spacing={1}>
                                    <TextField
                                      label="Title"
                                      value={item.title || ""}
                                      onChange={(e) => updateAdsItem("carousel", index, "title", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Description"
                                      value={item.description || ""}
                                      onChange={(e) => updateAdsItem("carousel", index, "description", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Image URL"
                                      value={item.image || ""}
                                      onChange={(e) => updateAdsItem("carousel", index, "image", e.target.value)}
                                      fullWidth
                                    />
                                    <TextField
                                      label="Link"
                                      value={item.link || ""}
                                      onChange={(e) => updateAdsItem("carousel", index, "link", e.target.value)}
                                      fullWidth
                                    />
                                    <Button color="error" onClick={() => removeAdsItem("carousel", index)}>
                                      Remove
                                    </Button>
                                  </Stack>
                                </Paper>
                              ))}
                            </Stack>
                          </CardContent>
                        </Card>
                      </Stack>
                    )}
                  </CardContent>
                </Card>
              )}
            </Box>
          </Stack>

          <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="md" fullWidth>
            <DialogTitle>Create Product</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1 }}>
                <ProductForm
                  form={createForm}
                  onFieldChange={updateCreateField}
                  onSideImageChange={updateCreateSideImage}
                  onAddSideImage={addCreateSideImage}
                  onRemoveSideImage={removeCreateSideImage}
                  onFragmentFieldChange={updateCreateFragment}
                  onAddFragment={addCreateFragment}
                  onRemoveFragment={removeCreateFragment}
                  submitLabel="Create Product"
                  onSubmit={onCreateProduct}
                  submitting={creating}
                />
              </Box>
            </DialogContent>
          </Dialog>

          <Dialog open={editModalOpen} onClose={onCancelEdit} maxWidth="md" fullWidth>
            <DialogTitle>Update Product</DialogTitle>
            <DialogContent>
              <Box sx={{ pt: 1 }}>
                <ProductForm
                  form={editForm}
                  onFieldChange={updateEditField}
                  onSideImageChange={updateEditSideImage}
                  onAddSideImage={addEditSideImage}
                  onRemoveSideImage={removeEditSideImage}
                  onFragmentFieldChange={updateEditFragment}
                  onAddFragment={addEditFragment}
                  onRemoveFragment={removeEditFragment}
                  submitLabel="Update Product"
                  onSubmit={onUpdateProduct}
                  submitting={updating}
                />
                <Button color="secondary" onClick={onCancelEdit} sx={{ mt: 1 }}>
                  Cancel
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
