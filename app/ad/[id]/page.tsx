"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation";
import { useLoading } from "@/app/LoadingContext";
import { getCachedAd, setCachedAd } from "../../lib/ad-cache";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DynamicAd } from "@/components/DynamicAd";
import type { Ad } from "@/types/ad"
import { adClient } from "@/lib/api/ad-client"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import { PhoneIcon, MessageCircle, Clock, MapPin, Tag, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { formatDistanceToNow } from "date-fns"

export default function AdPage() {
  const params = useParams() as { id: string }
  const [ad, setAd] = useState<Ad | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { stopLoading } = useLoading();

  useEffect(() => {
    // Try cache first
    const cached = getCachedAd(params.id);
    if (cached) {
      setAd(cached);
      setLoading(false);
      stopLoading();
      fetchAdAndUpdate();
      return;
    }
    fetchAdAndUpdate();

    async function fetchAdAndUpdate() {
  try {
    // Use Next.js static fetch for first-load speed
    const response = await fetch(`/api/ads/${params.id}`, { cache: 'force-cache' });
    if (!response.ok) {
      setError("Ad not found.");
      setLoading(false);
      stopLoading();
      return;
    }
    const text = await response.text();
    if (!text) {
      setError("Ad not found.");
      setLoading(false);
      stopLoading();
      return;
    }
    let fetchedAd;
    try {
      fetchedAd = JSON.parse(text);
    } catch (jsonErr) {
      setError("Failed to load ad. Invalid response.");
      setLoading(false);
      stopLoading();
      return;
    }
    setCachedAd(params.id, fetchedAd);
    setAd(fetchedAd);
    setLoading(false);
    stopLoading();
  } catch (err) {
    console.error("Error fetching ad:", err);
    setError("Failed to load ad. Please try again later.");
    setLoading(false);
    stopLoading();
  }
}
  }, [params.id]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  if (error) {
    return <div className="text-center mt-8 text-red-500">{error}</div>
  }

  if (!ad) {
    return <div className="text-center mt-8">Ad not found</div>
  }

  const timeAgo = formatDistanceToNow(new Date(ad.created_at), { addSuffix: true })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative h-[300px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={ad.images?.[0] || "/placeholder.svg"}
            alt={ad.title}
            fill
            className="object-cover filter blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/40" />
        </div>
        <div className="relative h-full container mx-auto px-4 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            {ad.title}
          </h1>
          <div className="text-2xl md:text-3xl font-bold text-magenta-400">
            Rs. {ad.price.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Left Column - Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square relative rounded-lg overflow-hidden shadow-lg">
              <Image
                src={ad.images?.[0] || "/placeholder.svg"}
                alt={ad.title}
                fill
                className="object-cover"
              />
            </div>
            {ad.images && ad.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {ad.images.slice(1).map((image: string, index: number) => (
                  <div key={index} className="aspect-square relative rounded-lg overflow-hidden shadow-md">
                    <Image
                      src={image || "/placeholder.svg"}
                      alt={`${ad.title} - Image ${index + 2}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Information Panel */}
          <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-5 h-5" />
                <span>Posted {timeAgo}</span>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Description</h2>
                <p className="text-gray-700 leading-relaxed">{ad.description}</p>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Details</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Tag className="w-5 h-5" />
                    <span>{ad.category}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-5 h-5" />
                    <span>{ad.city}, {ad.district}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-gray-900">Contact Information</h2>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <PhoneIcon className="w-5 h-5 text-magenta-600" />
                    <span className="text-gray-700">{ad.contact_number}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {ad.is_whatsapp && (
                      <span className="text-green-600" title="WhatsApp available">
                        <MessageCircle className="w-5 h-5" />
                      </span>
                    )}
                    {ad.is_viber && (
                      <span className="text-purple-600" title="Viber available">
                        <PhoneIcon className="w-5 h-5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-magenta-600 hover:bg-magenta-700 text-white py-6 text-lg"
              onClick={() => {
                if (ad.contact_number) {
                  window.location.href = `tel:${ad.contact_number}`
                } else {
                  toast({
                    title: "Error",
                    description: "Contact number not available",
                    variant: "destructive",
                  })
                }
              }}
            >
              Contact Advertiser
            </Button>
          </div>
        </div>

        {/* Bottom Ad Space */}
        <div className="mt-8">
          <div className="h-[250px] bg-gray-100 rounded-lg flex items-center justify-center border border-gray-200">
            <span className="text-gray-500">Advertisement Space</span>
          </div>
        </div>
      </div>
      {/* Bottom Ad Space */}
      <div className="w-full flex justify-center mt-8">
        <DynamicAd position="adpage_bottom" className="w-full max-w-[728px] h-[90px]" />
      </div>
    </div>
  )
}
