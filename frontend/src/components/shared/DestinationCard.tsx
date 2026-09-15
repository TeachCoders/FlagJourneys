import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface DestinationCardProps {
  title: string;
  image?: string;
  subtitle?: ReactNode;
  tag?: string;
  href: string;
  className?: string;
}

export default function DestinationCard({
  title,
  image,
  subtitle,
  tag,
  href,
  className,
}: DestinationCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-end",
        "h-[190px] sm:h-[220px]",
        className
      )}
    >
      {image ? (
        <Image
          src={image}
          alt={`${title} Tour Packages & Sightseeing | Flag Journeys`}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1C1C1C] via-[#243b3b] to-[#1C1C1C] flex items-center justify-center">
          <Image src="/logo.png" alt="Flag Journeys" width={90} height={90} className="opacity-35 object-contain filter drop-shadow-md brightness-200" style={{ width: "auto", height: "auto" }} />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
      {tag && (
        <div className="tag-badge absolute top-3 left-3">
          <span>{tag}</span>
        </div>
      )}
      <div className="relative z-10 p-4 text-center text-white">
        <h3 className="h6 text-white capitalize">{title}</h3>
        {subtitle && (
          <p className="mt-1.5 inline-flex items-center justify-center gap-1.5 rounded-full bg-black/45 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-white">
            {subtitle}
          </p>
        )}
      </div>
    </Link>
  );
}
