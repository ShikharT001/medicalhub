import CheckoutPageView from "@/components/checkout/CheckoutPageView";

export const metadata = {
  title: "Checkout",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CheckoutPage() {
  return <CheckoutPageView />;
}
