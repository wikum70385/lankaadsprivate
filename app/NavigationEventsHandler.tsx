"use client";
import { useEffect } from "react";
import { useLoading } from "@/app/LoadingContext";
import { useRouter } from "next/navigation";

export default function NavigationEventsHandler() {
  const { stopLoading } = useLoading();
  const router = useRouter();

  useEffect(() => {
    // Next.js app router does not expose router.events, so use window events
    const handleComplete = () => stopLoading();
    window.addEventListener("next-route-done", handleComplete);
    window.addEventListener("next-route-error", handleComplete);
    // Fallback: always stop loading after a short delay (for static pages)
    const timeout = setTimeout(stopLoading, 800);
    return () => {
      window.removeEventListener("next-route-done", handleComplete);
      window.removeEventListener("next-route-error", handleComplete);
      clearTimeout(timeout);
    };
  }, [stopLoading]);
  return null;
}
