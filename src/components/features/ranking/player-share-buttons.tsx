"use client";

import { Button } from "@/components/ui/button";

type Props = {
  playerName: string;
  bestRank: number;
  bestCategory: string;
  slug: string;
};

export function PlayerShareButtons({
  playerName,
  bestRank,
  bestCategory,
  slug,
}: Props) {
  const pageUrl = `https://pikura.app/players/${encodeURIComponent(slug)}`;
  const shareText = `${playerName} | ${bestCategory} 全国${bestRank}位 - JPA公式ピックルボールランキング`;

  const handleXShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl)}&hashtags=ピックルボール,ピクラ,pickleball`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleLineShare = () => {
    const url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      alert("URLをコピーしました");
    } catch {
      // fallback
      const input = document.createElement("input");
      input.value = pageUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      alert("URLをコピーしました");
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" onClick={handleXShare}>
        Xでシェア
      </Button>
      <Button variant="outline" size="sm" onClick={handleLineShare}>
        LINEでシェア
      </Button>
      <Button variant="outline" size="sm" onClick={handleCopyUrl}>
        URLをコピー
      </Button>
    </div>
  );
}
