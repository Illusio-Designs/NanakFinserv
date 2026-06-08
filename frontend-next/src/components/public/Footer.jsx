import Link from "next/link";
import { Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-text">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-12 sm:px-6 md:grid-cols-4">
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Assets/footerlogo.png" alt="NanakFinserv" className="mb-4 h-10 object-contain" />
          <p className="text-[13px] text-sidebar-text/70">
            Your trusted partner for loans, mediclaim, vehicle and life insurance.
          </p>
        </div>
        <div>
          <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-white">Services</h4>
          <ul className="space-y-2 text-[13px] text-sidebar-text/70">
            <li>Loans</li>
            <li>Mediclaim</li>
            <li>Vehicle Insurance</li>
            <li>Life Insurance</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-white">Company</h4>
          <ul className="space-y-2 text-[13px] text-sidebar-text/70">
            <li><Link href="/about" className="hover:text-white">About</Link></li>
            <li><Link href="/services" className="hover:text-white">Services</Link></li>
            <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link href="/login" className="hover:text-white">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 text-[13px] font-semibold uppercase tracking-wide text-white">Contact</h4>
          <ul className="space-y-2 text-[13px] text-sidebar-text/70">
            <li className="flex items-center gap-2"><Phone size={14} /> +91 76000 46416</li>
            <li className="flex items-center gap-2"><Mail size={14} /> info@nanakfinserv.com</li>
            <li className="flex items-center gap-2"><MapPin size={14} /> India</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[12px] text-sidebar-text/50">
        © {new Date().getFullYear()} NanakFinserv. All rights reserved.
      </div>
    </footer>
  );
}
