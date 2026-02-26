import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "ピクラのプライバシーポリシーです。",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">プライバシーポリシー</h1>
      <div className="space-y-6 text-sm text-muted-foreground">
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            1. 個人情報の取得
          </h2>
          <p>
            当サービスは、利用登録時にメールアドレス、表示名などの個人情報を
            取得します。また、OAuth認証を通じてGoogleアカウントまたは
            LINEアカウントの基本情報を取得する場合があります。
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            2. 個人情報の利用目的
          </h2>
          <p>
            取得した個人情報は、サービスの提供・運営、ユーザー認証、
            お問い合わせへの対応、サービスの改善のために利用します。
          </p>
        </section>
        <section>
          <h2 className="mb-3 text-lg font-semibold text-foreground">
            3. 個人情報の第三者提供
          </h2>
          <p>
            当サービスは、法令に基づく場合を除き、ユーザーの同意なく
            個人情報を第三者に提供することはありません。
          </p>
        </section>
        <p className="pt-4 text-xs">最終更新日: 2026年2月26日</p>
      </div>
    </div>
  );
}
