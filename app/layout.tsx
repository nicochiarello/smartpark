import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "SmartPark — Blockchain Parking",
  description: "Reserve public parking spaces transparently using blockchain technology. Fighting informal parking extortion in Argentina.",
  keywords: ["parking", "blockchain", "Argentina", "Mendoza", "smart city"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-surface-900 text-surface-100">
        <AppProvider>
          <Header />
          <main className="pt-16">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
