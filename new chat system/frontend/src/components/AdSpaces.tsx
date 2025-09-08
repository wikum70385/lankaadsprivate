import React from "react";
import { DynamicAd } from "../../../../components/DynamicAd";

// Leaderboard ad space (typically 728x90)
export function LeaderboardAd() {
  return (
    <div className="w-full flex justify-center py-2">
      <div className="bg-gray-300 w-full max-w-[728px] h-[90px] flex items-center justify-center rounded shadow-md">
        <DynamicAd position="chat_leaderboard" className="w-full h-full" />
      </div>
    </div>
  );
}

// Two vertical mobile ad spaces (typically 300x250)
export function MobileVerticalAds() {
  return (
    <div className="flex flex-col gap-4 items-center my-4 md:hidden">
      <div className="bg-gray-300 w-[300px] h-[250px] flex items-center justify-center rounded shadow-md">
        <DynamicAd position="chat_mobile_1" className="w-full h-full" />
      </div>
      <div className="bg-gray-300 w-[300px] h-[250px] flex items-center justify-center rounded shadow-md">
        <DynamicAd position="chat_mobile_2" className="w-full h-full" />
      </div>
    </div>
  );
}

// Sliding ad space at the bottom (like main frontend)
export function SlidingAdSpace() {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      if (scrollPosition + windowHeight > documentHeight - 200) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-gray-200 border-t border-magenta-200 shadow-lg transition-transform duration-300 ease-in-out z-50 ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full rounded-t-lg px-4 py-2 flex items-center justify-center shadow-md bg-magenta-700 text-white"
      >
        {isVisible ? (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
            <span>Hide Ad</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" /></svg>
            <span>Show Ad</span>
          </>
        )}
      </button>
      <div className="max-w-[728px] h-[90px] mx-auto bg-gray-300 flex items-center justify-center relative">
        <DynamicAd position="chat_sliding" className="w-full h-full" />
      </div>
    </div>
  );
}
