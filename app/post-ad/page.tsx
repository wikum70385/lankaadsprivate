"use client"

import type React from "react"
import LoadingSpinner from "@/components/ui/LoadingSpinner"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLoading } from "@/app/LoadingContext"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import { Upload, X } from "lucide-react"
import { categories } from "@/lib/categories"
import { locations } from "@/lib/locations"
import { adClient } from "@/lib/api/ad-client"

// Constants for ad limitations
const MAX_ADS_PER_USER = 4
const AD_EDIT_LOCK_PERIOD = 14 * 24 * 60 * 60 * 1000 // 14 days in milliseconds
const AD_EXPIRATION_PERIOD = 60 * 24 * 60 * 60 * 1000 // 60 days (2 months) in milliseconds

export default function PostAd() {
  // Prefill state
  

  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [images, setImages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [contactNumber, setContactNumber] = useState("")
  const [isWhatsApp, setIsWhatsApp] = useState(false)
  const [isViber, setIsViber] = useState(false)
  const [selectedDistrict, setSelectedDistrict] = useState("")
  const [userAdCount, setUserAdCount] = useState(0)
  const { stopLoading } = useLoading();

  // Prefill state
  

  useEffect(() => {
    // Edit mode: fetch ad data if ?edit=adId is present
    const params = new URLSearchParams(window.location.search);
    const editId = params.get('edit');
    if (editId) {
      adClient.getAd(editId).then(ad => {
        setContactNumber(ad.contact_number || "");
        setIsWhatsApp(ad.is_whatsapp || false);
        setIsViber(ad.is_viber || false);
        setSelectedDistrict(ad.district || "");
        setImages(ad.images || []);
        setTimeout(() => {
          const titleInput = document.getElementById('title') as HTMLInputElement;
          const descInput = document.getElementById('description') as HTMLTextAreaElement;
          const priceInput = document.getElementById('price') as HTMLInputElement;
          const categorySelect = document.getElementById('category') as HTMLSelectElement;
          const citySelect = document.getElementById('city') as HTMLSelectElement;
          if (titleInput) titleInput.value = ad.title || "";
          if (descInput) descInput.value = ad.description || "";
          if (priceInput) priceInput.value = ad.price ? String(ad.price) : "";
          if (categorySelect) categorySelect.value = ad.category || "";
          if (citySelect) citySelect.value = ad.city || "";
        }, 0);
        stopLoading();
      }).catch(() => {
        stopLoading();
      });
    } else {
      stopLoading();
    }

    const fetchUserAdCount = async () => {
      if (user) {
        try {
          const count = await adClient.getUserAdCount()
          setUserAdCount(count)
          stopLoading();
        } catch (error) {
          console.error("Error fetching user ad count:", error)
          toast({
            title: "Error",
            description: "Failed to fetch your ad count. Please try again.",
            variant: "destructive",
          })
          stopLoading();
        }
      } else {
        stopLoading();
      }
    }

    fetchUserAdCount()
  }, [user, toast])

  useEffect(() => {
    if (!user) {
      router.push("/")
      toast({
        title: "Access Denied",
        description: "Please login to post an ad",
        variant: "destructive",
      })
    } else if (userAdCount >= MAX_ADS_PER_USER) {
      toast({
        title: "Maximum Ads Reached",
        description: `You have reached the maximum limit of ${MAX_ADS_PER_USER} active ads. Please delete or let some ads expire before posting new ones.`,
        variant: "destructive",
      })
      router.push("/profile")
    }
  }, [user, router, toast, userAdCount])

  const validatePhoneNumber = (number: string) => {
    // Remove any spaces or special characters
    const cleanNumber = number.replace(/[\s\-\(\)]/g, '')
    
    // Check for Sri Lankan mobile number format
    // Format: +947XXXXXXXX or 07XXXXXXXX
    const regex = /^(\+94|0)7[0-9]{8}$/
    
    if (!regex.test(cleanNumber)) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid Sri Lankan phone number (e.g., +94771234567 or 0771234567)",
        variant: "destructive",
      })
      // Focus the input field
      const input = document.getElementById('contactNumber')
      if (input) {
        input.focus()
      }
      return false
    }
    
    // If number starts with 0, convert to +94 format
    if (cleanNumber.startsWith('0')) {
      setContactNumber('+94' + cleanNumber.slice(1))
    } else {
      setContactNumber(cleanNumber)
    }
    
    return true
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages([reader.result as string])
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Error",
        description: "Please login to post an ad",
        variant: "destructive",
      })
      return
    }

    if (userAdCount >= MAX_ADS_PER_USER) {
      toast({
        title: "Maximum Ads Reached",
        description: `You have reached the maximum limit of ${MAX_ADS_PER_USER} active ads. Please delete or let some ads expire before posting new ones.`,
        variant: "destructive",
      })
      router.push("/profile")
      return
    }

    if (!validatePhoneNumber(contactNumber)) {
      return
    }

    setLoading(true)
    try {
      const form = e.currentTarget
      const adData = {
        title: (form.elements.namedItem('title') as HTMLInputElement).value.trim(),
        description: (form.elements.namedItem('description') as HTMLTextAreaElement).value.trim(),
        price: Number.parseFloat((form.elements.namedItem('price') as HTMLInputElement).value),
        category: (form.elements.namedItem('category') as HTMLSelectElement).value,
        contact_number: contactNumber,
        is_whatsapp: isWhatsApp,
        is_viber: isViber,
        district: (form.elements.namedItem('district') as HTMLSelectElement).value,
        city: (form.elements.namedItem('city') as HTMLSelectElement).value || "",
        images: images,
        user_id: user.id
      };

      // Validate required fields
      if (!adData.title || !adData.description || !adData.price || !adData.category || !adData.district) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        })
        return
      }

      // Validate price
      if (isNaN(adData.price) || adData.price < 0) {
        toast({
          title: "Invalid Price",
          description: "Please enter a valid price",
          variant: "destructive",
        })
        return
      }

      // Check if we're editing an ad
      const params = new URLSearchParams(window.location.search);
      const editId = params.get('edit');
      if (editId) {
        await adClient.updateAd(editId, adData, { bump: true });
        toast({
          title: "Success!",
          description: "Your ad has been updated and bumped to the top.",
        });
        router.push("/profile");
        return;
      }
      await adClient.createAd(adData);
      toast({
        title: "Success!",
        description: "Your ad has been posted. It will be active for 2 months and can be edited after 14 days.",
      });
      router.push("/")
    } catch (error) {
      console.error("Error posting ad:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error posting your ad. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get cities for the selected district
  const getCitiesForDistrict = () => {
    if (!selectedDistrict) return []
    const district = locations.find((loc) => loc.district === selectedDistrict)
    return district ? district.cities : []
  }

  if (!user) return null

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
        <LoadingSpinner size={64} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-primary">Post New Ad</h1>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-4 p-4 bg-primary/10 rounded-lg">
            <h2 className="font-semibold text-primary mb-2">Ad Posting Rules:</h2>
            <ul className="list-disc pl-5 text-sm">
              <li>You can have a maximum of {MAX_ADS_PER_USER} active ads at a time (Current: {userAdCount}/{MAX_ADS_PER_USER})</li>
              <li>Ads cannot be edited for 14 days after posting</li>
              <li>Ads will automatically expire after 2 months</li>
              <li>All required fields must be completed</li>
              <li>Phone number must be in Sri Lankan format</li>
            </ul>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block mb-2 text-primary">
                Title
              </label>
              <Input id="title" required placeholder="Ad title" className="border-primary/30 focus:border-primary" maxLength={100} />
              <p className="text-xs text-gray-500 mt-1">Maximum allowed character length is 100.</p>
            </div>

            <div>
              <label htmlFor="description" className="block mb-2 text-primary">
                Description
              </label>
              <Textarea
                id="description"
                required
                placeholder="Describe your ad"
                className="border-primary/30 focus:border-primary min-h-[250px]"
                rows={10}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1">Maximum allowed character length is 1000.</p>
            </div>

            <div>
              <label htmlFor="category" className="block mb-2 text-primary">
                Category
              </label>
              <select
                id="category"
                required
                className="w-full p-2 border rounded-md border-primary/30 focus:border-primary focus:ring focus:ring-rose-200 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.slug} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="district" className="block mb-2 text-primary">
                District
              </label>
              <select
                id="district"
                required
                className="w-full p-2 border rounded-md border-primary/30 focus:border-primary focus:ring focus:ring-rose-200 text-sm"
                onChange={(e) => {
                  setSelectedDistrict(e.target.value)
                  const form = e.currentTarget.form
                  if (form) {
                    const citySelect = form.elements.namedItem("city") as HTMLSelectElement
                    if (citySelect) {
                      citySelect.value = ""
                    }
                  }
                }}
              >
                <option value="">Select District</option>
                {locations.map((location) => (
                  <option key={location.district} value={location.district}>
                    {location.district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className="block mb-2 text-primary">
                City
              </label>
              <select
                id="city"
                className="w-full p-2 border rounded-md border-primary/30 focus:border-primary focus:ring focus:ring-rose-200 text-sm"
                disabled={!selectedDistrict}
              >
                <option value="">Select City (Optional)</option>
                {getCitiesForDistrict().map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="price" className="block mb-2 text-primary">
                Price (Rs.)
              </label>
              <Input
                id="price"
                required
                type="number"
                placeholder="Price"
                className="border-primary/30 focus:border-primary"
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className="block mb-2 text-primary">
                Contact Number
              </label>
              <Input
                id="contactNumber"
                required
                type="tel"
                placeholder="Enter your phone number (e.g., +94771234567 or 0771234567)"
                value={contactNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  const value = e.target.value
                  setContactNumber(value)
                }}
                onBlur={(e) => {
                  if (e.target.value.length > 0) {
                    validatePhoneNumber(e.target.value)
                  }
                }}
                className="border-primary/30 focus:border-primary"
              />
              <p className="text-sm text-gray-500 mt-1">
                Enter a valid Sri Lankan phone number starting with +94 or 0
              </p>
            </div>

            <div className="flex space-x-4">
              <div className="flex items-center">
                <Checkbox
                  id="isWhatsApp"
                  checked={isWhatsApp}
                  onCheckedChange={(checked) => setIsWhatsApp(checked as boolean)}
                />
                <label htmlFor="isWhatsApp" className="ml-2 text-primary">
                  WhatsApp
                </label>
              </div>
              <div className="flex items-center">
                <Checkbox
                  id="isViber"
                  checked={isViber}
                  onCheckedChange={(checked) => setIsViber(checked as boolean)}
                />
                <label htmlFor="isViber" className="ml-2 text-primary">
                  Viber
                </label>
              </div>
            </div>

            <div>
              <label className="block mb-2 text-primary">Image</label>
              <div className="grid grid-cols-1 gap-4 mb-4">
                {images.length > 0 ? (
                  <div className="relative aspect-square group">
                    <Image
                      src={images[0] || "/placeholder.svg"}
                      alt="Upload"
                      fill
                      className="object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => setImages([])}
                      className="absolute top-2 right-2 bg-primary text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="aspect-square relative">
                    <label className="absolute inset-0 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer hover:bg-primary/10 border-primary/30">
                      <Upload className="h-8 w-8 text-primary/80 mb-2" />
                      <p className="text-sm text-primary/80">Add Image</p>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </label>
                  </div>
                )}
              </div>
              <p className="text-sm text-primary/80">You can upload 1 image.</p>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
              {loading ? "Posting..." : "Post Ad"}
            </Button>
          </form>
        </div>
      </div>
    
  </div>
  )
}
