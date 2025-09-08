import { Ad } from "@/types/ad"

const API_URL = process.env.NEXT_PUBLIC_AD_BACKEND_URL || "http://localhost:3001/api"

export const adClient = {
  async getAds(): Promise<Ad[]> {
    const response = await fetch(`${API_URL}/ads`)
    if (!response.ok) {
      throw new Error("Failed to fetch ads")
    }
    return response.json()
  },

  async getAd(id: string): Promise<Ad> {
    const response = await fetch(`${API_URL}/ads/${id}`)
    if (!response.ok) {
      throw new Error("Failed to fetch ad")
    }
    return response.json()
  },

  async createAd(ad: Omit<Ad, "id" | "created_at" | "edit_locked_until" | "expires_at" | "status">): Promise<{ id: string }> {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("Not authenticated")
    }

    try {
      const response = await fetch(`${API_URL}/ads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(ad),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.error === 'Missing required fields') {
          const missingFields = Object.entries(data.details)
            .filter(([_, isMissing]) => isMissing)
            .map(([field]) => field)
            .join(', ')
          throw new Error(`Missing required fields: ${missingFields}`)
        }
        if (data.error === 'Invalid price value') {
          throw new Error('Please enter a valid price')
        }
        if (data.error === 'Maximum number of active ads reached') {
          throw new Error('You have reached the maximum number of active ads')
        }
        if (data.details) {
          throw new Error(`${data.error}: ${data.details}`)
        }
        throw new Error(data.error || `Failed to create ad: ${response.status} ${response.statusText}`)
      }

      return data
    } catch (error) {
      if (error instanceof Error) {
        throw error
      }
      throw new Error("Failed to create ad: Network error")
    }
  },

  async updateAd(id: string, ad: Partial<Ad>, options?: { bump?: boolean }): Promise<void> {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/ads/${id}?bump=${options?.bump ? '1' : '0'}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(ad),
    })

    if (!response.ok) {
      throw new Error("Failed to update ad")
    }
  },

  async deleteAd(id: string): Promise<void> {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/ads/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete ad")
    }
  },

  async deleteAccount(): Promise<void> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Not authenticated");
    }
    const response = await fetch(`${API_URL}/users/delete-account`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.error || "Failed to delete account");
    }
    return;
  },

  async republishAd(id: string): Promise<void> {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/ads/${id}/republish`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to republish ad")
    }
  },

  async getUserAds(): Promise<Ad[]> {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/ads/user/ads`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user ads")
    }

    return response.json()
  },

  async getUserAdCount(): Promise<number> {
    const token = localStorage.getItem("token")
    if (!token) {
      throw new Error("Not authenticated")
    }

    const response = await fetch(`${API_URL}/ads/user/count`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      throw new Error("Failed to fetch user ad count")
    }

    const data = await response.json()
    return data.count
  }
} 