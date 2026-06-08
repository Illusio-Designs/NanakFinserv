import { CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="grid items-center gap-10 lg:grid-cols-2">
        <div>
          <h1 className="text-[32px] font-bold tracking-tight text-ink">About NanakFinserv</h1>
          <p className="mt-4 text-[15px] text-muted">
            NanakFinserv is a financial services provider helping individuals and families with loans,
            mediclaim, vehicle and life insurance. We focus on a transparent process, expert guidance, and
            timely service — from onboarding to renewals.
          </p>
          <ul className="mt-6 space-y-3 text-[14px] text-ink">
            {[
              "Personalised advice across loans & insurance",
              "Fast, paperless onboarding",
              "Dedicated support and claim assistance",
              "Proactive renewal reminders",
            ].map((t) => (
              <li key={t} className="flex items-center gap-2">
                <CheckCircle2 size={18} className="text-brand-600" /> {t}
              </li>
            ))}
          </ul>
        </div>
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/Assets/happy-family.jpg" alt="About NanakFinserv" className="w-full rounded-2xl object-cover shadow-pop" />
        </div>
      </div>

      <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["1,200+", "Consumers"],
          ["4", "Service verticals"],
          ["Fast", "Approvals"],
          ["24/7", "Support"],
        ].map(([v, l]) => (
          <div key={l} className="ui-card p-6 text-center">
            <div className="text-[24px] font-bold text-brand-600">{v}</div>
            <div className="mt-1 text-[13px] text-muted">{l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
