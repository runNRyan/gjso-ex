"use client"

import { HeroSection } from "@/components/hero-section"
import { HowItWorks } from "@/components/how-it-works"
import { OnboardingDialog } from "@/components/onboarding-dialog"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
          <HeroSection />

          <HowItWorks />

          <OnboardingDialog />

          <div className="flex justify-center pt-4">
            <Link
              href="/swipe"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-md hover:bg-primary/90 transition-colors"
            >
              투표 하러가기
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
