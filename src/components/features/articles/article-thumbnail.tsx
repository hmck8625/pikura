"use client";

import Image from "next/image";
import { useState } from "react";

const categoryIconLabels: Record<string, string> = {
  beginner: "入",
  rules: "ル",
  gear: "ギ",
  events: "大",
  tips: "戦",
  players: "選",
};

const categoryLabels: Record<string, string> = {
  beginner: "入門",
  rules: "ルール",
  gear: "ギア",
  events: "大会",
  tips: "戦術",
  players: "選手",
};

function Placeholder({ category }: { category: string }) {
  const label = categoryIconLabels[category] ?? "記";
  return (
    <div className="flex h-full w-full items-center justify-center bg-muted">
      <div className="flex flex-col items-center gap-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
          {label}
        </span>
        <span className="text-xs text-muted-foreground">
          {categoryLabels[category] ?? "記事"}
        </span>
      </div>
    </div>
  );
}

type ArticleThumbnailProps = {
  src: string;
  alt: string;
  category: string;
};

export function ArticleThumbnail({ src, alt, category }: ArticleThumbnailProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <Placeholder category={category} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
      onError={() => setHasError(true)}
    />
  );
}
