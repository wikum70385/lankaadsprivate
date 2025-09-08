import Link from "next/link"
import AdSystemLink from "@/components/AdSystemLink"
import { Heart, Facebook, Twitter, Instagram } from "lucide-react"

export function Footer() {
  return (
    <footer className="mt-8 bg-magenta-700 text-white relative">
      <div className="container mx-auto px-4 py-8 relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold mb-4 text-white">About</h3>
            <ul className="space-y-2 text-sm text-magenta-100">
              <li>
                <AdSystemLink href="/about" className="hover:text-white transition-colors">
                  About Us
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/terms" className="hover:text-white transition-colors">
                  Terms of Use
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </AdSystemLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">Support</h3>
            <ul className="space-y-2 text-sm text-magenta-100">
              <li>
                <AdSystemLink href="/contact" className="hover:text-white transition-colors">
                  Contact Us
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/faq" className="hover:text-white transition-colors">
                  FAQ
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/safety" className="hover:text-white transition-colors">
                  Safety Tips
                </AdSystemLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">Categories</h3>
            <ul className="space-y-2 text-sm text-magenta-100">
              <li>
                <AdSystemLink href="/category/male-personals" className="hover:text-white transition-colors">
                  Male Personals
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/category/female-personals" className="hover:text-white transition-colors">
                  Female Personals
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/category/massage" className="hover:text-white transition-colors">
                  Massage
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/category/toys" className="hover:text-white transition-colors">
                  Toys
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/category/rooms-hotels" className="hover:text-white transition-colors">
                  Rooms/Hotels
                </AdSystemLink>
              </li>
              <li>
                <AdSystemLink href="/category/job-vacancy" className="hover:text-white transition-colors">
                  Job Vacancy
                </AdSystemLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4 text-white">Connect</h3>
            <ul className="space-y-2 text-sm text-magenta-100">
              <li>
                <a
                  href="https://www.facebook.com/lankaadsprivate70385"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-white transition-colors"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </a>
              </li>
              <li>
                <a
                  href="https://www.twitter.com/lankaadsprivate70385"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-white transition-colors"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </a>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/lankaadsprivate70385"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-white transition-colors"
                >
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-magenta-600 text-center text-sm text-magenta-100">
          <p className="flex items-center justify-center">
            <Heart className="w-4 h-4 mr-2 text-white animate-pulse-glow" />
            &copy; {new Date().getFullYear()} LankaAdsPrivate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
