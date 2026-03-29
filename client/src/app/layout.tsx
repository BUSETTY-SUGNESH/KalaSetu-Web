import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/context/AuthContext";

export const metadata: Metadata = {
  title: "KalaSetu — India's Premier Cultural Marketplace",
  description: "Discover, buy, and bid on authentic Indian art. Connect with verified artists, join cultural events, and be part of India's largest art community.",
  keywords: "Indian art, cultural marketplace, paintings, sculptures, digital art, art auction, workshops",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main className="page-wrapper">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
