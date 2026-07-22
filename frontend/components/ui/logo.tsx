import Link from "next/link";
import { useEffect, useState } from "react";

export default function Logo({ href }: { href?: string }) {
  const [logoHref, setLogoHref] = useState("/");

  useEffect(() => {
    if (href) {
      setLogoHref(href);
      return;
    }
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        setLogoHref("/dashboard");
      } else {
        setLogoHref("/");
      }
    }
  }, [href]);

  return (
    <Link href={logoHref} className="flex items-center gap-3">
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-lg font-bold text-white shadow-sm">
        D
      </div>

      <div className="flex-shrink-0">
        <h1 className="whitespace-nowrap text-lg font-bold tracking-tight text-gray-900">
          DigiScale
        </h1>

        <p className="whitespace-nowrap text-xs text-gray-500">
          Product Studio
        </p>
      </div>
    </Link>
  );
}