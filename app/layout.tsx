import type { Metadata } from "next";
import { ToastProvider } from './context/ToastContext';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import 'leaflet/dist/leaflet.css';
import InAppBrowserGuard from "./component/InAppBrowserGuard";
import OneSignalInit from "./component/OneSignalInit"; // <--- IMPORT THIS

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TWST.FUN: Your SECRET MESSAGE Agent",

  description: "Find best AI integrated service",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* Run OneSignal logic here */}
        <OneSignalInit />

        <InAppBrowserGuard>
          <ToastProvider>
            {children}
          </ToastProvider>
        </InAppBrowserGuard>
      </body>
    </html>
  );
}