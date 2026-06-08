import Navbar from "@/components/public/Navbar";
import Footer from "@/components/public/Footer";
import PromoPopup from "@/components/public/PromoPopup";

export default function PublicLayout({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <PromoPopup />
    </div>
  );
}
