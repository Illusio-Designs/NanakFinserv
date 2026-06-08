import Link from "next/link";
import { HandCoins, HeartPulse, Car, ShieldCheck, ArrowRight, CheckCircle2 } from "lucide-react";

const SERVICES = [
  { icon: HandCoins, title: "Loans", desc: "Home, personal and business loans with quick processing and disbursal.", img: "/Assets/loan.png" },
  { icon: HeartPulse, title: "Mediclaim", desc: "Health insurance plans for individuals and families.", img: "/Assets/medicare.png" },
  { icon: Car, title: "Vehicle Insurance", desc: "Comprehensive and third-party cover with easy renewals.", img: "/Assets/loan.png" },
  { icon: ShieldCheck, title: "Life Insurance", desc: "Secure your family's future with the right life cover.", img: "/Assets/life-insurance.png" },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 to-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-3 py-1 text-[12px] font-semibold text-brand-700">
              Trusted financial services
            </span>
            <h1 className="mt-4 text-[34px] font-bold leading-tight tracking-tight text-ink sm:text-[44px]">
              Loans & insurance, <span className="text-brand-600">made simple.</span>
            </h1>
            <p className="mt-4 max-w-lg text-[15px] text-muted">
              NanakFinserv helps you with loans, mediclaim, vehicle and life insurance — fast onboarding,
              transparent process, and timely renewals.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/services" className="press inline-flex items-center gap-2 rounded-md bg-brand-600 px-5 py-3 text-[14px] font-medium text-white hover:bg-brand-700">
                Explore services <ArrowRight size={16} />
              </Link>
              <Link href="/contact" className="press inline-flex items-center gap-2 rounded-md border border-line bg-surface px-5 py-3 text-[14px] font-medium text-ink hover:bg-subtle">
                Talk to us
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
              {["Quick approvals", "Expert guidance", "End-to-end support"].map((t) => (
                <span key={t} className="flex items-center gap-1.5"><CheckCircle2 size={15} className="text-brand-600" /> {t}</span>
              ))}
            </div>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/hero-banner-img.png" alt="NanakFinserv" className="w-full rounded-2xl object-cover shadow-pop" />
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-[28px] font-bold tracking-tight text-ink">Our Services</h2>
          <p className="mt-2 text-[14px] text-muted">Everything you need, under one roof.</p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="ui-card group p-6 transition-shadow hover:shadow-pop">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={24} />
                </div>
                <h3 className="text-[16px] font-semibold text-ink">{s.title}</h3>
                <p className="mt-2 text-[13px] text-muted">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-sidebar">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-12 text-center sm:px-6 md:flex-row md:text-left">
          <div>
            <h2 className="text-[24px] font-bold text-white">Ready to get started?</h2>
            <p className="mt-1 text-[14px] text-sidebar-text/70">Reach out and our team will guide you through the right plan.</p>
          </div>
          <Link href="/contact" className="press rounded-md bg-brand-600 px-6 py-3 text-[14px] font-medium text-white hover:bg-brand-700">
            Contact us
          </Link>
        </div>
      </section>
    </>
  );
}
