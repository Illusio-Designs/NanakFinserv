const LOGOS = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `/Assets/slider${n}.png`);

export default function ClientSlider() {
  const items = [...LOGOS, ...LOGOS]; // duplicated for a seamless loop
  return (
    <div className="marquee-wrap overflow-hidden">
      <div className="flex w-max items-center gap-12 animate-marquee">
        {items.map((src, i) => (
          <div key={i} className="flex h-16 w-32 shrink-0 items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="Insurance partner" className="max-h-full max-w-full object-contain grayscale transition hover:grayscale-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
