import OrderDetailsPageView from "@/components/orders/OrderDetailsPageView";

export const metadata = {
  title: "Order Details",
  robots: {
    index: false,
    follow: false,
  },
};

export default function OrderDetailsPage() {
  return <OrderDetailsPageView />;
}
