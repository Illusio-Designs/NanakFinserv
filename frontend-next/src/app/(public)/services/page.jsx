"use client";
import { ShieldCheck, HandCoins, Car, HeartPulse } from "lucide-react";
import LeadForm from "@/components/public/LeadForm";
import ClientSlider from "@/components/public/ClientSlider";
import { TiltCard, Depth, ScrollReveal, StaggerReveal, RevealItem, FloatingOrbs } from "@/components/public/Motion3D";
import { CountUp } from "@/components/ui/Motion";

const SERVICES = [
  { icon: ShieldCheck, title: "Life Insurance", desc: "Life insurance provides financial security to your loved ones in the event of your passing. It ensures they are supported during challenging times, covering expenses such as daily living costs, education, debts, and more." },
  { icon: HandCoins, title: "Loan", desc: "Loan insurance ensures that your outstanding loans are repaid in case of unforeseen events such as death, disability, or job loss. It protects you and your loved ones from the financial burden of unpaid debts." },
  { icon: Car, title: "Vehicle Insurance", desc: "Vehicle insurance provides financial protection for your car, bike, or any motor vehicle in case of accidents, theft, natural disasters, or third-party liabilities. It's not just a legal requirement but also a smart way to safeguard your investment." },
  { icon: HeartPulse, title: "Mediclaim", desc: "Mediclaim insurance provides financial coverage for hospitalization, medical treatments, and related expenses. It ensures you can focus on recovery without worrying about the financial burden of medical bills." },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-50 via-surface to-surface">
        <FloatingOrbs />
        <div className="pointer-events-none absolute inset-0 bg-dots opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2">
          <div>
            <ScrollReveal>
              <h1 className="text-[30px] font-bold leading-[1.12] tracking-tight text-ink sm:text-[38px]">
                Insurance services that have accompanied you <span className="text-gradient">since 1995</span>
              </h1>
            </ScrollReveal>
            <ScrollReveal delay={0.08}>
              <p className="mt-5 text-[14px] leading-relaxed text-muted">
                For nearly three decades, we have been a reliable partner in protecting what matters most to
                individuals, families, and businesses. Our legacy is built on trust, commitment, and delivering
                exceptional insurance solutions tailored to your unique needs.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={0.14}>
              <h3 className="mt-7 text-[18px] font-semibold text-ink">Our journey of excellence</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Since our inception we have provided comprehensive insurance services that evolve with your needs
                and the changing times — expanding our offerings, refining our processes, and embracing innovation
                to deliver unparalleled value.
              </p>
            </ScrollReveal>
          </div>
          <ScrollReveal delay={0.1}>
            <TiltCard className="relative" max={10}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Assets/happy-family.jpg" alt="Nanak Finserv" className="w-full rounded-3xl object-cover shadow-pop" />
              <Depth z={55} className="absolute -bottom-4 -right-4 rounded-2xl bg-brand-700 px-5 py-4 text-center text-white shadow-pop">
                <div className="text-[24px] font-bold leading-none tabular-nums"><CountUp value={25} />+</div>
                <div className="mt-1 text-[10px] uppercase tracking-widest opacity-90">Years experience</div>
              </Depth>
            </TiltCard>
          </ScrollReveal>
        </div>
      </section>

      {/* Trusted companies */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <ScrollReveal><h2 className="mb-8 text-center text-[24px] font-bold tracking-tight text-brand-700">Trusted companies we work with</h2></ScrollReveal>
        <ClientSlider />
      </section>

      {/* Focus services */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <ScrollReveal><h2 className="mb-10 text-center text-[28px] font-bold tracking-tight text-ink">The focus of our <span className="text-gradient">insurance services</span></h2></ScrollReveal>
        <StaggerReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <RevealItem key={s.title}>
                <TiltCard className="ui-card h-full p-6 text-center" max={8}>
                  <Depth z={35} className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Icon size={24} />
                  </Depth>
                  <h3 className="text-[16px] font-semibold text-brand-700">{s.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{s.desc}</p>
                </TiltCard>
              </RevealItem>
            );
          })}
        </StaggerReveal>
      </section>

      {/* Embedded lead form */}
      <section className="px-4 py-14 sm:px-6">
        <ScrollReveal><LeadForm /></ScrollReveal>
      </section>
    </>
  );
}
