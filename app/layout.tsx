import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import MobileBottomNav from "@/components/layout/mobile-bottom-nav";
import HideOnAdmin from "@/components/layout/hide-on-admin";
import { Toaster } from "sonner";
import { SessionTimeoutProvider } from "@/components/auth/session-timeout-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { GuestCtaController } from "@/components/guest-cta-controller";
import { MemberOnlyModal } from "@/components/member-only-modal";
import { GuestMigrationProvider } from "@/components/guest-migration-provider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.example.com"),
  title: "결정소 - 투표하고 예측하세요",
  description: "A vs B, 당신의 선택은? 결정소에서 투표하고 결과를 예측해보세요.",
  openGraph: {
    title: "결정소",
    description: "투표하고 예측하세요",
    type: "website",
    siteName: "결정소",
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "결정소" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "결정소",
    description: "투표하고 예측하세요",
    images: ["/og-default.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          disableTransitionOnChange
        >
          <QueryProvider>
            <SessionTimeoutProvider>
              <Toaster position="top-center" richColors />
              <HideOnAdmin><Header /></HideOnAdmin>
              <main className="flex-1 pb-16 sm:pb-0">
                {children}
              </main>
              <HideOnAdmin><Footer /></HideOnAdmin>
              <HideOnAdmin><MobileBottomNav /></HideOnAdmin>
              <GuestCtaController />
              <MemberOnlyModal />
              <GuestMigrationProvider />
            </SessionTimeoutProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
