import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Menu, User, Plus, LogOut, MessageSquare, MessageCircle } from "lucide-react";
// NOTE: Replace these imports with your own UI components or adjust as needed
// import { Button } from "@/components/ui/button";
// import { useAuth } from "@/contexts/auth-context";
// import { LoginModal } from "./login-modal";
// import Image from "next/image";
// import { categories } from "@/lib/categories";

export function Header() {

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  // const { user, logout } = useAuth();
  const user = false;
  const logout = () => {};
  const categories = [
    { slug: "male-personals", name: "Male Personals" },
    { slug: "female-personals", name: "Female Personals" },
    { slug: "massage", name: "Massage" },
    { slug: "toys", name: "Toys" },
    { slug: "rooms-hotels", name: "Rooms/Hotels" },
    { slug: "job-vacancy", name: "Job Vacancy" }
  ];

  useEffect(() => {
    if (isLoginOpen) {
      document.body.classList.add("dialog-open");
    } else {
      document.body.classList.remove("dialog-open");
    }
    return () => {
      document.body.classList.remove("dialog-open");
    };
  }, [isLoginOpen]);

  return (
    <>
      <header className="sticky top-0 z-50 bg-magenta-700 text-white shadow-md">
        <div className="container mx-auto px-4 relative">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <a href="http://localhost:3000" className="text-2xl font-bold text-white flex items-center">
              <img
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo%20for%20my%20online%20chatroom%20website%20%2C%20adult%20oriented%20theme%2C%20short%20and%20sweet%20%2C%20title%20_%20LankaFriendsChat_%20.%20add%20a%20heart%20shape%20and%20couple%20for%20logo.jpg-gubG437Qg3lM8920arEeNTCKRXUrRd.jpeg"
                alt="LankaAdsPrivate Logo"
                width={32}
                height={32}
                className="mr-2 rounded-sm"
              />
              <span>LankaAdsPrivate</span>
            </a>
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to="/post-ad"
                    className="flex items-center text-magenta-700 bg-white hover:bg-magenta-50 px-4 py-2 rounded-md"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Post Ad
                  </Link>
                  <Link to="/profile" className="text-white hover:text-magenta-100">
                    <User className="w-5 h-5" />
                    <span className="ml-2">My Profile</span>
                  </Link>
                  <button className="text-white hover:text-magenta-100" onClick={logout}>
                    <LogOut className="w-5 h-5 mr-2" />
                    Logout
                  </button>
                </>
              ) : null}
            </nav>

          </div>
        </div>
      </header>
      {/* LoginModal code would go here if needed */}
    </>
  );
}
