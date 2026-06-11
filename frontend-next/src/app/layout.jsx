import "./globals.css";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Providers from "./providers";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata = {
  title: "NanakFinserv CRM",
  description: "Production CRM for loans, mediclaim, vehicle & life insurance.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={poppins.variable}>
      <body>
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: "#111827", color: "#fff", fontSize: "13px", borderRadius: "10px" },
          }}
        />
      </body>
    </html>
  );
}
