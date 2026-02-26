import { Header } from "@/components/layouts/header";
import { Footer } from "@/components/layouts/footer";

export default function MypageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
