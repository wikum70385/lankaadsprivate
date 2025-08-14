"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useLoading } from "@/app/LoadingContext"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import LoadingSpinner from "@/components/ui/LoadingSpinner"
import type { Ad } from "@/types/ad"
import { adClient } from "@/lib/api/ad-client"
import AdComponent from "@/components/AdComponent"
import { Edit, Trash2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Constants for ad limitations
const AD_EDIT_LOCK_PERIOD = 14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
const AD_EXPIRATION_PERIOD = 60 * 24 * 60 * 60 * 1000 // 60 days (2 months) in milliseconds
const MAX_ADS_PER_USER = 4 // Maximum number of ads allowed per user

import DeleteAccountDialog from "../post-ad/DeleteAccountDialog";

export default function ProfilePage() {
  const router = useRouter()
  const { user } = useAuth()
  const [userAds, setUserAds] = useState<Ad[]>([])
  const [adCount, setAdCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()
  const { stopLoading } = useLoading();

  // Handler for account deletion
  const handleDeleteAccount = async () => {
    try {
      await adClient.deleteAccount();
      localStorage.clear();
      window.location.href = "/";
    } catch (error) {
      toast({
        title: "Failed to delete account",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  }

  useEffect(() => {
    if (!user) {
      router.push("/login")
      return
    }

    const fetchUserAds = async () => {
      try {
        const ads = await adClient.getUserAds()
        setUserAds(ads)
        const count = await adClient.getUserAdCount()
        setAdCount(count)
        setIsLoading(false)
        stopLoading();
      } catch (err) {
        console.error("Error fetching user ads:", err)
        setError("Failed to load your ads. Please try again later.")
        setIsLoading(false)
        stopLoading();
      }
    }

    fetchUserAds()
  }, [user, router])

  const canModifyAd = (ad: Ad) => {
    const now = new Date()
    const createdDate = new Date(ad.created_at)
    const editLockedUntil = ad.edit_locked_until ? new Date(ad.edit_locked_until) : null
    const expiresAt = new Date(ad.expires_at)

    // Can't modify if ad is expired
    if (now > expiresAt) {
      return false
    }

    // Can't modify if still in edit lock period
    if (editLockedUntil && now < editLockedUntil) {
      return false
    }

    return true
  }

  const handleEditAd = (ad: Ad) => {
    if (!canModifyAd(ad)) {
      const now = new Date()
      const editLockedUntil = new Date(ad.edit_locked_until)
      const timeLeft = Math.ceil((editLockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      toast({
        title: "Cannot Modify Ad",
        description: `This ad cannot be modified for ${timeLeft} more days.`,
        variant: "destructive",
      })
      return
    }
    // Redirect to post-ad with edit param
    router.push(`/post-ad?edit=${ad.id}`);
  }

  const handleDeleteAd = async (adId: string, ad: Ad) => {
    if (!canModifyAd(ad)) {
      const now = new Date()
      const editLockedUntil = new Date(ad.edit_locked_until)
      const timeLeft = Math.ceil((editLockedUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      toast({
        title: "Cannot Delete Ad",
        description: `This ad cannot be deleted for ${timeLeft} more days.`,
        variant: "destructive",
      })
      return
    }

    if (window.confirm("Are you sure you want to delete this ad?")) {
      try {
        await adClient.deleteAd(adId)
        setUserAds(userAds.filter(ad => ad.id !== adId))
        setAdCount(prev => prev - 1)
        toast({
          title: "Success",
          description: "Ad deleted successfully",
        })
      } catch (err) {
        console.error("Error deleting ad:", err)
        toast({
          title: "Error",
          description: "Failed to delete ad. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (!user) {
    return null
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <div>
      <div className="container mx-auto py-8">
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
            <CardDescription>Manage your ads and account information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Username</h3>
                <p className="text-gray-600">{user.username}</p>
                <h3 className="font-semibold">Active Ads</h3>
                <div className="flex items-center gap-2">
                  <p className="text-gray-600">
                    {adCount}/{MAX_ADS_PER_USER} ads posted
                  </p>
                  {adCount >= MAX_ADS_PER_USER && (
                    <span className="text-sm text-red-500">
                      (Maximum limit reached)
                    </span>
                  )}
                </div>
              </div>
              <Button
                onClick={() => router.push("/post-ad")}
                className="bg-magenta-600 hover:bg-magenta-700"
                disabled={adCount >= MAX_ADS_PER_USER}
              >
                {adCount >= MAX_ADS_PER_USER ? "Maximum Ads Reached" : "Post New Ad"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6 mt-8">
          <h2 className="text-2xl font-bold text-primary">My Ads</h2>
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
            ) : userAds.length === 0 ? (
              <div className="text-center text-gray-500">You haven't posted any ads yet</div>
            ) : (
              <div className="space-y-4">
                {userAds.filter(ad => {
                  const now = new Date();
                  const expiresAt = new Date(ad.expires_at);
                  return now < expiresAt;
                }).map((ad) => (
                  <div key={ad.id} className="relative">
                    <AdComponent ad={ad} />
                    <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-gray-50 text-magenta-600 border-magenta-600 hover:text-magenta-700 hover:border-magenta-700 shadow-sm"
                        onClick={() => handleEditAd(ad)}
                        disabled={!canModifyAd(ad)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white hover:bg-gray-50 text-red-600 border-red-600 hover:text-red-700 hover:border-red-700 shadow-sm"
                        onClick={() => handleDeleteAd(ad.id, ad)}
                        disabled={!canModifyAd(ad)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="max-w-3xl mx-auto mt-8">
        <DeleteAccountDialog onConfirm={handleDeleteAccount} />
      </div>
    </div>
  );
}
