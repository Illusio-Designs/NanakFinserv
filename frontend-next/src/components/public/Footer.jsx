"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Phone, Mail, Facebook, Instagram, Twitter, Youtube } from "lucide-react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const subscribe = (e) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("Enter a valid email");
    toast.success("Subscribed!");
    setEmail("");
  };

  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2">
        {/* Left — brand + contact */}
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Assets/logo.png" alt="Nanak Finserv" className="h-11 object-contain" />
          <p className="mt-4 max-w-md text-[13px] leading-relaxed text-muted">
            We understand that life is full of unexpected events, and protecting your loved ones and
            assets is a top priority.
          </p>
          <div className="mt-5 space-y-3">
            <a href="tel:+919925712341" className="flex items-center gap-3 text-[14px] text-ink hover:text-brand-600">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Phone size={16} /></span>
              <span><span className="text-muted">Have a question?</span> <strong>+91 99257 12341</strong></span>
            </a>
            <a href="mailto:info@nanakfinserv.com" className="flex items-center gap-3 text-[14px] text-ink hover:text-brand-600">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-50 text-brand-600"><Mail size={16} /></span>
              <span><span className="text-muted">Contact us at</span> <strong>info@nanakfinserv.com</strong></span>
            </a>
          </div>
        </div>

        {/* Right — newsletter + socials */}
        <div className="lg:pl-8">
          <h4 className="text-[16px] font-semibold text-ink">Newsletter</h4>
          <p className="mt-2 max-w-md text-[13px] text-muted">
            Be the first to know about discounts, offers and events weekly in your mailbox. Unsubscribe
            whenever you like with one click.
          </p>
          <form onSubmit={subscribe} className="mt-4 flex max-w-md gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="ui-control flex-1"
            />
            <button type="submit" className="press rounded-md bg-brand-600 px-5 text-[14px] font-medium text-white hover:bg-brand-700">
              SUBMIT
            </button>
          </form>
          <div className="mt-5 flex gap-2">
            {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
              <a key={i} href="#" className="press flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700">
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-line py-4 text-center text-[12px] text-muted">
        © {new Date().getFullYear()} All Rights Reserved. Design &amp; Developed by Illusio Designs.
      </div>
    </footer>
  );
}
