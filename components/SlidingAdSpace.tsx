"use client"

import { useState, useEffect } from "react";
import { DynamicAd } from "./DynamicAd";
import { ChevronUp, ChevronDown } from "lucide-react"

export function SlidingAdSpace() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // Hide the ad when near the bottom of the page
      if (scrollPosition + windowHeight > documentHeight - 200) {
        setIsVisible(false)
      } else {
        setIsVisible(true)
      }
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-magenta-200 shadow-lg transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full rounded-t-lg px-4 py-2 flex items-center justify-center shadow-md bg-magenta-700 text-white"
      >
        {isVisible ? (
          <>
            <ChevronDown className="w-4 h-4 mr-2" />
            <span>Hide Ad</span>
          </>
        ) : (
          <>
            <ChevronUp className="w-4 h-4 mr-2" />
            <span>Show Ad</span>
          </>
        )}
      </button>
      <div className="max-w-[728px] h-[90px] mx-auto bg-gray-300 flex items-center justify-center relative">
        <DynamicAd position="sliding" className="w-full h-full" />
      </div>
    </div>
  )
}
