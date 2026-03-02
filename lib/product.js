export function normalizeProduct(product) {
  const totalQuantity =
    product?.totalQuantity ?? product?.total_quantity ?? 0;

  const medicineFragments =
    product?.medicineFragments ?? product?.medicine_fragments ?? [];

  const sideImages = Array.isArray(product?.sideImages) ? product.sideImages : [];
  const thumbImage = product?.thumbImage || "";

  return {
    ...product,
    totalQuantity,
    medicineFragments,
    thumbImage,
    sideImages,
  };
}

export function getProductImages(product) {
  const normalized = normalizeProduct(product);
  return [normalized.thumbImage, ...normalized.sideImages].filter(Boolean);
}
