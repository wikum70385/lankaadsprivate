"use client"

import dynamic from "next/dynamic"

const BackgroundDesign = dynamic(() => import("@/components/BackgroundDesign").then(mod => ({ default: mod.BackgroundDesign })), {
  ssr: false,
  loading: () => <div className="fixed inset-0 -z-10 bg-gradient-to-b from-magenta-50 to-white" />
})

export function ClientBackground() {
  return <BackgroundDesign />
} 