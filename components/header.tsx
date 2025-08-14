"use client"

import Link from "next/link"
import AdSystemLink from "@/components/AdSystemLink"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Menu, User, Plus, LogOut, MessageSquare, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { LoginModal } from "./login-modal"
import Image from "next/image"
import { categories } from "@/lib/categories"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoginOpen, setIsLoginOpen] = useState(false)
  const { user, logout } = useAuth()
  const router = useRouter();

  useEffect(() => {
    if (isLoginOpen) {
      document.body.classList.add("dialog-open")
    } else {
      document.body.classList.remove("dialog-open")
    }

    return () => {
      document.body.classList.remove("dialog-open")
    }
  }, [isLoginOpen])

  return (
    <>
      <header className="sticky top-0 z-50 bg-magenta-700 text-white shadow-md">
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <AdSystemLink href="/" className="text-2xl font-bold text-white flex items-center">
              <Image
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20for%20my%20online%20chatroom%20website%20%2C%20adult%20oriented%20theme%2C%20short%20and%20sweet%20%2C%20title%20_%20LankaFriendsChat_%20.%20add%20a%20heart%20shape%20and%20couple%20for%20logo.jpg-gubG437Qg3lM8920arEeNTCKRXUrRd.jpeg"
                alt="LankaAdsPrivate Logo"
                width={32}
                height={32}
                className="mr-2 rounded-sm"
              />
              <span>LankaAdsPrivate</span>
            </AdSystemLink>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              <a href="http://localhost:8080" className="flex items-center text-white hover:text-magenta-100" target="_blank" rel="noopener noreferrer">
                <MessageSquare className="w-5 h-5 mr-2" />
                Chatroom
              </a>
              {user ? (
                <>
                  <AdSystemLink
                    href="/post-ad"
                    className="flex items-center text-magenta-700 bg-white hover:bg-magenta-50 px-4 py-2 rounded-md"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post Ad
                  </AdSystemLink>
                  <AdSystemLink href="/profile" className="text-white hover:text-magenta-100">
                    <User className="w-5 h-5" />
                    <span className="ml-2">My Profile</span>
                  </AdSystemLink>
                  <Button variant="ghost" onClick={() => { logout(); router.push('/'); }} className="text-white hover:text-magenta-100">
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsLoginOpen(true)} className="bg-white text-magenta-700 hover:bg-magenta-50">
                  Login / Register
                </Button>
              )}
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden text-white" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 bg-white text-magenta-700 rounded-b-lg shadow-md absolute right-0 w-40 text-xs z-50">
              <div className="flex flex-col space-y-1 px-2">
                <AdSystemLink
                  href="/"
                  className="flex items-center justify-center px-2 py-1.5 text-magenta-700 hover:bg-magenta-50 border border-magenta-200 rounded-md"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Home
                </AdSystemLink>
                <a
                  href="http://localhost:8080"
                  className="flex items-center justify-center px-2 py-1.5 text-magenta-700 hover:bg-magenta-50 border border-magenta-200 rounded-md"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <MessageCircle className="w-3 h-3 mr-1" />
                  Chatroom
                </a>

                {/* Category Links */}
                <div className="py-1 border-t border-b border-magenta-100 my-1">
                  <p className="text-xs text-gray-500 mb-1 text-center">Categories</p>
                  <div className="space-y-1">
                    {categories.map((category) => (
                      <AdSystemLink
                        key={category.slug}
                        href={`/category/${category.slug}`}
                        className="block py-1 px-2 text-magenta-700 hover:bg-magenta-50 border border-magenta-200 rounded-md text-center"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {category.name}
                      </AdSystemLink>
                    ))}
                  </div>
                </div>

                {user ? (
                  <>
                    <AdSystemLink
                      href="/post-ad"
                      className="flex items-center justify-center text-white bg-magenta-700 hover:bg-magenta-600 py-1.5 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Post Ad
                    </AdSystemLink>
                    <AdSystemLink
                      href="/profile"
                      className="flex items-center justify-center px-2 py-1.5 text-magenta-700 hover:bg-magenta-50 border border-magenta-200 rounded-md"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="w-3 h-3 mr-1" />
                      My Profile
                    </AdSystemLink>
                    <Button
                      variant="outline"
                      className="w-full justify-center text-magenta-700 hover:bg-magenta-50 h-auto py-1.5 border-magenta-200"
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                        router.push('/');
                      }}
                    >
                      <LogOut className="w-3 h-3 mr-1" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={() => {
                      setIsLoginOpen(true)
                      setIsMenuOpen(false)
                    }}
                    className="bg-magenta-700 hover:bg-magenta-600 text-white text-xs py-1.5"
                  >
                    Login / Register
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
    </>
  )
}
