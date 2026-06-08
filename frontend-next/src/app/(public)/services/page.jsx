import { HandCoins, HeartPulse, Car, ShieldCheck } from "lucide-react";

const SERVICES = [
  { icon: HandCoins, title: "Loans", points: ["Home & property loans", "Personal loans", "Business loans", "Quick disbursal"] },
  { icon: HeartPulse, title: "Mediclaim", points: ["Individual & family floater", "Cashless hospitals", "Renewal reminders", "Claim assistance"] },
  { icon: Car, title: "Vehicle Insurance", points: ["Comprehensive cover", "Third-party cover", "Easy renewals", "Add-on covers"] },
  { icon: ShieldCheck, title: "Life Insurance", points: ["Term plans", "Savings plans", "Nominee protection", "Flexible premiums"] },
];

export default function ServicesPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
      <div className="mb-10 text-center">
        <h1 className="text-[32px] font-bold tracking-tight text-ink">Services</h1>
        <p className="mt-2 text-[15px] text-muted">Comprehensive financial & insurance solutions.</p>
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {SERVICES.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="ui-card p-7">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={24} />
                </div>
                <h2 className="text-[18px] font-semibold text-ink">{s.title}</h2>
              </div>
              <ul className="grid grid-cols-2 gap-2 text-[13px] text-muted">
                {s.points.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-600" /> {p}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
