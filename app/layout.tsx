import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProviderWrapper } from './components/providers/google-oauth-provider';

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Exam Management System",
  description: "Professional exam management platform for educational institutions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} font-inter antialiased bg-gray-900`}
      >
        <GoogleOAuthProviderWrapper>
          {children}
        </GoogleOAuthProviderWrapper>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
