import type { Metadata, Viewport } from "next";
import "./globals.css";
import ErrorBoundary from "./components/ErrorBoundary";

export const metadata: Metadata = {
  title: "Aurex - Advanced Security Platform for Cybersecurity Professionals",
  description:
    "Comprehensive cybersecurity platform featuring encrypted communications, digital forensics, threat intelligence, and advanced security tools for professionals.",
  keywords: [
    "aurex",
    "cybersecurity platform",
    "digital forensics",
    "threat intelligence",
    "penetration testing",
    "security tools",
    "encrypted communications",
    "incident response",
  ],
  authors: [{ name: "Aurex Security" }],
  openGraph: {
    title: "Aurex - Advanced Security Platform",
    description: "Professional cybersecurity platform with enterprise-grade tools",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="icon" href="/favicon.ico" />
      </head>
  <body className="min-h-screen bg-cyber-dark text-white" suppressHydrationWarning>
        <div suppressHydrationWarning>{children}</div>
      </body>
    </html>
  );
}
