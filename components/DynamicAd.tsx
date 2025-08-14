"use client";

import React, { useEffect, useState } from "react";

interface DynamicAdProps {
  position: string;
  className?: string;
  adIndex?: number;
}

export function DynamicAd({ position, className, adIndex }: DynamicAdProps) {
  const [adCode, setAdCode] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      fetch("/ads-config.json")
        .then((res) => res.json())
        .then((config) => {
          const value = config[position];
          if (Array.isArray(value)) {
            let idx = 0;
            if (typeof adIndex === "number") {
              idx = adIndex % value.length;
            } else {
              idx = Math.floor(Math.random() * value.length);
            }
            setAdCode(value[idx] || "");
          } else {
            setAdCode(value || "");
          }
        })
        .catch(() => setAdCode(""));
    }
  }, [position, adIndex]);

  if (!adCode) {
    return null;
  }

  return (
    <div className={className} dangerouslySetInnerHTML={{ __html: adCode }} />
  );
};
