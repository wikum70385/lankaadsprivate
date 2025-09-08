"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useLoading } from "@/app/LoadingContext";
import { getCachedAds, setCachedAds } from "../../../new chat system/frontend/src/lib/ad-cache"
import { categories } from "@/lib/categories"
import type { Ad } from "@/types/ad"
import { adClient } from "@/lib/api/ad-client"
import AdComponent from "@/components/AdComponent"
import { DynamicAd } from "@/components/DynamicAd"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { locations } from "@/lib/locations"

export default function CategoryPage() {
  const params = useParams() as { slug: string }
  const [ads, setAds] = useState<Ad[]>([])
  const [filteredAds, setFilteredAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const adsPerPage = 20
  const { stopLoading } = useLoading();

  const category = categories.find((cat) => cat.slug === params.slug)

  useEffect(() => {
    // Try cache first
    const cached = getCachedAds(params.slug);
    if (cached) {
      setAds(cached);
      setFilteredAds(cached);
      setIsLoading(false);
      stopLoading();
      // Still fetch in background to update
      fetchAdsAndUpdate();
      return;
    }
    fetchAdsAndUpdate();

    async function fetchAdsAndUpdate() {
      try {
        // Use Next.js static fetch for first-load speed
        const fetchedAds = await fetch('/api/ads', { cache: 'force-cache' })
          .then(res => res.json());
        // Filter ads by category name (case-insensitive)
        const categoryAds = fetchedAds.filter((ad: Ad) => {
          // Normalize both strings for comparison
          const adCategory = ad.category.toLowerCase().trim();
          const targetCategory = category?.name.toLowerCase().trim();
          const targetSlug = params.slug.toLowerCase().trim();
          // Match either the category name or slug
          return adCategory === targetCategory || 
                 adCategory === targetSlug ||
                 adCategory === targetSlug.replace(/-/g, ' ') ||
                 adCategory === targetCategory?.replace(/\s+/g, '-');
        });
        // Sort by created_at in descending order (newest first)
        const sortedAds = categoryAds.sort((a: Ad, b: Ad) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setCachedAds(params.slug, sortedAds);
        setAds(sortedAds);
        setFilteredAds(sortedAds);
        setIsLoading(false);
        stopLoading();
      } catch (err) {
        console.error("Error fetching ads:", err);
        setError("Failed to load ads. Please try again later.");
        setIsLoading(false);
        stopLoading();
      }
    }

    if (category) {
      fetchAdsAndUpdate();
    }
  }, [category, params.slug]);

  const handleSearch = () => {
    const filtered = ads.filter((ad) => {
      if (searchTerm && !ad.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
      if (locationFilter && ad.district !== locationFilter) return false
      return true
    })
    setFilteredAds(filtered)
    setCurrentPage(1) // Reset to first page when searching
  }

  // Pagination logic
  const indexOfLastAd = currentPage * adsPerPage
  const indexOfFirstAd = indexOfLastAd - adsPerPage
  const currentAds = filteredAds.slice(indexOfFirstAd, indexOfLastAd)

  // Function to insert ad space after every 4 ads
  const insertAdSpaces = (ads: Ad[]) => {
    const result: (Ad | 'ad-space')[] = []
    ads.forEach((ad, index) => {
      result.push(ad)
      if ((index + 1) % 4 === 0 && index < ads.length - 1) {
        result.push('ad-space')
      }
    })
    return result
  }

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  if (!category) {
    return <div className="text-center mt-8">Category not found</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-center text-magenta-700">
        {category.name}
      </h1>

      {/* Search and Filter Section */}
      <div className="max-w-2xl mx-auto mb-8">
        <div className="flex gap-2">
          <Input
            type="search"
            placeholder="Search ads..."
            className="flex-1 border-magenta-300 focus:ring-magenta-500 focus:border-magenta-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select
            className="border border-magenta-300 rounded-md focus:ring-magenta-500 focus:border-magenta-500 px-2 w-32 text-sm"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">All Locations</option>
            {locations.map((location) => (
              <option key={location.district} value={location.district}>
                {location.district}
              </option>
            ))}
          </select>
          <Button 
            className="bg-magenta-600 hover:bg-magenta-700"
            onClick={handleSearch}
          >
            <Search className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="flex p-4">
                <Skeleton className="w-24 h-24 md:w-32 md:h-32 flex-shrink-0" />
                <div className="ml-4 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                  <Skeleton className="h-4 w-full mt-2" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
              </div>
            </Card>
          ))
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : currentAds.length === 0 ? (
          <div className="text-center text-gray-500">No ads found in this category</div>
        ) : (
          <div className="space-y-4">
            {insertAdSpaces(currentAds).map((item, index) => 
              item === 'ad-space' ? (
                <div key={`ad-space-${index}`} className="h-32 flex items-center justify-center">
                  <DynamicAd position="listing_mobile" adIndex={Math.floor(index / 5)} className="w-full h-full" />
                </div>
              ) : (
                <AdComponent key={item.id} ad={item} />
              )
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && !error && filteredAds.length > 0 && (
        <div className="mt-8 flex justify-center gap-2">
          <Button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-magenta-600 hover:bg-magenta-700 disabled:opacity-50"
          >
            Previous
          </Button>
          <Button
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastAd >= filteredAds.length}
            className="bg-magenta-600 hover:bg-magenta-700 disabled:opacity-50"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
