import { Ad } from "@/types/ad"
import { formatDistanceToNow } from "date-fns"
import { MapPin, Phone, MessageCircle, Clock, Tag } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import AdSystemLink from "@/components/AdSystemLink"
import React from "react";
import { DynamicAd } from "./DynamicAd";

interface AdComponentProps {
  ad: Ad
}

export default function AdComponent({ ad }: AdComponentProps) {
  const timeAgo = formatDistanceToNow(new Date(ad.created_at), { addSuffix: true })

  return (
    <AdSystemLink href={`/ad/${ad.id}`} className="block w-full">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[140px] md:h-[180px]">
        <div className="flex p-0 h-full">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0 h-full w-full max-w-[calc(100%/3)] aspect-square">

            <Image
              src={ad.images?.[0] || "/placeholder.svg"}
              alt={ad.title}
              fill
              className="object-cover rounded-none"
            />
          </div>

          {/* Content */}
          <div className="ml-3 md:ml-4 flex-1 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex justify-between items-start gap-2">
                <h3 className="text-base md:text-lg font-semibold text-gray-900 truncate">{ad.title}</h3>
                <div className="flex items-center text-xs md:text-sm text-gray-500 flex-shrink-0">
                  <Clock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                  <span className="whitespace-nowrap">{timeAgo}</span>
                </div>
              </div>
              <p className="text-sm md:text-base text-gray-600 mt-1 line-clamp-2">{ad.description}</p>
            </div>
            
            <div className="mt-auto">
              <div className="flex flex-wrap items-center gap-1 md:gap-2 text-xs md:text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{ad.district}, {ad.city}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Tag className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                  <span className="truncate">{ad.category}</span>
                </div>
              </div>
              <div className="mt-1 md:mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-4">
                  <span className="text-base md:text-lg font-bold text-magenta-600">Rs. {ad.price.toLocaleString()}</span>
                  <div className="flex items-center gap-1 md:gap-2">
                    {ad.is_whatsapp && (
                      <span className="text-green-600">
                        <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
                      </span>
                    )}
                    {ad.is_viber && (
                      <span className="text-purple-600">
                        <Phone className="w-4 h-4 md:w-5 md:h-5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdSystemLink>
  )
}
