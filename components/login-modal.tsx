"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"

export function LoginModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [telephone, setTelephone] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuth()
  const router = useRouter()

  const validatePhoneNumber = (number: string) => {
    const regex = /^(\+94|0)([0-9]{9})$/
    return regex.test(number)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register"
      const body = isLogin 
        ? { username, password }
        : { username, password, telephone }

      if (!isLogin && !validatePhoneNumber(telephone)) {
        throw new Error("Please enter a valid phone number (e.g., +94771234567 or 0771234567)")
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_AD_BACKEND_URL || "http://localhost:3001/api"}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "An error occurred")
      }

      // Store token and user data
      localStorage.setItem("token", data.token)
      localStorage.setItem("user", JSON.stringify(data.user))
      
      // Update auth context
      setUser(data.user)
      
      // Close modal and refresh page
      onClose()
      router.refresh()
    } catch (err) {
      console.error("Auth error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const toggleMode = () => {
    setIsLogin(!isLogin)
    setError(null)
    setUsername("")
    setPassword("")
    setTelephone("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isLogin ? "Login" : "Register"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="telephone">Telephone Number</Label>
              <Input
                id="telephone"
                type="tel"
                placeholder="+94771234567 or 0771234567"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          )}
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (isLogin ? "Logging in..." : "Registering...") : (isLogin ? "Login" : "Register")}
          </Button>
          <div className="text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-sm text-magenta-600 hover:text-magenta-700"
              disabled={isLoading}
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
