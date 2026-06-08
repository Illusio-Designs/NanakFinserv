import { ShieldCheck, HandCoins, Car, HeartPulse } from "lucide-react";
import LeadForm from "@/components/public/LeadForm";
import ClientSlider from "@/components/public/ClientSlider";

const SERVICES = [
  { icon: ShieldCheck, title: "Life Insurance", desc: "Life insurance provides financial security to your loved ones in the event of your passing. It ensures they are supported during challenging times, covering expenses such as daily living costs, education, debts, and more." },
  { icon: HandCoins, title: "Loan", desc: "Loan insurance ensures that your outstanding loans are repaid in case of unforeseen events such as death, disability, or job loss. It protects you and your loved ones from the financial burden of unpaid debts." },
  { icon: Car, title: "Vehicle Insurance", desc: "Vehicle insurance provides financial protection for your car, bike, or any motor vehicle in case of accidents, theft, natural disasters, or third-party liabilities. It's not just a legal requirement but also a smart way to safeguard your investment." },
  { icon: HeartPulse, title: "Mediclaim", desc: "Mediclaim insurance provides financial coverage for hospitalization, medical treatments, and related expenses. It ensures you can focus on recovery without worrying about the financial burden of medical bills." },
];

export default function ServicesPage() {
  return (
    <>
      {/* Hero — two-part text + image with experience badge */}
      <section className="bg-gradient-to-br from-brand-50 to-surface">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2">
          <div>
            <h1 className="text-[30px] font-bold leading-tight tracking-tight text-brand-700 sm:text-[36px]">
              Insurance services that have accompanied since 1995
            </h1>
            <p className="mt-4 text-[14px] text-muted">
              For nearly three decades, we have been a reliable partner in protecting what matters most to
              individuals, families, and businesses. Established in 1995, our legacy is built on trust,
              commitment, and delivering exceptional insurance solutions tailored to your unique needs.
            </p>
            <h3 className="mt-6 text-[18px] font-semibold text-ink">Our Journey of Excellence</h3>
            <p className="mt-2 text-[14px] text-muted">
              Since our inception, we have been dedicated to providing comprehensive insurance services that
              evolve with your needs and the changing times. Over the years, we have expanded our offerings,
              refined our processes, and embraced innovation to ensure we deliver unparalleled value to our
              customers.
            </p>
          </div>
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Assets/happy-family.jpg" alt="Nanak Finserv" className="w-full rounded-2xl object-cover shadow-pop" />
            <div className="absolute bottom-4 right-4 rounded-xl bg-brand-700 px-4 py-3 text-center text-white shadow-lg">
              <div className="text-[20px] font-bold leading-none">25</div>
              <div className="mt-1 text-[10px] uppercase tracking-widest">Years Experience</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted companies */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <h2 className="mb-8 text-center text-[24px] font-bold tracking-tight text-brand-700">
          Trusted Companies We are Working With
        </h2>
        <ClientSlider />
      </section>

      {/* Focus services */}
      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6">
        <h2 className="mb-8 text-center text-[24px] font-bold tracking-tight text-brand-700">
          The focus of our insurance services
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="ui-card p-6 text-center transition-shadow hover:shadow-pop">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                  <Icon size={24} />
                </div>
                <h3 className="text-[16px] font-semibold text-brand-700">{s.title}</h3>
                <p className="mt-2 text-[12.5px] leading-relaxed text-muted">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Embedded lead form */}
      <section className="px-4 py-12 sm:px-6">
        <LeadForm />
      </section>
    </>
  );
}
