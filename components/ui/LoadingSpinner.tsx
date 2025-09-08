import React from "react";

export default function LoadingSpinner({ size = 40, color = "#D72660", className = "" }: { size?: number, color?: string, className?: string }) {
  return (
    <div className={"flex items-center justify-center " + className}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 50 50"
        className="animate-spin"
        style={{ display: 'block' }}
      >
        <circle
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke={color}
          strokeWidth="5"
          strokeDasharray="31.415, 31.415"
          strokeLinecap="round"
        />
      </svg>
      <span className="sr-only">Loading...</span>
    </div>
  );
}
