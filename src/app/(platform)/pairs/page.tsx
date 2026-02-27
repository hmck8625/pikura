import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "ペア募集（準備中）",
  description:
    "ピックルボールのダブルス大会に向けたペア募集機能。現在開発中です。ピクラでパートナーを見つけよう。",
  alternates: {
    canonical: "/pairs",
  },
  openGraph: {
    title: "ペア募集（準備中） | ピクラ",
    description:
      "ピックルボールのダブルス大会に向けたペア募集機能。現在開発中です。",
    images: ["/api/og?type=default"],
  },
};

const upcomingFeatures = [
  {
    title: "大会別パートナー検索",
    description:
      "出場したい大会を選んで、同じ大会に出たいパートナーを探せます。レベルや地域で絞り込み可能。",
  },
  {
    title: "プロフィール公開",
    description:
      "自分のレベル、得意なプレースタイル、練習場所などを公開して、相性の良いパートナーとマッチング。",
  },
  {
    title: "募集投稿・応募",
    description:
      "「○○大会のミックスダブルスでパートナー募集中！」など、自由に募集を投稿。興味がある人がワンクリックで応募。",
  },
  {
    title: "メッセージ機能",
    description:
      "マッチしたら、サイト内で直接メッセージのやりとり。練習日程の調整もスムーズに。",
  },
];

const pikuraFeatures = [
  {
    title: "JPA公式ランキング",
    description:
      "124名の選手データを無料閲覧。男女シングルス・ダブルス、ミックス、年齢区分別に検索可能。",
    href: "/rankings",
    badge: "公開中",
  },
  {
    title: "イベント情報",
    description:
      "JPA・テニスベア・PJFの大会・体験会・練習会を一覧。地図表示・レベル別フィルターで自分に合うイベントを発見。",
    href: "/events",
    badge: "公開中",
  },
  {
    title: "入門ガイド・戦術記事",
    description:
      "ルール解説、ギアレビュー、戦術テクニックなど、初心者から上級者まで役立つ記事を掲載。",
    href: "/articles",
    badge: "公開中",
  },
  {
    title: "ピクラ ショップ",
    description:
      "ピックルボールあるあるネタTシャツや、アート系デザインシャツを販売。コートで目立つ一着を。",
    href: "/shop",
    badge: "公開中",
  },
];

export default function PairsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* ヘッダー */}
      <div className="mx-auto max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4 text-sm">
          準備中
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          ペア募集
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          「大会に出たいけど、パートナーがいない…」
          <br />
          そんな悩みを解決するペアマッチング機能を開発中です。
        </p>
      </div>

      {/* 実装予定の機能 */}
      <section className="mx-auto mt-12 max-w-4xl">
        <h2 className="mb-6 text-center text-xl font-bold sm:text-2xl">
          こんなことができるようになります
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {upcomingFeatures.map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <CardTitle className="text-base">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="mx-auto my-12 max-w-4xl" />

      {/* ピクラの他の機能紹介 */}
      <section className="mx-auto max-w-4xl">
        <h2 className="mb-2 text-center text-xl font-bold sm:text-2xl">
          ピクラでできること
        </h2>
        <p className="mb-6 text-center text-sm text-muted-foreground">
          ペア募集機能の完成を待つ間、ピクラの他の機能をぜひご活用ください。
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {pikuraFeatures.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group">
              <Card className="h-full transition-colors group-hover:bg-muted/50">
                <CardHeader>
                  <div className="mb-1 flex items-center gap-2">
                    <CardTitle className="text-base group-hover:text-primary">
                      {feature.title}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className="border-green-300 text-green-700"
                    >
                      {feature.badge}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="mx-auto mt-12 max-w-md text-center">
        <p className="mb-4 text-sm text-muted-foreground">
          ペア募集機能のリリースは、サイト内でお知らせします。
          <br />
          まずはピクラの他の機能をチェックしてみてください。
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/events">イベントを探す</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/rankings">ランキングを見る</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
