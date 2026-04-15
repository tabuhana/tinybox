import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import ModalProvider from "@/providers/modal-provider";
import { ThemeProvider } from "@/providers/theme-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Tinybox",
  description: "All in one Agency Solution",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("h-full", "antialiased", inter.variable, "font-sans")}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ModalProvider>
            {children}
            <Toaster />
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
