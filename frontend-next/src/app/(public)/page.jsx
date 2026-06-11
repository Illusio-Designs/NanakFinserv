"use client";
import Link from "next/link";
import { ShieldCheck, Headset, BadgeIndianRupee, Zap, Phone, ArrowRight, BadgeCheck, Building2, Sparkles } from "lucide-react";
import ClientSlider from "@/components/public/ClientSlider";
import BlogSlider from "@/components/public/BlogSlider";
import { TiltCard, Depth, ScrollReveal, StaggerReveal, RevealItem, FloatingOrbs } from "@/components/public/Motion3D";
import { CountUp } from "@/components/ui/Motion";

const POINTS = [
  { icon: ShieldCheck, title: "Comprehensive Coverage Options", desc: "A wide range of insurance plans — health, life, auto, home and business. Flexible policies so you get the protection you need without paying for what you don't." },
  { icon: Headset, title: "24/7 Customer Support", desc: "Our dedicated support team is available around the clock to assist with claims, policy changes, and any questions you may have." },
  { icon: BadgeIndianRupee, title: "Affordable & Transparent Pricing", desc: "High-quality coverage at competitive rates, with transparent pricing and no hidden fees — you know exactly what you're paying for." },
  { icon: Zap, title: "Fast & Easy Claims Process", desc: "Simple to file and manage claims for a hassle-free experience — our goal is to get you back on track as quickly as possible." },
];

const FEATURES = [
  { img: "/Assets/customers-world-wide.jpg", title: "We handle customers all over India" },
  { img: "/Assets/customers-world-wide.jpg", title: "Instant Claims Processing" },
  { img: "/Assets/customers-world-wide.jpg", title: "Trusted since 1995 until present" },
];

const STATS = [
  { value: 25, suffix: "+", label: "Years of experience" },
  { value: 10000, suffix: "+", label: "Families protected" },
  { value: 50, suffix: "+", label: "Insurance partners" },
];

