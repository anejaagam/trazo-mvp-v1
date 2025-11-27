import type { Metadata } from "next";
import { Playfair_Display, Lato } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Trazo - Farm Management Platform",
  description: "Transform your farming operations with Trazo's comprehensive management platform",
};

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  display: "swap",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lato = Lato({
  variable: "--font-body",
  display: "swap",
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
});

// Self-hosted Helvetica: binds to --font-helvetica for Tailwind's font-helvetica utility
const helveticaLocal = localFont({
  variable: "--font-helvetica",
  display: "swap",
  src: [
    { path: "./fonts/helvetica/Helvetica.ttf", weight: "300", style: "normal" },
    { path: "./fonts/helvetica/Helvetica.ttf", weight: "400", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-Oblique.ttf", weight: "400", style: "italic" },
    { path: "./fonts/helvetica/Helvetica-Bold.ttf", weight: "700", style: "normal" },
    { path: "./fonts/helvetica/Helvetica-BoldOblique.ttf", weight: "700", style: "italic" },
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full overflow-hidden">
  <body className={`${playfairDisplay.variable} ${lato.variable} ${helveticaLocal.variable} font-body antialiased h-full overflow-hidden`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
