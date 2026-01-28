import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/session-provider/session-provider";

const inter = Inter({ subsets: ["latin"] });

{/*export const metadata: Metadata = {
  title: "Verifeye",
  description: "Community safety and engagement",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0",
};*/}
export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata = {
  title: 'Verifeye',
  description: 'Neighborhood Watch App',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
        {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
