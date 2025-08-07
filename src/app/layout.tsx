// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import { ThemeProvider } from "@/providers/theme-provider";
import { Geist, Geist_Mono } from "next/font/google";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ModalProvider from "@/providers/modal-provider";
import { BillingProvider } from "@/providers/billing-provider";
import { Toaster } from "sonner";
const font = DM_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fuzzie",
  description: "Automate your work with Fuzzie",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider 
    publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
    >
    <html lang="en" suppressHydrationWarning>
    

      <body className={font.className}>
       
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ModalProvider>
            <BillingProvider>
              {children}
              <Toaster />
            </BillingProvider>
          </ModalProvider>
        </ThemeProvider>
      </body>
    </html>
    </ClerkProvider>
  );
}
