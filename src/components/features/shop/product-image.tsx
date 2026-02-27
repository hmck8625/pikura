"use client";

import Image from "next/image";
import { useState } from "react";

type Props = {
  src: string;
  alt: string;
  designText?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
};

export function ProductImage({
  src,
  alt,
  designText,
  priority = false,
  sizes = "(max-width: 1024px) 100vw, 50vw",
}: Props) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
      {!hasError && (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={sizes}
          priority={priority}
          onError={() => setHasError(true)}
        />
      )}
      {/* プレースホルダー（画像未生成時 or エラー時に表示） */}
      <div
        className={`absolute inset-0 flex items-center justify-center ${hasError ? "" : "opacity-0"}`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-6xl">👕</span>
          <span className="max-w-[200px] text-lg font-bold text-muted-foreground">
            {designText || alt}
          </span>
          <span className="text-sm text-muted-foreground">
            デザインイメージ準備中
          </span>
        </div>
      </div>
    </div>
  );
}
