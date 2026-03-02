import OrdersPageView from "@/components/orders/OrdersPageView";

export const metadata = {
  title: "My Orders",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrdersPage() {
  return <OrdersPageView />;
}
