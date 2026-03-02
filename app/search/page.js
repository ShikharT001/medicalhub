import { Suspense } from "react";
import SearchResultsPage from "@/components/products/SearchResultsPage";

export const metadata = {
  title: "Search Products",
  description: "Search medicines and healthcare products by name, category, and filters.",
};

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchResultsPage />
    </Suspense>
  );
}
