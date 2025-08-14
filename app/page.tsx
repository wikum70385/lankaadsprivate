"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLoading } from "@/app/LoadingContext"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { categories } from "@/lib/categories"
import { locations } from "@/lib/locations"
import { adClient } from "@/lib/api/ad-client"
import { getCachedAds, setCachedAds, getCachedAd, setCachedAd } from "./lib/ad-cache"
import type { Ad } from "@/types/ad"
import AdComponent from "@/components/AdComponent"
import { DynamicAd } from "@/components/DynamicAd"
import { Search } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { LoginModal } from "@/components/login-modal"

export default function Home() {
  const router = useRouter()
  const { user } = useAuth()
  const [latestAds, setLatestAds] = useState<Ad[]>([])
  const [filteredAds, setFilteredAds] = useState<Ad[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [selectedCity, setSelectedCity] = useState("")
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const [locationFilter, setLocationFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const adsPerPage = 20
  const { stopLoading } = useLoading();

  useEffect(() => {
    async function fetchAds() {
      try {
        const ads = await adClient.getAds()
        setLatestAds(ads)
        setFilteredAds(ads) // Initialize filtered ads with all ads
        setIsLoading(false)
        stopLoading();
      } catch (err) {
        console.error("Error fetching ads:", err)
        setError("Failed to load latest ads. Please try again later.")
        setIsLoading(false)
        stopLoading();
      }
    }

    fetchAds()
  }, [])

  // Background cache preload for all categories and first 20 ads
  useEffect(() => {
    if (isLoading || latestAds.length === 0) return;
    // Preload all categories
    categories.forEach((cat) => {
      if (!getCachedAds(cat.slug)) {
        fetch(`/api/ads?category=${cat.slug}`)
          .then(res => res.json())
          .then(data => setCachedAds(cat.slug, data))
          .catch(() => {});
      }
    });
    // Preload first 20 ad details
    latestAds.slice(0, 20).forEach((ad) => {
      if (!getCachedAd(ad.id)) {
        fetch(`/api/ads/${ad.id}`)
          .then(res => res.json())
          .then(data => setCachedAd(ad.id, data))
          .catch(() => {});
      }
    });
  }, [isLoading, latestAds]);

  const handleSearch = () => {
    const filtered = latestAds.filter((ad) => {
      if (selectedCategory && ad.category !== selectedCategory) return false
      if (selectedDistrict && ad.district !== selectedDistrict) return false
      if (selectedCity && ad.city !== selectedCity) return false
      if (locationFilter && ad.district !== locationFilter) return false
      if (searchTerm && !ad.title.toLowerCase().includes(searchTerm.toLowerCase())) return false
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

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section with Background Image */}
      <div className="relative -mx-4 -mt-8 mb-12 rounded-lg overflow-hidden shadow-lg">
        <div className="absolute inset-0">
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/pixelcut-export.jpg-RBsZHWXkPaSfaBLy6hdGosvvWBIiwr.jpeg"
            alt="Hero background"
            fill
            className="object-cover object-center opacity-100"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 backdrop-blur-[1px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto text-center px-4 py-16">
          <h1 className="text-4xl font-bold mb-4 text-white">Free Sri Lankan Classified Ads</h1>
          <p className="text-lg mb-6 text-primary-foreground">Discover Private Connections, Special Services & More</p>
          <div className="flex flex-col items-center gap-4 mb-6">
            <a
              href="http://localhost:8080"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-magenta-600 hover:bg-magenta-700 text-white px-6 py-2 rounded-full text-lg font-semibold mb-2 inline-block text-center"
            >
              Join Chatroom
            </a>
            <Button
              onClick={() => {
                if (user) {
                  router.push("/post-ad")
                } else {
                  setIsLoginOpen(true)
                }
              }}
              className="bg-magenta-600 hover:bg-magenta-700 text-white px-6 py-2 rounded-full text-lg font-semibold"
            >
              Post your ad now
            </Button>
            <div className="flex flex-col gap-2 w-full max-w-md">
              <div className="flex gap-2 w-full">
                <Input
                  type="search"
                  placeholder="Search ads..."
                  className="flex-1 border-magenta-300 focus:ring-magenta-500 focus:border-magenta-500 bg-white/90"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select
                  className="border border-magenta-300 rounded-md focus:ring-magenta-500 focus:border-magenta-500 bg-white/90 px-2 w-32 text-xs"
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
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-12 bg-magenta-500 py-8 -mx-4 px-4 rounded-lg">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">Browse Categories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={`/category/${category.slug}`}
              className="group flex items-center p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow border border-magenta-100"
            >
              <category.icon className="w-8 h-8 mr-3 text-magenta-600 group-hover:text-magenta-700" />
              <h3 className="font-semibold group-hover:text-magenta-700">{category.name}</h3>
            </Link>
          ))}
        </div>
      </div>

      {/* Latest Ads */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center text-magenta-700">Latest Ads</h2>
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
            <div className="text-center text-gray-500">No ads found</div>
          ) : (
            <div className="space-y-4">
              {insertAdSpaces(currentAds).map((item, index) => 
                item === 'ad-space' ? (
                  <div key={`ad-space-${index}`} className="h-32 bg-magenta-50 rounded-lg flex items-center justify-center">
                    {/* Rotating mobile ad space */}
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

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </div>
  )
}
