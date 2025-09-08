"use client";
import Link, { LinkProps } from "next/link";
import * as React from "react";
import { useLoading } from "@/app/LoadingContext";

// Usage: <AdSystemLink href="/profile" className="...">Profile</AdSystemLink>
import { usePathname } from "next/navigation";

export default function AdSystemLink({ href, children, onClick, ...props }: React.PropsWithChildren<LinkProps & React.AnchorHTMLAttributes<HTMLAnchorElement>>) {
  const { startLoading } = useLoading();
  const pathname = usePathname();
  // Convert href to string if it's an object (for dynamic routes)
  const hrefStr = typeof href === "string" ? href : (typeof href === "object" && "pathname" in href ? href.pathname : "");
  return (
    <Link
      href={href}
      {...props}
      onClick={e => {
        if (pathname !== hrefStr) {
          startLoading();
        }
        if (onClick) onClick(e);
      }}
    >
      {children}
    </Link>
  );
}
