import "./globals.css";
import { Poppins } from "next/font/google";
import { Toaster } from "react-hot-toast";

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
    <html lang="en" className={poppins.variable} suppressHydrationWarning>
      <head>
        {/* Apply the theme before paint (no flash). Default 'auto' = dark from 6 PM to 6 AM. */}
        <script dangerouslySetInnerHTML={{ __html: "try{var m=localStorage.getItem('theme')||'auto';var h=new Date().getHours();var night=h>=18||h<6;if(m==='dark'||(m==='auto'&&night))document.documentElement.classList.add('dark')}catch(e){}" }} />
      </head>
      <body>
        {children}
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
