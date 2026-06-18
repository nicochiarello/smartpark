import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "SmartPark — Estacionamiento Blockchain",
  description: "Reservá lugares de estacionamiento público de forma transparente con blockchain. Combatimos la extorsión informal en Argentina.",
  keywords: ["estacionamiento", "blockchain", "Argentina", "Mendoza", "smart city"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-surface-900 text-surface-100">
        <AppProvider>
          <Header />
          <main className="pt-16">{children}</main>
        </AppProvider>
      </body>
    </html>
  );
}
