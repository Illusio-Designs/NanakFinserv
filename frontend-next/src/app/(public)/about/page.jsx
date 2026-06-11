"use client";
import { CheckCircle2 } from "lucide-react";
import ClientSlider from "@/components/public/ClientSlider";
import BlogSlider from "@/components/public/BlogSlider";
import { TiltCard, Depth, ScrollReveal, StaggerReveal, RevealItem, FloatingOrbs } from "@/components/public/Motion3D";
import { CountUp } from "@/components/ui/Motion";

const STATS = [
  ["1.2 Million", "Loan Insurance customers"],
  ["1.2 Million", "Vehicle Insurance customers"],
  ["1.2 Million", "Life Insurance customers"],
  ["1.2 Million", "Mediclaim Insurance customers"],
];

const WHY = [
  "Comprehensive coverage across loans & insurance",
  "Customised policies for your lifestyle and budget",
  "Transparent pricing with no hidden fees",
  "Dedicated support and fast claims",
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-surface to-surface">
        <FloatingOrbs />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <ScrollReveal>
              <span className="inline-flex rounded-full border border-brand-100 bg-surface/70 px-3 py-1 text-[12px] font-semibold text-brand-700 backdrop-blur">About Us</span>
            </ScrollReveal>
            <ScrollReveal delay={0.06}>
              <h1 className="mt-5 text-[32px] font-bold leading-[1.12] tracking-tight text-ink sm:text-[40px]">
                Guaranteeing the future for <span className="text-gradient">you and your family</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.12}>
              <p className="mt-5 text-[15px] leading-relaxed text-muted">
                Established in 1995, Nanak Finserv has been dedicated to providing comprehensive insurance and
                financial services that evolve with your needs and the changing times. Over the years we have
                expanded our offerings, refined our processes, and embraced innovation to deliver unparalleled
                value to our customers.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.18}>
              <div className="mt-7 inline-flex items-center gap-3 rounded-xl bg-surface px-5 py-3 shadow-lift">
                <span className="text-[30px] font-bold text-brand-600 tabular-nums"><CountUp value={25} /></span>
                <span className="text-[13px] leading-tight text-muted">Years of<br />Experience</span>
              </div>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.1}>
            <TiltCard max={9}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/couple-taking-insurance.jpg" alt="About Nanak Finserv" className="w-full rounded-3xl object-cover shadow-pop" />
            </TiltCard>
          </ScrollReveal>
        </div>
      </section>

      {/* Why choose */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ScrollReveal><h2 className="mb-8 text-[26px] font-bold tracking-tight text-ink">Why choose our solutions?</h2></ScrollReveal>
        <StaggerReveal className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {WHY.map((w) => (
            <RevealItem key={w}>
              <TiltCard className="flex items-center gap-3 rounded-xl border border-line bg-surface p-4" max={5}>
                <CheckCircle2 size={18} className="shrink-0 text-brand-600" />
                <span className="text-[14px] text-ink">{w}</span>
              </TiltCard>
            </RevealItem>
          ))}
        </StaggerReveal>
      </section>

      {/* Stats */}
      <section className="bg-subtle">
        <StaggerReveal className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-16 sm:px-6 lg:grid-cols-4">
          {STATS.map(([v, l]) => (
            <RevealItem key={l}>
              <TiltCard className="ui-card p-6 text-center" max={7}>
                <div className="text-[24px] font-bold text-brand-600">{v}</div>
                <div className="mt-1 text-[13px] text-muted">{l}</div>
              </TiltCard>
            </RevealItem>
          ))}
        </StaggerReveal>
      </section>

      {/* Recent blogs */}
      <BlogSlider title="Recent Blogs" />

      {/* Trusted companies */}
      <section className="bg-subtle py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <ScrollReveal><h2 className="mb-8 text-center text-[24px] font-bold tracking-tight text-brand-700">Trusted companies we work with</h2></ScrollReveal>
          <ClientSlider />
        </div>
      </section>
    </>
  );
}