export default function HomePage() {
  return (
    <>
      {/* ── Immersive hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-surface to-surface">
        <FloatingOrbs />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
          <div>
            <ScrollReveal y={16}>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-surface/70 px-3 py-1 text-[12px] font-semibold text-brand-700 shadow-card backdrop-blur">
                <Sparkles size={13} /> Trusted financial consultancy since 1995
              </span>
            </ScrollReveal>
            <ScrollReveal y={20} delay={0.05}>
              <h1 className="mt-5 text-[34px] font-bold leading-[1.1] tracking-tight text-ink sm:text-[48px]">
                Secure your future with{" "}
                <span className="text-gradient">Nanak Finserv</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal y={20} delay={0.12}>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted">
                Your one-stop financial consultancy in Rajkot, Gujarat. From the best home loans to
                insurance plans that protect what matters — tailored guidance for every stage of life.
              </p>
            </ScrollReveal>
            <ScrollReveal y={20} delay={0.18}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link href="/services" className="press group inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-[14px] font-semibold text-white shadow-glow transition-colors hover:bg-brand-700">
                  Explore Our Services
                  <ArrowRight size={16} className="transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
                <a href="tel:+919925712341" className="press inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-6 py-3.5 text-[14px] font-semibold text-ink hover:bg-subtle">
                  <Phone size={16} className="text-brand-600" /> Talk to an agent
                </a>
              </div>
            </ScrollReveal>

            {/* Animated stat strip */}
            <StaggerReveal className="mt-10 flex gap-8" gap={0.12}>
              {STATS.map((s) => (
                <RevealItem key={s.label}>
                  <div className="text-[26px] font-bold tracking-tight text-ink tabular-nums">
                    <CountUp value={s.value} format={(n) => n.toLocaleString("en-IN")} />{s.suffix}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted">{s.label}</div>
                </RevealItem>
              ))}
            </StaggerReveal>
          </div>

          {/* 3D tilt hero image with floating depth badges */}
          <ScrollReveal y={28} delay={0.1}>
            <TiltCard className="relative" max={10}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/hero-banner-img.jpg" alt="Nanak Finserv" className="w-full rounded-3xl object-cover shadow-pop" />
              <Depth z={60} className="absolute -left-5 top-8 rounded-2xl glass px-4 py-3 shadow-pop">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><ShieldCheck size={18} /></span>
                  <div>
                    <div className="text-[13px] font-semibold text-ink">100% Secured</div>
                    <div className="text-[11px] text-muted">Certified advisors</div>
                  </div>
                </div>
              </Depth>
              <Depth z={50} className="absolute -bottom-5 -right-4 rounded-2xl bg-brand-700 px-5 py-4 text-center text-white shadow-pop">
                <div className="text-[24px] font-bold leading-none tabular-nums"><CountUp value={25} />+</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-90">Years of trust</div>
              </Depth>
            </TiltCard>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Feature image cards (3D tilt) ──────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {FEATURES.map((feat) => (
            <RevealItem key={feat.title}>
              <TiltCard className="relative h-48 overflow-hidden rounded-3xl shadow-card" max={9}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={feat.img} alt={feat.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                <Depth z={40}>
                  <h5 className="absolute bottom-4 left-4 right-4 text-[15px] font-semibold text-white">{feat.title}</h5>
                </Depth>
              </TiltCard>
            </RevealItem>
          ))}
        </StaggerReveal>
      </section>

      {/* ── About ──────────────────────────────────────────────────────── */}
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <ScrollReveal>
            <TiltCard max={8}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/happy-family.jpg" alt="Secure your family's future" className="w-full rounded-3xl object-cover shadow-pop" />
            </TiltCard>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <span className="inline-flex rounded-full bg-brand-100 px-3 py-1 text-[12px] font-semibold text-brand-700">About Us</span>
            <h2 className="mt-4 text-[28px] font-bold tracking-tight text-ink">
              The best solutions to guarantee the future for you and your family
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              Our mission is to secure your future with insurance solutions that offer complete protection for
              you and your loved ones. From health and life insurance to coverage for your home and vehicle,
              our tailored plans ensure you're prepared for whatever life brings.
            </p>
            <p className="mt-3 text-[14px] leading-relaxed text-muted">
              We customize policies that fit your lifestyle and budget — so you can face the future with
              confidence, knowing you're covered by the best in the business.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Why choose us (3D tilt grid) ───────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <ScrollReveal>
          <h2 className="mb-12 text-center text-[30px] font-bold tracking-tight text-ink">
            Why choose us for your <span className="text-gradient">guaranteed protection?</span>
          </h2>
        </ScrollReveal>
        <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {POINTS.map((p) => {
            const Icon = p.icon;
            return (
              <RevealItem key={p.title}>
                <TiltCard className="ui-card flex h-full gap-4 p-6" max={6}>
                  <Depth z={30} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={22} />
                  </Depth>
                  <div>
                    <h3 className="text-[16px] font-semibold text-ink">{p.title}</h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-muted">{p.desc}</p>
                  </div>
                </TiltCard>
              </RevealItem>
            );
          })}
        </StaggerReveal>
      </section>

      {/* ── Trusted companies ──────────────────────────────────────────── */}
      <section className="bg-subtle py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal>
            <h2 className="mb-8 text-center text-[24px] font-bold tracking-tight text-brand-700">
              Trusted companies we work with
            </h2>
          </ScrollReveal>
          <ClientSlider />
        </div>
      </section>

      {/* ── Contact / value section ────────────────────────────────────── */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <ScrollReveal>
            <h2 className="text-[28px] font-bold tracking-tight text-ink">
              A brighter, more purposeful future — protected
            </h2>
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              We give young people the freedom and security to pursue their passions, knowing their future is
              protected. Comprehensive plans safeguard health, education and financial well-being — so they can
              focus on building a fulfilling life.
            </p>
            <div className="relative mt-8 max-w-md">
              <TiltCard max={9}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Assets/happy-family.jpg" alt="Happy family" className="w-full rounded-3xl object-cover shadow-pop" />
                <Depth z={50} className="absolute -bottom-4 left-4 rounded-2xl bg-brand-700 px-4 py-3 text-center text-white shadow-pop">
                  <div className="text-[20px] font-bold leading-none tabular-nums"><CountUp value={25} /></div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest opacity-90">Years of experience</div>
                </Depth>
              </TiltCard>
            </div>
          </ScrollReveal>

          <StaggerReveal className="space-y-4">
            <RevealItem>
              <TiltCard className="ui-card flex gap-4 p-6" max={6}>
                <BadgeCheck size={28} className="shrink-0 text-brand-600" />
                <div>
                  <h4 className="text-[16px] font-semibold text-ink">Certified Team</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">Trust our expertise to protect what matters most — and experience the peace of mind that comes with working with true professionals.</p>
                </div>
              </TiltCard>
            </RevealItem>
            <RevealItem>
              <TiltCard className="ui-card flex gap-4 p-6" max={6}>
                <Building2 size={28} className="shrink-0 text-brand-600" />
                <div>
                  <h4 className="text-[16px] font-semibold text-ink">Trusted Company</h4>
                  <p className="mt-1 text-[13px] leading-relaxed text-muted">We prioritize transparency in all our dealings, offering clear policies and straightforward advice so you always know what to expect.</p>
                </div>
              </TiltCard>
            </RevealItem>
            <RevealItem>
              <a href="tel:+919925712341" className="press card-hover flex items-center gap-4 rounded-xl border border-line bg-surface p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Phone size={22} /></span>
                <div>
                  <div className="text-[18px] font-bold text-ink">+91 99257 12341</div>
                  <div className="text-[12px] text-muted">Call an agent now</div>
                </div>
              </a>
            </RevealItem>
          </StaggerReveal>
        </div>
      </section>

      {/* ── Recent blogs ───────────────────────────────────────────────── */}
      <BlogSlider title="Recent Insights & Updates" />
    </>
  );
}
