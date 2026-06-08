import { CheckCircle2 } from "lucide-react";
import ClientSlider from "@/components/public/ClientSlider";
import BlogSlider from "@/components/public/BlogSlider";

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
      <section className="bg-gradient-to-br from-brand-50 to-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-[30px] font-bold leading-tight tracking-tight text-ink sm:text-[38px]">
              We provide the best solutions to guarantee the future for you and your family!
            </h1>
            <p className="mt-4 text-[15px] text-muted">
              Established in 1995, Nanak Finserv has been dedicated to providing comprehensive insurance and
              financial services that evolve with your needs and the changing times. Over the years we have
              expanded our offerings, refined our processes, and embraced innovation to deliver unparalleled
              value to our customers.
            </p>
            <div className="mt-6 inline-flex items-center gap-3 rounded-xl bg-surface px-5 py-3 shadow-card">
              <span className="text-[28px] font-bold text-brand-600">25</span>
              <span className="text-[13px] leading-tight text-muted">Years of<br />Experience</span>
            </div>
          </div>
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/couple-taking-insurance.jpg" alt="About Nanak Finserv" className="w-full rounded-2xl object-cover shadow-pop" />
          </div>
        </div>
      </section>

      {/* Why choose */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="mb-6 text-[24px] font-bold tracking-tight text-ink">Why Choose Our Solutions?</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {WHY.map((w) => (
            <div key={w} className="flex items-center gap-3 rounded-lg border border-line bg-surface p-4">
              <CheckCircle2 size={18} className="shrink-0 text-brand-600" />
              <span className="text-[14px] text-ink">{w}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-subtle">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-14 sm:px-6 lg:grid-cols-4">
          {STATS.map(([v, l]) => (
            <div key={l} className="ui-card p-6 text-center">
              <div className="text-[24px] font-bold text-brand-600">{v}</div>
              <div className="mt-1 text-[13px] text-muted">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent blogs */}
      <BlogSlider title="Recent Blogs" />

      {/* Trusted companies */}
      <section className="bg-subtle py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-8 text-center text-[24px] font-bold tracking-tight text-brand-700">
            Trusted Companies We are Working With
          </h2>
          <ClientSlider />
        </div>
      </section>
    </>
  );
}
