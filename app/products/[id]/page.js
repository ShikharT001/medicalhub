import ProductDetailView from "@/components/products/ProductDetailView";

export const metadata = {
  title: "Product Details",
  description: "View medicine details, images, pricing, and quantity information.",
};

export default function ProductDetailsPage() {
  return <ProductDetailView />;
}
