"use client";
import { useLoading } from "./LoadingContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function GlobalNavigationLoader() {
  const { loading } = useLoading();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/70 pointer-events-auto">
      <LoadingSpinner size={64} />
    </div>
  );
}
