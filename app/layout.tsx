import "./globals.css"
import { DynamicAd } from "@/components/DynamicAd"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import Link from "next/link"
import AdSystemLink from "@/components/AdSystemLink"
import type React from "react"
import { ErrorBoundary } from "@/components/error-boundary"
import { GlobalStyles } from "@/components/GlobalStyles"
import { SlidingAdSpace } from "@/components/SlidingAdSpace"
import { ClientBackground } from "@/components/ClientBackground"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LankaAdsPrivate - Connections & More",
  description: "Find personal connections and services in Sri Lanka",
  generator: "v0.dev",
}

import GlobalNavigationLoader from "./GlobalNavigationLoader";
import { LoadingProvider } from "./LoadingContext";
import NavigationEventsHandler from "./NavigationEventsHandler";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="rating" content="adult" />
        <meta name="robots" content="index, follow" />
        <meta name="googlebot" content="index, follow, notranslate, noimageindex" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.className} min-h-screen`}>
        <LoadingProvider>
          <GlobalNavigationLoader />
          <NavigationEventsHandler />
          <ClientBackground />
          <div className="relative min-h-screen">
            <div className="relative z-10">
              <ErrorBoundary>
                <AuthProvider>
                  <Header />
                  {/* Leaderboard Ad Space */}
                  <div className="w-full bg-white/80 backdrop-blur-sm text-center py-2 px-4 shadow-sm">
                    <div className="max-w-[728px] h-[90px] mx-auto bg-gray-300 flex items-center justify-center rounded shadow-md">
                      <DynamicAd position="leaderboard" className="w-full h-full" />
                    </div>
                  </div>
                  <div className="container mx-auto px-4 py-2">
                    <AdSystemLink href="/intro" className="text-rose-600 hover:text-rose-700">
                      Go to Introduction Page
                    </AdSystemLink>
                  </div>
                  <main className="min-h-screen pb-24">{children}</main>
                  {/* Static Mobile Ad Space */}
                  <div className="w-full bg-white/80 backdrop-blur-sm text-center py-4 px-4 md:hidden">
                    <DynamicAd position="footer_mobile" className="h-[100px] w-full" />
                  </div>
                  <Footer />
                  <Toaster />
                  <SlidingAdSpace />
                </AuthProvider>
              </ErrorBoundary>
            </div>
          </div>
        </LoadingProvider>
        <GlobalStyles />
      </body>
    </html>
  )
}
