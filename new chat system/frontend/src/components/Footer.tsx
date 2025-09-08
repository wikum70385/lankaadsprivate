import { Heart, Facebook, Twitter, Instagram } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="mt-8 bg-magenta-700 text-white relative">
      <div className="container mx-auto px-4 py-8 relative">
        <div className="flex flex-col items-center w-full">
        </div>
        {/* Mobile Ad Spaces just above copyright */}
        <div className="flex flex-col items-center w-full">
        </div>
        <div className="mt-8 pt-8 border-t border-magenta-600 text-center text-sm text-magenta-100">
          <p className="flex items-center justify-center">
            <Heart className="w-4 h-4 mr-2 text-white animate-pulse-glow" />
            &copy; {new Date().getFullYear()} LankaAdsPrivate. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
