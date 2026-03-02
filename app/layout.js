import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SiteNavbar from "@/components/common/SiteNavbar";
import AppThemeProvider from "@/components/common/AppThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "MedicalHub | Online Medical Store",
    template: "%s | MedicalHub",
  },
  description:
    "MedicalHub is your premium online medical selling platform for trusted medicines, wellness products, and fast delivery.",
  keywords: [
    "online pharmacy",
    "medical ecommerce",
    "medicine delivery",
    "healthcare products",
    "medicalhub",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MedicalHub | Online Medical Store",
    description:
      "Trusted online medical marketplace with secure checkout, delivery tracking, and verified products.",
    url: "/",
    siteName: "MedicalHub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MedicalHub | Online Medical Store",
    description:
      "Trusted online medical marketplace with secure checkout, delivery tracking, and verified products.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AppThemeProvider>
          <SiteNavbar />
          {children}
        </AppThemeProvider>
      </body>
    </html>
  );
}
