import Link from "next/link";
import { ShieldCheck, Headset, BadgeIndianRupee, Zap, Phone, ArrowRight } from "lucide-react";

const POINTS = [
  { icon: ShieldCheck, title: "Comprehensive Coverage Options", desc: "A wide range of insurance plans — health, life, auto, home and business. Flexible policies so you get the protection you need without paying for what you don't." },
  { icon: Headset, title: "24/7 Customer Support", desc: "Our dedicated support team is available around the clock to assist with claims, policy changes, and any questions you may have." },
  { icon: BadgeIndianRupee, title: "Affordable & Transparent Pricing", desc: "High-quality coverage at competitive rates, with transparent pricing and no hidden fees — you know exactly what you're paying for." },
  { icon: Zap, title: "Fast & Easy Claims Process", desc: "Simple to file and manage claims for a hassle-free experience — our goal is to get you back on track as quickly as possible." },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-brand-50 to-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <h1 className="text-[32px] font-bold leading-tight tracking-tight text-ink sm:text-[42px]">
              Welcome to <span className="text-brand-700">Nanak Finserv</span> — Your Trusted Financial Consultancy in Rajkot, Gujarat
            </h1>
            <p className="mt-4 max-w-xl text-[15px] text-muted">
              We specialize in comprehensive financial solutions tailored to your needs. From securing the
              best home loans to protecting your future with insurance plans, we are your one-stop solution
              for financial guidance and consultancy.
            </p>
            <Link href="/services" className="press mt-7 inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-3 text-[14px] font-medium text-white hover:bg-brand-700">
              Explore Our Services <ArrowRight size={16} />
            </Link>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/hero-banner-img.jpg" alt="Nanak Finserv" className="w-full rounded-2xl object-cover shadow-pop" />
          </div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {["We handle customers all over India", "Instant Claims Processing", "Trusted since 1995 until present"].map((t) => (
            <div key={t} className="ui-card flex items-center gap-3 p-5">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-brand-600" />
              <span className="text-[14px] font-medium text-ink">{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/happy-family.jpg" alt="Secure your family's future" className="w-full rounded-2xl object-cover shadow-card" />
          </div>
          <div>
            <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-[12px] font-semibold text-brand-700">About Us</span>
            <h2 className="mt-4 text-[26px] font-bold tracking-tight text-ink">
              We provide the best solutions to guarantee the future for you or your family!
            </h2>
            <p className="mt-4 text-[14px] text-muted">
              Our mission is to secure your future with insurance solutions that offer complete protection for
              you and your loved ones. From health and life insurance to coverage for your home and vehicle,
              our tailored plans ensure you're prepared for whatever life brings.
            </p>
            <p className="mt-3 text-[14px] text-muted">
              We customize policies that fit your lifestyle and budget — so you can face the future with
              confidence, knowing you're covered by the best in the business.
            </p>
          </div>
        </div>
      </section>

      {/* Why choose us */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="mb-10 text-center text-[28px] font-bold tracking-tight text-ink">
          Why choose our services for your guaranteed insurance?
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="ui-card flex gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-ink">{p.title}</h3>
                  <p className="mt-1.5 text-[13px] text-muted">{p.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA with experience badge */}
      <section className="bg-sidebar">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:text-left">
          <div>
            <h2 className="text-[24px] font-bold text-white">25 years of experience — protecting what matters most.</h2>
            <p className="mt-1 text-[14px] text-sidebar-text/70">Talk to our certified team about the right plan for you.</p>
          </div>
          <a href="tel:+919925712341" className="press inline-flex items-center gap-2 rounded-md bg-brand-600 px-6 py-3 text-[14px] font-medium text-white hover:bg-brand-700">
            <Phone size={16} /> +91 99257 12341
          </a>
        </div>
      </section>
    </>
  );
}
