import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import BootstrapClient from "@/app/lib/BootstrapClient";
import Navbar from "@/app/components/Navbar";
import QueryProvider from "@/app/components/QueryProvider";
import GlobalLoader from "@/components/common/GlobalLoader";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  icons: {
    icon: "/images/logo.ico" // Fixed path (removed /public)
  },
  title: "EGYGO TRAVEL APP",
  description: "Discover Egypt with the perfect local guide",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <BootstrapClient />
        <QueryProvider>
          {/* 
            GlobalLoader will be controlled by:
            1. Route loading states
            2. React Query loading states
            3. Manual loading triggers
          */}
          <GlobalLoader isLoading={false} />
          
          <Navbar />
          <main style={{ paddingTop: '80px' }}>
            {children}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}