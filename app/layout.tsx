import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/providers/session-provider/session-provider";

const inter = Inter({ subsets: ["latin"] });


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
