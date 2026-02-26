import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "利用規約",
  description: "ピクラの利用規約です。",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">利用規約</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            第1条（適用）
          </h2>
          <p>
            本規約は、ピクラ（以下「本サービス」）の利用に関する条件を定めるものです。
            ユーザーの皆さまは、本規約に同意の上、本サービスを利用するものとします。
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            第2条（利用登録）
          </h2>
          <p>
            本サービスの利用を希望する方は、所定の方法により利用登録を行うものとします。
            利用登録は、運営が申請を承認した時点で完了するものとします。
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            第3条（禁止事項）
          </h2>
          <p>
            ユーザーは、本サービスの利用にあたり、法令に違反する行為、
            他のユーザーに迷惑をかける行為、サービスの運営を妨害する行為を
            行ってはなりません。
          </p>
        </section>
        <p className="pt-4 text-xs">最終更新日: 2026年2月26日</p>
      </div>
    </div>
  );
}
