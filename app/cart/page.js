import CartPageView from "@/components/cart/CartPageView";

export const metadata = {
  title: "Cart",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CartPage() {
  return <CartPageView />;
}
